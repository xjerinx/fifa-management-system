-- ==========================================================
-- Tournament Sponsors Seed Data
-- Distribution: 3 tournaments, 2 tournaments, 1 tournament, and 0 tournaments
-- ==========================================================

DELETE FROM `tournament_sponsor`;

-- Adidas (sponsor_id: 1) -> 3 Tournaments ($280,000,000 Total)
INSERT INTO `tournament_sponsor` (`tournament_id`, `sponsor_id`, `term_cycle`, `contract_value`) VALUES
(1, 1, '2022–2026', 85000000.00),
(2, 1, '2024–2026', 75000000.00),
(4, 1, '2026–2030', 120000000.00);

-- Coca-Cola (sponsor_id: 2) -> 3 Tournaments ($260,000,000 Total)
INSERT INTO `tournament_sponsor` (`tournament_id`, `sponsor_id`, `term_cycle`, `contract_value`) VALUES
(1, 2, '2022–2030', 90000000.00),
(3, 2, '2024–2028', 60000000.00),
(4, 2, '2026–2030', 110000000.00);

-- Visa (sponsor_id: 3) -> 2 Tournaments ($180,000,000 Total)
INSERT INTO `tournament_sponsor` (`tournament_id`, `sponsor_id`, `term_cycle`, `contract_value`) VALUES
(1, 3, '2021–2026', 80000000.00),
(4, 3, '2024–2028', 100000000.00);

-- Qatar Airways (sponsor_id: 5) -> 2 Tournaments ($155,000,000 Total)
INSERT INTO `tournament_sponsor` (`tournament_id`, `sponsor_id`, `term_cycle`, `contract_value`) VALUES
(1, 5, '2023–2027', 90000000.00),
(2, 5, '2024–2027', 65000000.00);

-- Budweiser (sponsor_id: 6) -> 2 Tournaments ($105,000,000 Total)
INSERT INTO `tournament_sponsor` (`tournament_id`, `sponsor_id`, `term_cycle`, `contract_value`) VALUES
(1, 6, '2022–2026', 60000000.00),
(3, 6, '2024–2026', 45000000.00);

-- McDonald's (sponsor_id: 7) -> 1 Tournament ($45,000,000 Total)
INSERT INTO `tournament_sponsor` (`tournament_id`, `sponsor_id`, `term_cycle`, `contract_value`) VALUES
(2, 7, '2024–2026', 45000000.00);

-- Hyundai (sponsor_id: 4) -> 0 Tournaments ($0 Total)
-- Wanda Group (sponsor_id: 8) -> 0 Tournaments ($0 Total)
