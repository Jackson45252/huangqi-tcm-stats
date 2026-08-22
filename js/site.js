"use strict";

const DATA_URL = "./data/players.json";
const DEFAULT_TEAM_ID = 1789;

const state = {
  allPlayers: [],
  teams: [],
  players: [],
  selectedTeamId: null,
  query: "",
  sortKey: "EffAvg"
};

const elements = {
  seasonName: document.querySelector("#seasonName"),
  teamInitial: document.querySelector("#teamInitial"),
  teamName: document.querySelector("#teamName"),
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
  return `${decimal(value)}%`;
}

function formatUpdatedAt(value) {
  if (!value) return "更新時間未知";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "更新時間未知";

  return `更新於 ${new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date)}`;
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
  shots.textContent = `${decimal(made)} / ${decimal(attempted)}`;
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
  item.textContent = `${label} ${percentage(value)}`;
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
  games.textContent = `${numeric(player.GameCount)} 場`;
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
    player.PlayerName.toLocaleLowerCase("zh-Hant").includes(query)
  );

  return filtered.sort((left, right) => {
    if (state.sortKey === "PlayerName") {
      return left.PlayerName.localeCompare(right.PlayerName, "zh-Hant");
    }

    return (
      numeric(right[state.sortKey]) - numeric(left[state.sortKey]) ||
      numeric(right.GameCount) - numeric(left.GameCount) ||
      left.PlayerName.localeCompare(right.PlayerName, "zh-Hant")
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
    elements.leaderNote.textContent = "賽季尚未產生比賽數據";
    leaderFields.forEach(({ nameId, valueId }) => {
      document.querySelector(`#${nameId}`).textContent = "尚無數據";
      document.querySelector(`#${valueId}`).textContent = "—";
    });
    return;
  }

  elements.leaderNote.textContent = "依目前平均數據計算";

  leaderFields.forEach(({ key, nameId, valueId }) => {
    const leader = [...activePlayers].sort(
      (left, right) => numeric(right[key]) - numeric(left[key])
    )[0];

    document.querySelector(`#${nameId}`).textContent = leader.PlayerName;
    document.querySelector(`#${valueId}`).textContent = decimal(leader[key]);
  });
}

function buildTeamList(players) {
  const teams = new Map();

  players.forEach((player) => {
    const teamId = Number(player.TeamId);
    if (!Number.isFinite(teamId) || teams.has(teamId)) return;

    teams.set(teamId, {
      teamId,
      teamName: player.TeamName || `球隊 ${teamId}`
    });
  });

  return [...teams.values()].sort((left, right) =>
    left.teamName.localeCompare(right.teamName, "zh-Hant")
  );
}

function populateTeamSelect() {
  const options = state.teams.map((team) => {
    const option = document.createElement("option");
    option.value = String(team.teamId);
    option.textContent = team.teamName;
    return option;
  });

  elements.teamSelect.replaceChildren(...options);
  elements.teamSelect.disabled = false;
}

function getRequestedTeamId() {
  const parameters = new URLSearchParams(window.location.search);
  const value = parameters.get("teamId") ?? parameters.get("TeamId");
  if (value === null || value.trim() === "") return null;

  const teamId = Number(value);
  return Number.isInteger(teamId) ? teamId : null;
}

function updateTeamUrl(teamId) {
  const url = new URL(window.location.href);
  url.searchParams.delete("TeamId");
  url.searchParams.set("teamId", String(teamId));
  window.history.replaceState({}, "", url);
}

function selectTeam(teamId, { updateUrl = false } = {}) {
  const team = state.teams.find((item) => item.teamId === Number(teamId));
  if (!team) return false;

  state.selectedTeamId = team.teamId;
  state.players = state.allPlayers.filter(
    (player) => Number(player.TeamId) === team.teamId
  );
  state.query = "";

  elements.teamSelect.value = String(team.teamId);
  elements.playerSearch.value = "";
  elements.teamName.textContent = team.teamName;
  elements.teamInitial.textContent = team.teamName.trim().charAt(0) || "隊";
  elements.tableCaption.textContent = `${team.teamName} 球員平均數據`;
  document.title = `${team.teamName}｜球員數據`;

  if (updateUrl) updateTeamUrl(team.teamId);

  renderLeaders();
  renderRoster();
  return true;
}

async function loadData() {
  try {
    const response = await fetch(`${DATA_URL}?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const payload = await response.json();
    if (!Array.isArray(payload.players)) throw new Error("資料格式不正確");

    state.allPlayers = payload.players;
    state.teams = Array.isArray(payload.teams) && payload.teams.length > 0
      ? payload.teams.map((team) => ({
          teamId: Number(team.teamId),
          teamName: team.teamName
        }))
      : buildTeamList(payload.players);

    if (state.teams.length === 0) throw new Error("找不到球隊資料");

    elements.seasonName.textContent = payload.groupName || payload.eventName || "球隊數據中心";
    elements.updatedAt.textContent = formatUpdatedAt(payload.updatedAt);
    elements.statusMessage.hidden = true;

    populateTeamSelect();

    const requestedTeamId = getRequestedTeamId();
    const requestedTeamExists = state.teams.some(
      (team) => team.teamId === requestedTeamId
    );
    const fallbackTeamId = state.teams.some((team) => team.teamId === DEFAULT_TEAM_ID)
      ? DEFAULT_TEAM_ID
      : state.teams[0].teamId;
    const initialTeamId = requestedTeamExists ? requestedTeamId : fallbackTeamId;

    selectTeam(initialTeamId, {
      updateUrl: requestedTeamId !== null && !requestedTeamExists
    });
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

elements.teamSelect.addEventListener("change", (event) => {
  selectTeam(Number(event.target.value), { updateUrl: true });
});

window.addEventListener("popstate", () => {
  const requestedTeamId = getRequestedTeamId();
  if (requestedTeamId !== null) selectTeam(requestedTeamId);
});

loadData();
