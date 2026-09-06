-- ==========================================================
-- FIFA Management System - Populate Real Clubs for Known Athletes
-- ==========================================================

UPDATE player SET club = 'Real Madrid' WHERE first_name = 'Jude' AND last_name = 'Bellingham';
UPDATE player SET club = 'Real Madrid' WHERE first_name = 'Kylian' AND last_name = 'Mbappé';
UPDATE player SET club = 'FC Barcelona' WHERE first_name = 'Lamine' AND last_name = 'Yamal';
UPDATE player SET club = 'Real Madrid' WHERE first_name = 'Vinícius' AND last_name = 'Júnior';
UPDATE player SET club = 'Manchester City' WHERE first_name = 'Rodri';
UPDATE player SET club = 'Manchester City' WHERE first_name = 'Phil' AND last_name = 'Foden';
UPDATE player SET club = 'Bayern Munich' WHERE first_name = 'Harry' AND last_name = 'Kane';
UPDATE player SET club = 'Inter Milan' WHERE first_name = 'Lautaro' AND last_name = 'Martínez';
UPDATE player SET club = 'Arsenal' WHERE first_name = 'Declan' AND last_name = 'Rice';
UPDATE player SET club = 'FC Barcelona' WHERE first_name = 'Pedri';
UPDATE player SET club = 'Atlético Madrid' WHERE first_name = 'Julián' AND last_name = 'Álvarez';
UPDATE player SET club = 'Inter Miami' WHERE first_name = 'Lionel' AND last_name = 'Messi';
UPDATE player SET club = 'Liverpool' WHERE first_name = 'Alisson' AND last_name = 'Becker';
UPDATE player SET club = 'Paris Saint-Germain' WHERE first_name = 'Marquinhos';
UPDATE player SET club = 'Juventus' WHERE first_name = 'Danilo';
UPDATE player SET club = 'Manchester United' WHERE first_name = 'Casemiro';
UPDATE player SET club = 'West Ham United' WHERE first_name = 'Lucas' AND last_name = 'Paquetá';
UPDATE player SET club = 'Real Madrid' WHERE first_name = 'Rodrygo';
UPDATE player SET club = 'Arsenal' WHERE first_name = 'Gabriel' AND last_name = 'Martinelli';
UPDATE player SET club = 'Aston Villa' WHERE first_name = 'Emiliano' AND last_name = 'Martínez';
UPDATE player SET club = 'Benfica' WHERE first_name = 'Nicolás' AND last_name = 'Otamendi';
UPDATE player SET club = 'Atlético Madrid' WHERE first_name = 'Rodrigo' AND last_name = 'De Paul';
UPDATE player SET club = 'Chelsea' WHERE first_name = 'Enzo' AND last_name = 'Fernández';
UPDATE player SET club = 'AC Milan' WHERE first_name = 'Mike' AND last_name = 'Maignan';
UPDATE player SET club = 'Bayern Munich' WHERE first_name = 'Dayot' AND last_name = 'Upamecano';
UPDATE player SET club = 'AC Milan' WHERE first_name = 'Théo' AND last_name = 'Hernández';
UPDATE player SET club = 'Real Madrid' WHERE first_name = 'Aurélien' AND last_name = 'Tchouaméni';
UPDATE player SET club = 'Atlético Madrid' WHERE first_name = 'Antoine' AND last_name = 'Griezmann';
UPDATE player SET club = 'Paris Saint-Germain' WHERE first_name = 'Ousmane' AND last_name = 'Dembélé';
UPDATE player SET club = 'Everton' WHERE first_name = 'Jordan' AND last_name = 'Pickford';
UPDATE player SET club = 'Manchester City' WHERE first_name = 'John' AND last_name = 'Stones';
UPDATE player SET club = 'Manchester United' WHERE first_name = 'Luke' AND last_name = 'Shaw';
UPDATE player SET club = 'Athletic Bilbao' WHERE first_name = 'Unai' AND last_name = 'Simón';
UPDATE player SET club = 'Real Madrid' WHERE first_name = 'Dani' AND last_name = 'Carvajal';
UPDATE player SET club = 'Bayer Leverkusen' WHERE first_name = 'Alejandro' AND last_name = 'Grimaldo';
UPDATE player SET club = 'AC Milan' WHERE first_name = 'Álvaro' AND last_name = 'Morata';
UPDATE player SET club = 'Bayern Munich' WHERE first_name = 'Manuel' AND last_name = 'Neuer';
UPDATE player SET club = 'Bayern Munich' WHERE first_name = 'Joshua' AND last_name = 'Kimmich';
UPDATE player SET club = 'Real Madrid' WHERE first_name = 'Antonio' AND last_name = 'Rüdiger';
UPDATE player SET club = 'Real Madrid' WHERE first_name = 'Toni' AND last_name = 'Kroos';
UPDATE player SET club = 'Manchester City' WHERE first_name = 'Ilkay' AND last_name = 'Gündogan';
UPDATE player SET club = 'Arsenal' WHERE first_name = 'Kai' AND last_name = 'Havertz';
UPDATE player SET club = 'Bayern Munich' WHERE first_name = 'Leroy' AND last_name = 'Sané';
UPDATE player SET club = 'Paris Saint-Germain' WHERE first_name = 'Gianluigi' AND last_name = 'Donnarumma';
UPDATE player SET club = 'Inter Milan' WHERE first_name = 'Alessandro' AND last_name = 'Bastoni';
UPDATE player SET club = 'Inter Milan' WHERE first_name = 'Federico' AND last_name = 'Dimarco';
UPDATE player SET club = 'Inter Milan' WHERE first_name = 'Nicolo' AND last_name = 'Barella';
UPDATE player SET club = 'AS Roma' WHERE first_name = 'Lorenzo' AND last_name = 'Pellegrini';
UPDATE player SET club = 'Napoli' WHERE first_name = 'Giacomo' AND last_name = 'Raspadori';
UPDATE player SET club = 'Atalanta' WHERE first_name = 'Gianluca' AND last_name = 'Scamacca';

-- Verify results
SELECT first_name, last_name, club FROM player WHERE club IS NOT NULL;
