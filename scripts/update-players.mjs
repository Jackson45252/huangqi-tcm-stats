import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const API_URL = "https://www.bballhot.com/api/Home/PlayerList/45";
const TEAM_NAME = "黃耆TCM";
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
    throw new Error(`BBallHot API returned HTTP ${response.status}`);
  }

  const allPlayers = await response.json();
  if (!Array.isArray(allPlayers)) {
    throw new Error("BBallHot API did not return an array");
  }

  const players = allPlayers
    .filter((player) => player.TeamName === TEAM_NAME)
    .map(pickPlayerFields);

  if (players.length === 0) {
    throw new Error(`No players found for ${TEAM_NAME}`);
  }

  const firstPlayer = players[0];
  const payload = {
    schemaVersion: 1,
    teamName: TEAM_NAME,
    teamId: firstPlayer.TeamId,
    eventName: firstPlayer.EventName,
    groupName: firstPlayer.GroupName,
    playerCount: players.length,
    updatedAt: new Date().toISOString(),
    source: API_URL,
    players
  };

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  console.log(`Updated ${players.length} players for ${TEAM_NAME}.`);
}

try {
  await updatePlayers();
} catch (error) {
  if (await hasUsableFallback()) {
    console.warn(`Update failed; deploying cached data instead: ${error.message}`);
  } else {
    throw error;
  }
}
