const db = require('../config/db');
const { ensureMatchRefereesTable } = require('../utils/matchRefereesHelper');

// Helper to check if team matches referee nationality
function isNationalityConflict(teamName, refNationality) {
    if (!teamName || !refNationality) return false;
    const t = teamName.toLowerCase();
    const n = refNationality.toLowerCase();
    if (t.includes('france') && n.includes('french')) return true;
    if (t.includes('england') && (n.includes('english') || n.includes('british'))) return true;
    if (t.includes('spain') && n.includes('spanish')) return true;
    if (t.includes('brazil') && n.includes('brazil')) return true;
    if (t.includes('germany') && n.includes('german')) return true;
    if (t.includes('italy') && n.includes('italian')) return true;
    if (t.includes('argentina') && n.includes('argentin')) return true;
    if (t.includes('portugal') && n.includes('portuguese')) return true;
    if (t.includes('uruguay') && n.includes('uruguayan')) return true;
    if (t.includes('netherlands') && (n.includes('dutch') || n.includes('netherland'))) return true;
    return false;
}

// Fisher-Yates shuffle
function shuffle(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

async function assignRefereesToPendingMatches() {
    await ensureMatchRefereesTable(db);

    const [referees] = await db.query('SELECT * FROM referee');
    console.log(`Found ${referees.length} referees in system.`);

    const [matches] = await db.query(`
        SELECT m.match_id, m.match_date, m.match_time, m.stage, m.result,
               ht.name AS home_team, at.name AS away_team
        FROM \`match\` m
        INNER JOIN team ht ON ht.team_id = m.home_team_id
        INNER JOIN team at ON at.team_id = m.away_team_id
        WHERE m.result IS NULL OR TRIM(m.result) = ''
        ORDER BY m.match_date ASC, m.match_time ASC
    `);

    console.log(`Found ${matches.length} matches awaiting kickoff / result pending.`);

    let assignedCount = 0;
    const assignmentsSummary = [];

    for (const match of matches) {
        // Clear any existing assignments for clean random assignment
        await db.query('DELETE FROM match_referees WHERE match_id = ?', [match.match_id]);
        try {
            await db.query('DELETE FROM match_referee WHERE match_id = ?', [match.match_id]);
        } catch (e) {}

        const availableRefs = shuffle(referees);

        // 1. Pick Main Referee (prefer non-conflicting nationality)
        let mainRef = availableRefs.find(r => 
            r.role === 'Main Referee' && 
            !isNationalityConflict(match.home_team, r.nationality) && 
            !isNationalityConflict(match.away_team, r.nationality)
        );

        if (!mainRef) {
            mainRef = availableRefs.find(r => r.role === 'Main Referee') || availableRefs[0];
        }

        const chosenReferees = [
            { referee_id: mainRef.referee_id, role: 'Main Referee', name: `${mainRef.first_name} ${mainRef.last_name}` }
        ];

        // 2. Pick Assistant Referee (e.g. Stephanie Frappart if available or other referee)
        const remainingAfterMain = availableRefs.filter(r => r.referee_id !== mainRef.referee_id);
        
        let assistantRef = remainingAfterMain.find(r => 
            r.role === 'Assistant Referee' &&
            !isNationalityConflict(match.home_team, r.nationality) &&
            !isNationalityConflict(match.away_team, r.nationality)
        );

        if (!assistantRef) {
            assistantRef = remainingAfterMain.find(r => 
                !isNationalityConflict(match.home_team, r.nationality) &&
                !isNationalityConflict(match.away_team, r.nationality)
            ) || remainingAfterMain[0];
        }

        if (assistantRef) {
            chosenReferees.push({
                referee_id: assistantRef.referee_id,
                role: 'Assistant Referee',
                name: `${assistantRef.first_name} ${assistantRef.last_name}`
            });
        }

        // 3. Pick 3rd Official: VAR Official or Fourth Official (alternating or randomly)
        const remainingFor3rd = remainingAfterMain.filter(r => r.referee_id !== assistantRef.referee_id);
        if (remainingFor3rd.length > 0) {
            let varRef = remainingFor3rd.find(r => r.role === 'VAR Official');
            let thirdRole = 'VAR Official';
            let thirdRef = varRef;

            if (!thirdRef || Math.random() > 0.5) {
                // If not VAR or by coin flip, could be Fourth Official
                thirdRef = remainingFor3rd.find(r => 
                    !isNationalityConflict(match.home_team, r.nationality) &&
                    !isNationalityConflict(match.away_team, r.nationality)
                ) || remainingFor3rd[0];
                thirdRole = (thirdRef.role === 'VAR Official') ? 'VAR Official' : 'Fourth Official';
            }

            if (thirdRef) {
                chosenReferees.push({
                    referee_id: thirdRef.referee_id,
                    role: thirdRole,
                    name: `${thirdRef.first_name} ${thirdRef.last_name}`
                });
            }
        }

        // Insert into match_referees
        for (const item of chosenReferees) {
            await db.query(
                'INSERT INTO match_referees (match_id, referee_id, role) VALUES (?, ?, ?)',
                [match.match_id, item.referee_id, item.role]
            );
            try {
                await db.query(
                    'INSERT IGNORE INTO match_referee (match_id, referee_id) VALUES (?, ?)',
                    [match.match_id, item.referee_id]
                );
            } catch (e) {}
        }

        assignedCount++;
        assignmentsSummary.push({
            match_id: match.match_id,
            match: `${match.home_team} vs ${match.away_team}`,
            date: match.match_date ? match.match_date.toISOString().split('T')[0] : 'TBD',
            stage: match.stage,
            officials: chosenReferees.map(r => `${r.name} (${r.role})`).join(' | ')
        });
    }

    console.log(`\nSuccessfully assigned referees to all ${assignedCount} matches!`);
    console.table(assignmentsSummary);
}

assignRefereesToPendingMatches()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('Error assigning referees:', err);
        process.exit(1);
    });
