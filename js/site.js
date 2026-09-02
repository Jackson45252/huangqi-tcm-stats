"use strict";

const DATA_URL = "./data/players.json";
const DEFAULT_EVENT_ID = 353;
const DEFAULT_GROUP_ID = 715;
const DEFAULT_TEAM_ID = 1789;

const state = {
  allPlayers: [],
  events: [],
  groups: [],
  teams: [],
  players: [],
  selectedEventId: null,
  selectedGroupId: null,
  selectedTeamId: null,
  query: "",
  sortKey: "EffAvg"
};

const elements = {
  seasonName: document.querySelector("#seasonName"),
  teamInitial: document.querySelector("#teamInitial"),
  groupMark: document.querySelector("#groupMark"),
  teamName: document.querySelector("#teamName"),
  eventSelect: document.querySelector("#eventSelect"),
  groupSelect: document.querySelector("#groupSelect"),
  teamSelect: document.querySelector("#teamSelect"),
  updatedAt: document.querySelector("#updatedAt"),
  playerCount: document.querySelector("#playerCount"),
  playerSearch: document.querySelector("#playerSearch"),
  sortSelect: document.querySelector("#sortSelect"),
  statusMessage: document.querySelector("#statusMessage"),
  tablePanel: document.querySelector("#tablePanel"),
  tableBody: document.querySelector("#playerTableBody"),
  playerCards: document.querySelector("#playerCards"),
  emptyMessage: document.querySelector("#emptyMessage"),
  leaderNote: document.querySelector("#leaderNote"),
  tableCaption: document.querySelector("#tableCaption")
};

const leaderFields = [
  { key: "PAvg", nameId: "pointsName", valueId: "pointsValue" },
  { key: "TRebAvg", nameId: "reboundsName", valueId: "reboundsValue" },
  { key: "AstAvg", nameId: "assistsName", valueId: "assistsValue" },
  { key: "EffAvg", nameId: "efficiencyName", valueId: "efficiencyValue" }
];

