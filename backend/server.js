const express = require('express');
const cors = require('cors');
require('dotenv').config();

const errorHandler = require('./middleware/errorHandler');

const associationRoutes = require('./routes/associationRoutes');
const teamRoutes = require('./routes/teamRoutes');
const playerRoutes = require('./routes/playerRoutes');
const coachRoutes = require('./routes/coachRoutes');
const refereeRoutes = require('./routes/refereeRoutes');
const stadiumRoutes = require('./routes/stadiumRoutes');
const tournamentRoutes = require('./routes/tournamentRoutes');
const matchRoutes = require('./routes/matchRoutes');
const eventRoutes = require('./routes/eventRoutes');
const sponsorRoutes = require('./routes/sponsorRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const ticketRoutes = require('./routes/ticketRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'FIFA Management System API Server',
        healthCheck: '/api/health',
        docs: {
            associations: '/api/associations',
            teams: '/api/teams',
            players: '/api/players',
            coaches: '/api/coaches',
            referees: '/api/referees',
            stadiums: '/api/stadiums',
            tournaments: '/api/tournaments',
            matches: '/api/matches',
            events: '/api/events',
            sponsors: '/api/sponsors',
            dashboard: '/api/dashboard/stats',
            tickets: '/api/tickets',
        }
    });
});

app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'FIFA Management API is running', timestamp: new Date().toISOString() });
});

app.use('/api/associations', associationRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/coaches', coachRoutes);
app.use('/api/referees', refereeRoutes);
app.use('/api/stadiums', stadiumRoutes);
app.use('/api/tournaments', tournamentRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/sponsors', sponsorRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/tickets', ticketRoutes);

app.use((req, res, next) => {
    res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found` });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

process.once('SIGUSR2', () => {
    server.close(() => {
        process.kill(process.pid, 'SIGUSR2');
    });
});
process.on('SIGTERM', () => {
    server.close(() => console.log('Server stopped'));
});
process.on('SIGINT', () => {
    server.close(() => process.exit(0));
});