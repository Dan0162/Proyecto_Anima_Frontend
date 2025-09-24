import './App.css';
import {Routes, Route, useLocation} from 'react-router-dom';
import { FlashProvider } from './components/flash/FlashContext';
import FlashBanner from './components/flash/FlashBanner';
import Homepage from './pages/homepage';
import Account from './pages/home/Account';
import HomeLayout from './pages/home/HomeLayout';
import Landingpage from './pages/landingpage';
import RequireAuth from './components/RequireAuth';
import SignInPage from './pages/auth/SignInPage';
import SignUpPage from './pages/auth/SignUpPage';

function App() {
  // Read location here so FlashBanner can react to location.state flashes too if needed
  const location = useLocation();

  return (
    <FlashProvider>
      <div className="App">
        <FlashBanner />
        <main>
          <Routes>
            <Route path="/" element={<Landingpage />} />
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/home" element={<RequireAuth><HomeLayout /></RequireAuth>}>
              <Route index element={<Homepage />} />
              <Route path="account" element={<Account />} />
            </Route>
          </Routes>
        </main>
      </div>
    </FlashProvider>
  );
}

export default App;
