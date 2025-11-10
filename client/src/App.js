import './App.css';
import {Routes, Route} from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { FlashProvider } from './components/flash/FlashContext';
import FlashBanner from './components/flash/FlashBanner';
import Homepage from './pages/homepage';
import Account from './pages/home/Account';
import HomeLayout from './pages/home/HomeLayout';
import Landingpage from './pages/landingpage';
import RequireAuth from './components/RequireAuth';
import SignInPage from './pages/auth/SignInPage';
import SignUpPage from './pages/auth/SignUpPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import AnalyzePage from './pages/home/AnalyzePage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import ResultsPage from './pages/home/ResultsPage';
import HistoryPage from './pages/home/HistoryPage';
import DashboardPage from './pages/home/DashboardPage';
import RecommendationsPage from './pages/home/RecommendationsPage';
import SpotifyCallback from './pages/home/SpotifyCallback';
import AnalysisDetailPage from './pages/home/AnalysisDetailPage';


function App() {

  return (
    <ThemeProvider>
      <FlashProvider>
        <div className="App">
          <FlashBanner />
          <main>
            <Routes>
            <Route path="/" element={<Landingpage />} />
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/home" element={<RequireAuth><HomeLayout /></RequireAuth>}>
              <Route index element={<Homepage />} />
              <Route path="account" element={<Account />} />
              <Route path="analyze" element={<AnalyzePage />} />
              <Route path="results" element={<ResultsPage />} />
              <Route path="history" element={<HistoryPage />} />
              <Route path="recommendations" element={<RecommendationsPage />} />
              <Route path="dashboard" element={<DashboardPage />} />
              {/* spotify-callback moved to top-level so it isn't blocked by RequireAuth */}
              <Route path="analysis/:analysisId" element={<AnalysisDetailPage />} />
            </Route>
              {/* Spotify OAuth returns here from the backend; keep this route public so the callback can be processed
                  even when the user's app auth token is not present. The component will handle navigation after exchange. */}
              <Route path="/spotify-callback" element={<SpotifyCallback />} />
          </Routes>
        </main>
      </div>
    </FlashProvider>
    </ThemeProvider>
  );
}

export default App;