function numeric(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function decimal(value) {
  return numeric(value).toFixed(1);
}

function percentage(value) {
  return decimal(value) + "%";
}

function text(value) {
  return value == null ? "" : String(value);
}

function formatUpdatedAt(value) {
  if (!value) return "更新時間未知";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "更新時間未知";

  return "更新於 " + new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
}

function appendCell(row, value, className = "") {
  const cell = document.createElement("td");
  cell.textContent = value;
  if (className) cell.className = className;
  row.append(cell);
}

function appendShotCell(row, made, attempted, percent) {
  const cell = document.createElement("td");
  const shots = document.createElement("span");
  const rate = document.createElement("span");

  shots.className = "shot-line";
  shots.textContent = decimal(made) + " / " + decimal(attempted);
  rate.className = "shot-percent";
  rate.textContent = percentage(percent);

  cell.append(shots, rate);
  row.append(cell);
}

function createStat(value, label) {
  const wrapper = document.createElement("div");
  const strong = document.createElement("strong");
  const small = document.createElement("small");

  wrapper.className = "player-card__stat";
  strong.textContent = decimal(value);
  small.textContent = label;
  wrapper.append(strong, small);
  return wrapper;
}

function createShootingStat(label, value) {
  const item = document.createElement("span");
  item.textContent = label + " " + percentage(value);
  return item;
}

function createPlayerCard(player) {
  const article = document.createElement("article");
  const head = document.createElement("div");
  const name = document.createElement("h3");
  const games = document.createElement("span");
  const stats = document.createElement("div");
  const shooting = document.createElement("div");

  article.className = "player-card";
  head.className = "player-card__head";
  stats.className = "player-card__stats";
  shooting.className = "player-card__shooting";

  name.textContent = player.PlayerName;
  games.textContent = numeric(player.GameCount) + " 場";
  head.append(name, games);

  stats.append(
    createStat(player.PAvg, "得分"),
    createStat(player.TRebAvg, "籃板"),
    createStat(player.AstAvg, "助攻"),
    createStat(player.EffAvg, "效率")
  );

  shooting.append(
    createShootingStat("2P", player.TwoPPercent),
    createShootingStat("3P", player.ThreePPercent),
    createShootingStat("FT", player.FTPercent)
  );

  article.append(head, stats, shooting);
  return article;
}

function getVisiblePlayers() {
  const query = state.query.trim().toLocaleLowerCase("zh-Hant");
  const filtered = state.players.filter((player) =>
    text(player.PlayerName).toLocaleLowerCase("zh-Hant").includes(query)
  );

  return filtered.sort((left, right) => {
    if (state.sortKey === "PlayerName") {
      return text(left.PlayerName).localeCompare(text(right.PlayerName), "zh-Hant");
    }

    return (
      numeric(right[state.sortKey]) - numeric(left[state.sortKey]) ||
      numeric(right.GameCount) - numeric(left.GameCount) ||
      text(left.PlayerName).localeCompare(text(right.PlayerName), "zh-Hant")
    );
  });
}

function renderRoster() {
  const players = getVisiblePlayers();
  const rows = document.createDocumentFragment();
  const cards = document.createDocumentFragment();

  elements.tableBody.replaceChildren();
  elements.playerCards.replaceChildren();

  players.forEach((player) => {
    const row = document.createElement("tr");

    appendCell(row, player.PlayerName);
    appendCell(row, numeric(player.GameCount));
    appendCell(row, decimal(player.PAvg), "number-primary");
    appendCell(row, decimal(player.TRebAvg));
    appendCell(row, decimal(player.AstAvg));
    appendCell(row, decimal(player.StlAvg));
    appendCell(row, decimal(player.BlkAvg));
    appendCell(row, decimal(player.TovAvg));
    appendCell(row, decimal(player.EffAvg), "number-primary");
    appendShotCell(row, player.TwoPMadeAvg, player.TwoPAttemptAvg, player.TwoPPercent);
    appendShotCell(row, player.ThreePMadeAvg, player.ThreePAttemptAvg, player.ThreePPercent);
    appendShotCell(row, player.FTMadeAvg, player.FTAttemptAvg, player.FTPercent);

    rows.append(row);
    cards.append(createPlayerCard(player));
  });

  elements.tableBody.append(rows);
  elements.playerCards.append(cards);
  elements.playerCount.textContent = players.length;
  elements.emptyMessage.hidden = players.length !== 0;
  elements.tablePanel.hidden = players.length === 0;
  elements.playerCards.hidden = players.length === 0;
}

function renderLeaders() {
  const activePlayers = state.players.filter((player) => numeric(player.GameCount) > 0);

  if (activePlayers.length === 0) {
    elements.leaderNote.textContent = "本組尚未產生比賽數據";
    leaderFields.forEach(({ nameId, valueId }) => {
      document.querySelector("#" + nameId).textContent = "尚無數據";
      document.querySelector("#" + valueId).textContent = "—";
    });
    return;
  }

  elements.leaderNote.textContent = "依目前平均數據計算";

  leaderFields.forEach(({ key, nameId, valueId }) => {
    const leader = [...activePlayers].sort(
      (left, right) => numeric(right[key]) - numeric(left[key])
    )[0];

    document.querySelector("#" + nameId).textContent = leader.PlayerName;
    document.querySelector("#" + valueId).textContent = decimal(leader[key]);
  });
}

function buildEventList(players) {
  const eventMap = new Map();

  players.forEach((player) => {
    const eventId = Number(player.EventId);
    const groupId = Number(player.GroupId);
    const teamId = Number(player.TeamId);

    if (!Number.isInteger(eventId) || !Number.isInteger(groupId) || !Number.isInteger(teamId)) {
      return;
    }

    if (!eventMap.has(eventId)) {
      eventMap.set(eventId, {
        eventId,
        eventName: player.EventName || "賽季 " + eventId,
        groups: new Map()
      });
    }

    const event = eventMap.get(eventId);

    if (!event.groups.has(groupId)) {
      event.groups.set(groupId, {
        groupId,
        groupName: player.GroupName || "組別 " + groupId,
        teams: new Map()
      });
    }

    const group = event.groups.get(groupId);

    if (!group.teams.has(teamId)) {
      group.teams.set(teamId, {
        teamId,
        teamName: player.TeamName || "球隊 " + teamId
      });
    }
  });

  return [...eventMap.values()]
    .map((event) => ({
      eventId: event.eventId,
      eventName: event.eventName,
      groups: [...event.groups.values()]
        .map((group) => ({
          groupId: group.groupId,
          groupName: group.groupName,
          teams: [...group.teams.values()].sort((left, right) =>
            left.teamName.localeCompare(right.teamName, "zh-Hant")
          )
        }))
        .sort((left, right) =>
          left.groupName.localeCompare(right.groupName, "zh-Hant")
        )
    }))
    .sort((left, right) => right.eventId - left.eventId);
}

function normalizeEvents(payload) {
  if (!Array.isArray(payload.events) || payload.events.length === 0) {
    return buildEventList(payload.players);
  }

  return payload.events
    .map((event) => ({
      eventId: Number(event.eventId),
      eventName: event.eventName,
      groups: Array.isArray(event.groups)
        ? event.groups.map((group) => ({
            groupId: Number(group.groupId),
            groupName: group.groupName,
            teams: Array.isArray(group.teams)
              ? group.teams.map((team) => ({
                  teamId: Number(team.teamId),
                  teamName: team.teamName
                }))
              : []
          }))
        : []
    }))
    .filter((event) => Number.isInteger(event.eventId) && event.groups.length > 0)
    .sort((left, right) => right.eventId - left.eventId);
}

function populateSelect(select, items, getValue, getLabel) {
  const options = items.map((item) => {
    const option = document.createElement("option");
    option.value = String(getValue(item));
    option.textContent = getLabel(item);
    return option;
  });

  select.replaceChildren(...options);
  select.disabled = options.length === 0;
}

function getParameterNumber(parameters, camelName, pascalName) {
  const value = parameters.get(camelName) ?? parameters.get(pascalName);
  if (value === null || value.trim() === "") return null;

  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

function getRequestedSelection() {
  const parameters = new URLSearchParams(window.location.search);

  return {
    eventId: getParameterNumber(parameters, "eventId", "EventId"),
    groupId: getParameterNumber(parameters, "groupId", "GroupId"),
    teamId: getParameterNumber(parameters, "teamId", "TeamId")
  };
}

function updateSelectionUrl() {
  const url = new URL(window.location.href);

  ["EventId", "GroupId", "TeamId"].forEach((name) => url.searchParams.delete(name));
  url.searchParams.set("eventId", String(state.selectedEventId));
  url.searchParams.set("groupId", String(state.selectedGroupId));
  url.searchParams.set("teamId", String(state.selectedTeamId));
  window.history.replaceState({}, "", url);
}

function getGroupMark(groupName) {
  const match = text(groupName).match(/S\s*(\d+)/i);
  if (match) return "S" + match[1];
  if (text(groupName).includes("女子")) return "女子";
  return "組別";
}

function selectTeam(teamId, { updateUrl = false } = {}) {
  const event = state.events.find((item) => item.eventId === state.selectedEventId);
  const group = state.groups.find((item) => item.groupId === state.selectedGroupId);
  const team = state.teams.find((item) => item.teamId === Number(teamId));

  if (!event || !group || !team) return false;

  state.selectedTeamId = team.teamId;
  state.players = state.allPlayers.filter((player) =>
    Number(player.EventId) === state.selectedEventId &&
    Number(player.GroupId) === state.selectedGroupId &&
    Number(player.TeamId) === team.teamId
  );
  state.query = "";

  elements.teamSelect.value = String(team.teamId);
  elements.playerSearch.value = "";
  elements.seasonName.textContent = event.eventName;
  elements.teamName.textContent = team.teamName;
  elements.teamInitial.textContent = team.teamName.trim().charAt(0) || "隊";
  elements.groupMark.textContent = getGroupMark(group.groupName);
  elements.tableCaption.textContent =
    event.eventName + "／" + group.groupName + "／" + team.teamName + " 球員平均數據";
  document.title = team.teamName + "｜" + group.groupName + "｜球員數據";

  if (updateUrl) updateSelectionUrl();

  renderLeaders();
  renderRoster();
  return true;
}

function selectGroup(groupId, { preferredTeamId = null, updateUrl = false } = {}) {
  const group = state.groups.find((item) => item.groupId === Number(groupId));
  if (!group) return false;

  state.selectedGroupId = group.groupId;
  state.teams = group.teams;
  elements.groupSelect.value = String(group.groupId);

  populateSelect(
    elements.teamSelect,
    state.teams,
    (team) => team.teamId,
    (team) => team.teamName
  );

  const requestedTeamExists = state.teams.some(
    (team) => team.teamId === Number(preferredTeamId)
  );
  const defaultTeamExists = state.teams.some((team) => team.teamId === DEFAULT_TEAM_ID);
  const teamId = requestedTeamExists
    ? Number(preferredTeamId)
    : defaultTeamExists
      ? DEFAULT_TEAM_ID
      : state.teams[0]?.teamId;

  return selectTeam(teamId, { updateUrl });
}

function selectEvent(
  eventId,
  { preferredGroupId = null, preferredTeamId = null, updateUrl = false } = {}
) {
  const event = state.events.find((item) => item.eventId === Number(eventId));
  if (!event) return false;

  state.selectedEventId = event.eventId;
  state.groups = event.groups;
  elements.eventSelect.value = String(event.eventId);

  populateSelect(
    elements.groupSelect,
    state.groups,
    (group) => group.groupId,
    (group) => group.groupName
  );

  const requestedGroupExists = state.groups.some(
    (group) => group.groupId === Number(preferredGroupId)
  );
  const teamGroup = state.groups.find((group) =>
    group.teams.some((team) => team.teamId === Number(preferredTeamId))
  );
  const defaultGroupExists = state.groups.some((group) => group.groupId === DEFAULT_GROUP_ID);
  const groupId = requestedGroupExists
    ? Number(preferredGroupId)
    : teamGroup
      ? teamGroup.groupId
      : defaultGroupExists
        ? DEFAULT_GROUP_ID
        : state.groups[0]?.groupId;

  return selectGroup(groupId, { preferredTeamId, updateUrl });
}

function applySelectionFromUrl({ updateUrl = false } = {}) {
  const requested = getRequestedSelection();
  const requestedEventExists = state.events.some(
    (event) => event.eventId === requested.eventId
  );

  const playerContext = requested.teamId === null
    ? null
    : state.allPlayers.find((player) =>
        Number(player.TeamId) === requested.teamId &&
        (requested.eventId === null || Number(player.EventId) === requested.eventId) &&
        (requested.groupId === null || Number(player.GroupId) === requested.groupId)
      );

  const requestedGroupEvent = requested.groupId === null
    ? null
    : state.events.find((event) =>
        event.groups.some((group) => group.groupId === requested.groupId)
      );
  const defaultTeamEvent = state.events.find((event) =>
    event.groups.some((group) =>
      group.teams.some((team) => team.teamId === DEFAULT_TEAM_ID)
    )
  );
  const defaultEventExists = state.events.some(
    (event) => event.eventId === DEFAULT_EVENT_ID
  );
  const eventId = requestedEventExists
    ? requested.eventId
    : playerContext
      ? Number(playerContext.EventId)
      : requestedGroupEvent
        ? requestedGroupEvent.eventId
        : defaultTeamEvent
          ? defaultTeamEvent.eventId
          : defaultEventExists
            ? DEFAULT_EVENT_ID
            : state.events[0]?.eventId;

  const preferredGroupId = requested.groupId ??
    (playerContext ? Number(playerContext.GroupId) : null);
  const preferredTeamId = requested.teamId;

  return selectEvent(eventId, {
    preferredGroupId,
    preferredTeamId,
    updateUrl
  });
}

async function loadData() {
  try {
    const response = await fetch(DATA_URL + "?v=" + Date.now(), { cache: "no-store" });
    if (!response.ok) throw new Error("HTTP " + response.status);

    const payload = await response.json();
    if (!Array.isArray(payload.players)) throw new Error("資料格式不正確");

    state.allPlayers = payload.players;
    state.events = normalizeEvents(payload);

    if (state.events.length === 0) throw new Error("找不到季度或組別資料");

    elements.updatedAt.textContent = formatUpdatedAt(payload.updatedAt);
    elements.statusMessage.hidden = true;

    populateSelect(
      elements.eventSelect,
      state.events,
      (event) => event.eventId,
      (event) => event.eventName
    );

    applySelectionFromUrl({ updateUrl: true });
  } catch (error) {
    console.error(error);
    elements.updatedAt.textContent = "資料讀取失敗";
    elements.statusMessage.classList.add("status-message--error");
    elements.statusMessage.textContent = "暫時無法取得球員數據，請稍後重新整理。";
  }
}

elements.playerSearch.addEventListener("input", (event) => {
  state.query = event.target.value;
  renderRoster();
});

elements.sortSelect.addEventListener("change", (event) => {
  state.sortKey = event.target.value;
  renderRoster();
});

elements.eventSelect.addEventListener("change", (event) => {
  selectEvent(Number(event.target.value), { updateUrl: true });
});

elements.groupSelect.addEventListener("change", (event) => {
  selectGroup(Number(event.target.value), { updateUrl: true });
});

elements.teamSelect.addEventListener("change", (event) => {
  selectTeam(Number(event.target.value), { updateUrl: true });
});

window.addEventListener("popstate", () => {
  if (state.events.length > 0) applySelectionFromUrl();
});

loadData();
