const express = require("express");

const { open } = require("sqlite");

const sqlite3 = require("sqlite3");

const app = express();

app.use(express.json());

const path = require("path");

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const AnitilizeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,

      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("server running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB.error ${error.message}`);

    process.exit(1);
  }
};

AnitilizeDbAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,

    playerName: dbObject.player_name,

    matchId: dbObject.match_id,

    match: dbObject.match,

    year: dbObject.year,

    playerMatchId: dbObject.player_match_id,

    score: dbObject.score,

    fours: dbObject.fours,

    sixes: dbObject.sixes,
  };
};

const convertMatchDetailsDbObjectToResponsiveObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,

    match: dbObject.match,

    year: dbObject.year,
  };
};

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `

 SELECT

 *

 FROM

 player_details;`;

  const playersArray = await db.all(getPlayersQuery);

  response.send(
    playersArray.map((eachPlayer) =>
      convertDbObjectToResponseObject(eachPlayer)
    )
  );
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;

  const getPlayerD = `

    SELECT

    *

    FROM

    player_details

    WHERE

    player_id = ${playerId};`;

  const player = await db.get(getPlayerD);

  response.send(convertDbObjectToResponseObject(player));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;

  const playerDetails = request.body;

  const { playerName } = playerDetails;

  const updatePlayer = `

    UPDATE

    player_details

    SET

    player_name = '${playerName}'

    WHERE 

    player_id = ${playerId};`;

  await db.run(updatePlayer);

  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;

  const matchD = `

    SELECT * FROM 

    match_details

    WHERE 

    match_id = ${matchId}`;

  const match = await db.get(matchD);

  response.send(convertDbObjectToResponseObject(match));
});

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;

  const getPlayerMatchesQuery = `



    SELECT

    *

    FROM player_match_score NATURAL JOIN match_details

    WHERE

    player_id = ${playerId};`;

  const playerMatches = await db.all(getPlayerMatchesQuery);

  response.send(
    playerMatches.map((eachMatch) =>
      convertMatchDetailsDbObjectToResponsiveObject(eachMatch)
    )
  );
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;

  const getMatchPlayersQuery = `

        SELECT

          player_details.player_id AS playerId,

          player_details.player_name AS playerName

        FROM player_match_score NATURAL JOIN player_details

        WHERE match_id=${matchId};`;

  const playerMatches = await db.all(getPlayerMatchesQuery);

  response.send(convertDbObjectToResponseObject(playerMatches));
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;

  const getPlayerScored = `

    SELECT

    player_details.player_id AS playerId,

    player_details.player_name AS playerName,

    SUM(player_match_score.score) AS totalScore,

    SUM(fours) AS totalFours,

    SUM(sixes) AS totalSixes FROM 

    player_details INNER JOIN player_match_score ON

    player_details.player_id = player_match_score.player_id

    WHERE player_details.player_id = ${playerId};

    `;

  const playerMatches = await db.get(getPlayerScored);

  response.send(playerMatches);
});

module.exports = app;
