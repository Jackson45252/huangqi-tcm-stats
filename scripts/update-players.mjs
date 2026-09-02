import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const API_URL = "https://www.bballhot.com/api/Home/PlayerList/45";
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(scriptDirectory, "..");
const outputPath = path.join(projectDirectory, "data", "players.json");

function pickPlayerFields(player) {
  return {
    PlayerId: player.PlayerId,
    PlayerName: player.PlayerName,
    TeamId: player.TeamId,
    TeamName: player.TeamName,
    GroupId: player.GroupId,
    GroupName: player.GroupName,
    EventId: player.EventId,
    EventName: player.EventName,
    GameCount: player.GameCount,
    ThreePMadeAvg: player.ThreePMadeAvg,
    ThreePAttemptAvg: player.ThreePAttemptAvg,
    ThreePPercent: player.ThreePPercent,
    TwoPMadeAvg: player.TwoPMadeAvg,
    TwoPAttemptAvg: player.TwoPAttemptAvg,
    TwoPPercent: player.TwoPPercent,
    FTMadeAvg: player.FTMadeAvg,
    FTAttemptAvg: player.FTAttemptAvg,
    FTPercent: player.FTPercent,
    ORebAvg: player.ORebAvg,
    DRebAvg: player.DRebAvg,
    TRebAvg: player.TRebAvg,
    StlAvg: player.StlAvg,
    AstAvg: player.AstAvg,
    BlkAvg: player.BlkAvg,
    TovAvg: player.TovAvg,
    PFAvg: player.PFAvg,
    PAvg: player.PAvg,
    EffAvg: player.EffAvg
  };
}

function buildCatalog(players) {
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
        eventName: player.EventName || \`賽季 \${eventId}\`,
        playerCount: 0,
        groups: new Map()
      });
    }

    const event = eventMap.get(eventId);
    event.playerCount += 1;

    if (!event.groups.has(groupId)) {
      event.groups.set(groupId, {
        groupId,
        groupName: player.GroupName || \`組別 \${groupId}\`,
        playerCount: 0,
        teams: new Map()
      });
    }

    const group = event.groups.get(groupId);
    group.playerCount += 1;

    if (!group.teams.has(teamId)) {
      group.teams.set(teamId, {
        teamId,
        teamName: player.TeamName || \`球隊 \${teamId}\`,
        playerCount: 0
      });
    }

    group.teams.get(teamId).playerCount += 1;
  });

  return [...eventMap.values()]
    .map((event) => ({
      eventId: event.eventId,
      eventName: event.eventName,
      playerCount: event.playerCount,
      groups: [...event.groups.values()]
        .map((group) => ({
          groupId: group.groupId,
          groupName: group.groupName,
          playerCount: group.playerCount,
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

async function hasUsableFallback() {
  try {
    const existing = JSON.parse(await readFile(outputPath, "utf8"));
    return Array.isArray(existing.players) && existing.players.length > 0;
  } catch {
    return false;
  }
}

async function updatePlayers() {
  const response = await fetch(API_URL, {
    headers: {
      Accept: "application/json",
      "User-Agent": "huangqi-tcm-stats/1.0"
    },
    signal: AbortSignal.timeout(45000)
  });

  if (!response.ok) {
    throw new Error(\`BBallHot API returned HTTP \${response.status}\`);
  }

  const allPlayers = await response.json();
  if (!Array.isArray(allPlayers)) {
    throw new Error("BBallHot API did not return an array");
  }

  const players = allPlayers
    .map(pickPlayerFields)
    .filter((player) =>
      Number.isInteger(Number(player.EventId)) &&
      Number.isInteger(Number(player.GroupId)) &&
      Number.isInteger(Number(player.TeamId))
    );

  if (players.length === 0) {
    throw new Error("No usable player records were returned");
  }

  const events = buildCatalog(players);
  const groupCount = events.reduce((count, event) => count + event.groups.length, 0);
  const teamCount = events.reduce(
    (count, event) =>
      count + event.groups.reduce((subtotal, group) => subtotal + group.teams.length, 0),
    0
  );

  const payload = {
    schemaVersion: 3,
    eventCount: events.length,
    groupCount,
    teamCount,
    playerCount: players.length,
    events,
    updatedAt: new Date().toISOString(),
    source: API_URL,
    players
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, \`\${JSON.stringify(payload, null, 2)}\\n\`, "utf8");
  console.log(
    \`Updated \${players.length} players across \${events.length} events, \${groupCount} groups and \${teamCount} teams.\`
  );
}

try {
  await updatePlayers();
} catch (error) {
  if (await hasUsableFallback()) {
    console.warn(\`Update failed; deploying cached data instead: \${error.message}\`);
  } else {
    throw error;
  }
}
