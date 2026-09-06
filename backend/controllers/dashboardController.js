const db = require('../config/db');

exports.getStats = async (req, res, next) => {
    try {
        const [[stats]] = await db.query(`
            SELECT
                (SELECT COUNT(*) FROM association)  AS total_associations,
                (SELECT COUNT(*) FROM team)         AS total_teams,
                (SELECT COUNT(*) FROM player)       AS total_players,
                (SELECT COUNT(*) FROM coach)        AS total_coaches,
                (SELECT COUNT(*) FROM referee)      AS total_referees,
                (SELECT COUNT(*) FROM stadium)      AS total_stadiums,
                (SELECT COUNT(*) FROM tournament)   AS total_tournaments,
                (SELECT COUNT(*) FROM \`match\`)    AS total_matches,
                (SELECT COUNT(*) FROM sponsor)      AS total_sponsors
        `);
        res.json({ success: true, data: stats });
    } catch (err) { next(err); }
};

exports.getUpcomingMatches = async (req, res, next) => {
    try {
        const [rows] = await db.query(`
            SELECT m.*, 
                ht.name AS home_team, at.name AS away_team,
                s.name AS stadium_name, tr.name AS tournament_name
            FROM \`match\` m
            INNER JOIN team ht ON ht.team_id = m.home_team_id
            INNER JOIN team at ON at.team_id = m.away_team_id
            INNER JOIN stadium s ON s.stadium_id = m.stadium_id
            INNER JOIN tournament tr ON tr.tournament_id = m.tournament_id
            WHERE m.result IS NULL
            ORDER BY m.match_date ASC
            LIMIT 5
        `);
        res.json({ success: true, data: rows });
    } catch (err) { next(err); }
};

exports.getRecentMatches = async (req, res, next) => {
    try {
        const [rows] = await db.query(`
            SELECT m.*, 
                ht.name AS home_team, at.name AS away_team,
                s.name AS stadium_name, tr.name AS tournament_name
            FROM \`match\` m
            INNER JOIN team ht ON ht.team_id = m.home_team_id
            INNER JOIN team at ON at.team_id = m.away_team_id
            INNER JOIN stadium s ON s.stadium_id = m.stadium_id
            INNER JOIN tournament tr ON tr.tournament_id = m.tournament_id
            WHERE m.result IS NOT NULL
            ORDER BY m.match_date DESC
            LIMIT 5
        `);
        res.json({ success: true, data: rows });
    } catch (err) { next(err); }
};

exports.getRecentEvents = async (req, res, next) => {
    try {
        const [rows] = await db.query(`
            SELECT me.*, 
                CONCAT(p.first_name, ' ', p.last_name) AS player_name,
                ht.name AS home_team, at.name AS away_team,
                m.match_date
            FROM match_event me
            INNER JOIN \`match\` m ON m.match_id = me.match_id
            INNER JOIN team ht ON ht.team_id = m.home_team_id
            INNER JOIN team at ON at.team_id = m.away_team_id
            LEFT JOIN player p ON p.player_id = me.player_id
            ORDER BY m.match_date DESC, me.minute ASC
            LIMIT 10
        `);
        res.json({ success: true, data: rows });
    } catch (err) { next(err); }
};

exports.getTopPlayers = async (req, res, next) => {
    try {
        const [rows] = await db.query(`
            SELECT p.player_id, CONCAT(p.first_name, ' ', p.last_name) AS full_name,
                p.position, p.nationality, p.market_value_m,
                t.name AS team_name
            FROM player p
            INNER JOIN team t ON t.team_id = p.team_id
            ORDER BY p.market_value_m DESC
            LIMIT 5
        `);
        res.json({ success: true, data: rows });
    } catch (err) { next(err); }
};

exports.getPlayersByPosition = async (req, res, next) => {
    try {
        const [rows] = await db.query(`
            SELECT position, COUNT(*) AS count
            FROM player
            GROUP BY position
        `);
        res.json({ success: true, data: rows });
    } catch (err) { next(err); }
};

exports.getTeamsByAssociation = async (req, res, next) => {
    try {
        const [rows] = await db.query(`
            SELECT MAX(a.name) AS association_name, COUNT(t.team_id) AS team_count
            FROM association a
            LEFT JOIN team t ON t.association_id = a.association_id
            GROUP BY a.association_id
            ORDER BY team_count DESC
        `);
        res.json({ success: true, data: rows });
    } catch (err) { next(err); }
};