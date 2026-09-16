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

function shuffle(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

const LIVE_API = 'https://fifa-backend-g9p1.onrender.com/api';

(async () => {
    try {
        console.log('Connecting to live production API at', LIVE_API);

        const [refRes, matchRes] = await Promise.all([
            fetch(`${LIVE_API}/referees`).then(r => r.json()),
            fetch(`${LIVE_API}/matches`).then(r => r.json()),
        ]);

        const referees = refRes.data || [];
        const allMatches = matchRes.data || [];

        console.log(`Live system has ${referees.length} referees and ${allMatches.length} total matches.`);

        const pendingMatches = allMatches.filter(m => !m.result || !m.result.trim());
        console.log(`Found ${pendingMatches.length} pending / awaiting kickoff matches on live website.`);

        const assignmentResults = [];

        for (const match of pendingMatches) {
            // Check existing refs on match
            const existingRefs = match.referees || [];
            for (const r of existingRefs) {
                await fetch(`${LIVE_API}/matches/${match.match_id}/referees/${r.referee_id}`, {
                    method: 'DELETE'
                }).catch(() => {});
            }

            const availableRefs = shuffle(referees);

            // 1. Pick Main Referee
            let mainRef = availableRefs.find(r =>
                r.role === 'Main Referee' &&
                !isNationalityConflict(match.home_team, r.nationality) &&
                !isNationalityConflict(match.away_team, r.nationality)
            );
            if (!mainRef) {
                mainRef = availableRefs.find(r => r.role === 'Main Referee') || availableRefs[0];
            }

            const crew = [
                { referee_id: mainRef.referee_id, role: 'Main Referee', name: `${mainRef.first_name} ${mainRef.last_name}` }
            ];

            // 2. Pick Assistant Referee
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
                crew.push({
                    referee_id: assistantRef.referee_id,
                    role: 'Assistant Referee',
                    name: `${assistantRef.first_name} ${assistantRef.last_name}`
                });
            }

            // 3. Pick 3rd official (VAR or 4th Official)
            const remainingFor3rd = remainingAfterMain.filter(r => r.referee_id !== assistantRef.referee_id);
            if (remainingFor3rd.length > 0) {
                let varRef = remainingFor3rd.find(r => r.role === 'VAR Official');
                let thirdRole = 'VAR Official';
                let thirdRef = varRef;

                if (!thirdRef || Math.random() > 0.5) {
                    thirdRef = remainingFor3rd.find(r =>
                        !isNationalityConflict(match.home_team, r.nationality) &&
                        !isNationalityConflict(match.away_team, r.nationality)
                    ) || remainingFor3rd[0];
                    thirdRole = (thirdRef.role === 'VAR Official') ? 'VAR Official' : 'Fourth Official';
                }

                if (thirdRef) {
                    crew.push({
                        referee_id: thirdRef.referee_id,
                        role: thirdRole,
                        name: `${thirdRef.first_name} ${thirdRef.last_name}`
                    });
                }
            }

            // Send assignments to live API
            for (const official of crew) {
                await fetch(`${LIVE_API}/matches/${match.match_id}/referees`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ referee_id: official.referee_id, role: official.role })
                });
            }

            assignmentResults.push({
                match_id: match.match_id,
                fixture: `${match.home_team} vs ${match.away_team}`,
                date: match.match_date ? match.match_date.split('T')[0] : 'TBD',
                officials: crew.map(c => `${c.name} (${c.role})`).join(' | ')
            });
        }

        console.log(`\nSuccessfully assigned referee crews to all ${assignmentResults.length} pending matches on production website!`);
        console.table(assignmentResults);
    } catch (err) {
        console.error('Error syncing live referees:', err);
    }
})();
