import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import Layout from './components/Layout';
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
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
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
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;