# Walkthrough: Tournament-Level Sponsorship System & Manual Contract Management

We have completely refactored the sponsorship architecture from match-level sponsorship to a **tournament-level commercial partnership system** and enabled **manual configuration of Term Cycles and Contract Values**.

---

## 1. Key Updates & Workflow Design

### Adding Sponsors & Tournaments (Exclusive to Sponsors Page)
* **Single Dedicated Management Hub**: The **Global Partners & Sponsors** page (`/sponsors`) is now the **sole place** to assign tournaments to commercial sponsors, manually input Term Cycles, and enter Contract Values via the **`TOURNAMENTS & ROSTER`** button.
* **Clean Tournament View**: Removed the `+ SPONSORS` button from the Tournament cards and tables. Tournaments no longer have duplicate creation forms.

### Displaying Added Sponsors (Tournament Commercial Partners Section)
* **Real Sponsor Names Displayed**: On each tournament card in the **COMMERCIAL PARTNERS** slot (3rd image):
  - When sponsors are added, their actual brand names (e.g. `Budweiser`, `Adidas, Coca-Cola`) and active count are displayed directly on the card in gold/amber.
  - Clicking on the Commercial Partners block opens the clean **Sponsors & Asset Roster** modal to inspect the active contracts, term cycles, values, and stadium/broadcast deliverables.
  - If no sponsors are assigned yet, it clearly displays `0 Sponsors Logged`.

---

## 2. Manual Term Cycle & Contract Value Editing

- **Inline Editing**: In both modals (on `/tournaments` and `/sponsors`), each active contract has an **`Edit` (pencil icon)** button. Clicking it turns the Term Cycle and Contract Value into editable fields with instant **Save** and **Cancel** actions.
- **Dynamic Portfolio Totals**: When you update or assign a contract, the partner's total contract value and active term cycles dynamically update in real time across cards and tables.
- **Unlink / Remove**: You can remove/unlink any sponsorship contract anytime with the **Trash** button without affecting other tournaments.

---

## 3. Automated Verification

- Backend API verified with full CRUD on:
  - `GET /api/sponsors/:id/tournaments`
  - `POST /api/sponsors/:id/tournaments`
  - `PUT /api/sponsors/:id/tournaments/:tournamentId`
  - `DELETE /api/sponsors/:id/tournaments/:tournamentId`
- Frontend compiled cleanly with `vite build` (zero errors).
- Dev server running live on `http://localhost:5173`.js)**:
  * `GET /api/matches/:id/sponsors` (Removed / returns 404)
  * `POST /api/matches/:id/sponsors` (Removed)
  * `DELETE /api/matches/:id/sponsors/:sponsorId` (Removed)
* **Added to [`tournamentController.js`](file:///c:/Users/jerin/Desktop/fifa-management-system/backend/controllers/tournamentController.js) & [`tournamentRoutes.js`](file:///c:/Users/jerin/Desktop/fifa-management-system/backend/routes/tournamentRoutes.js)**:
  * `GET /api/tournaments/:id/sponsors` — Fetch all commercial partners for a tournament, including sponsor name, industry, country, term cycle, and contract value.
  * `PUT /api/tournaments/:id/sponsors/:sponsorId` — Update contract `term_cycle` and `contract_value`.
  * `DELETE /api/tournaments/:id/sponsors/:sponsorId` — Remove a commercial partner from the tournament.
  * Enhanced `getAll` to include `sponsor_count` and `total_sponsorship_value` per tournament.
* **Added to [`sponsorController.js`](file:///c:/Users/jerin/Desktop/fifa-management-system/backend/controllers/sponsorController.js) & [`sponsorRoutes.js`](file:///c:/Users/jerin/Desktop/fifa-management-system/backend/routes/sponsorRoutes.js)**:
  * `GET /api/sponsors/:id/tournaments` — Fetch all tournaments partnered with this sponsor.
  * Enhanced `getAll` to return `tournaments_sponsored` and `total_contract_value`.
  * Removed deprecated `getMatches` / `/:id/matches`.

---

### 3. Frontend UI Updates

#### [`Tournaments.jsx`](file:///c:/Users/jerin/Desktop/fifa-management-system/frontend/src/pages/Tournaments.jsx)
* **Card & Table UI**:
  * Added **COMMERCIAL PARTNERS** metric badge and total portfolio value on cards.
  * Added prominent **`SPONSORS ({count})`** action button on cards and table rows.
  * Added `Most Sponsors` sort option in the toolbar.
* **Tournament Sponsors & Asset Roster Modal**:
  * **Header**: Displays tournament title, category, window, active partner count, and total tournament sponsorship value.
  * **Commercial Contracts Tab**:
    * Quick-assign sponsor form: Select sponsor from database dropdown, customize Term Cycle (e.g. `2026–2028`), set Contract Value (e.g. `5000000`), and click `+ Add`.
    * Synchronized table with inline editing for Term Cycle and Contract Value, and instant sponsor removal.
  * **Activated Asset Roster Tab**:
    * Dynamically displays marketing deliverables, category exclusivity, pitchside LED rotation allocations, and clearance status for every sponsor assigned to this tournament.

#### [`Sponsors.jsx`](file:///c:/Users/jerin/Desktop/fifa-management-system/frontend/src/pages/Sponsors.jsx)
* Cleaned up all match-sponsor references.
* Cards and table now display **Tournaments Sponsored** and live **Contract Value**.
* **Activated Tournament Roster Modal**:
  * Clicking **ASSET ROSTER** on any sponsor card now queries `GET /api/sponsors/:id/tournaments`.
  * Displays the tournament name, category, stage/format, term cycle, and financial valuation.

#### [`Matches.jsx`](file:///c:/Users/jerin/Desktop/fifa-management-system/frontend/src/pages/Matches.jsx)
* Verified completely free of match-sponsor references or UI artifacts.

---

## Verification Results

### 1. Database Migration & Schema
```
[Migration] Added term_cycle column
[Migration] Added contract_value column
[Migration] Backfilled term_cycle and contract_value
[Migration] Dropped match_sponsor table successfully
[Migration] Verified tournament_sponsor records
```

### 2. Live API Testing
```
Testing GET /tournaments/1/sponsors... -> 8 sponsors returned
Testing GET /sponsors/2/tournaments... -> 3 tournaments returned (Coca-Cola)
Testing GET /matches/1/sponsors... -> HTTP 404 (Endpoint successfully removed)
Testing POST /tournaments/4/sponsors -> Success (Sponsor 2 assigned to FIFA World Cup 2026)
Testing PUT /tournaments/4/sponsors/2 -> Success (Contract updated)
Testing DELETE /tournaments/4/sponsors/2 -> Success (Sponsor removed)
```

### 3. Frontend Production Build
```
npm run build --prefix frontend
vite v8.2.2 building client environment for production...
✓ 2490 modules transformed.
✓ built in 2.10s (0 errors)
```
