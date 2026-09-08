import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import FanExperience from './pages/FanExperience';
import Dashboard from './pages/Dashboard';
import Associations from './pages/Associations';
import Teams from './pages/Teams';
import Players from './pages/Players';
import Coaches from './pages/Coaches';
import Referees from './pages/Referees';
import Stadiums from './pages/Stadiums';
import Tournaments from './pages/Tournaments';
import Matches from './pages/Matches';
import MatchEvents from './pages/MatchEvents';
import Sponsors from './pages/Sponsors';

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Cinematic Landing Page (First Page Shown) */}
            <Route path="/" element={<LandingPage />} />

            {/* Split-Screen Authentication (Fan & Organization) */}
            <Route path="/login" element={<AuthPage />} />

            {/* Dedicated Fan Discovery & Ticket Experience */}
            <Route path="/fan" element={<FanExperience />} />

            {/* Existing Federation Operations Management Layout */}
            <Route element={<Layout />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="associations" element={<Associations />} />
              <Route path="teams" element={<Teams />} />
              <Route path="players" element={<Players />} />
              <Route path="coaches" element={<Coaches />} />
              <Route path="referees" element={<Referees />} />
              <Route path="stadiums" element={<Stadiums />} />
              <Route path="tournaments" element={<Tournaments />} />
              <Route path="matches" element={<Matches />} />
              <Route path="events" element={<MatchEvents />} />
              <Route path="sponsors" element={<Sponsors />} />
            </Route>

            {/* Fallback to landing */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;