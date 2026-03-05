import { Routes, Route } from 'react-router';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ThemeProvider } from './ThemeContext';
import HomePage from './pages/HomePage';
import TournamentsPage from './pages/TournamentsPage';
import TournamentPage from './pages/TournamentPage';
import HelpPage from './pages/HelpPage';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/tournaments" element={<TournamentsPage />} />
        <Route path="/tournament/:id" element={<TournamentPage />} />
        <Route path="/help" element={<HelpPage />} />
      </Routes>
      <ToastContainer
        position="top-center"
        autoClose={2000}
        hideProgressBar
        newestOnTop
        closeOnClick
        pauseOnFocusLoss={false}
        draggable={false}
        theme="colored"
      />
      </ErrorBoundary>
    </ThemeProvider>
  );
}
