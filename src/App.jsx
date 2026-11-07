import { Navigate, Route, Routes } from 'react-router-dom';
import Kopfbereich from './components/layout/Kopfbereich.jsx';
import KartePage from './pages/KartePage.jsx';
import MeldenPage from './pages/MeldenPage.jsx';
import RechtlichesPage from './pages/RechtlichesPage.jsx';

export default function App() {
  return (
    <main className="seite">
      <Kopfbereich />
      <Routes>
        <Route path="/" element={<KartePage />} />
        <Route path="/melden" element={<MeldenPage />} />
        <Route path="/rechtliches" element={<RechtlichesPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  );
}
