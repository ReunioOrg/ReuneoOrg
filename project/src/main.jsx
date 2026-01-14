import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './core/Auth/AuthContext.jsx'
import ScrollToTop from './core/ScrollToTop.jsx'
import RouteLayoutHandler from './core/RouteLayoutHandler.jsx'

import LoginSignupPage from './core/Auth/LoginSignupPage.jsx'
import LogoutPage from './core/Auth/LogoutPage.jsx'
import LobbyScreen from './core/lobby/lobby.jsx'
import AdminLobbyView from './core/lobby/admin_lobby_view.jsx'
import PureSignupPage from './core/Auth/PureSignupPage.jsx'
import ProductSelection from './core/organizer/product-selection.jsx'
import CreateLobby from './core/organizer/create_lobby.jsx'
import OrganizerSignup from './core/organizer/organizer_signup.jsx'
import OrganizerSignupSuccess from './core/organizer/organizer_signup_success.jsx'
import OrganizerAccountDetails from './core/organizer/organizer_account_details.jsx'
import OrganizerDashboard from './core/organizer/organizer-dashboard.jsx'
import LobbyCountdown from './core/lobby/lobby_countdown.jsx'
import HowToTutorial from './core/lobby/how_to_tutorial.jsx'
import MasterLobbyView from './core/lobby/master_lobby_view.jsx'
import MyCF from './core/community/mycf.jsx'
import PairedPlayerHistory from './core/communities/paired-player-history.jsx'
import PostEventAuth from './core/Auth/post-event-auth.jsx'
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <Router basename="/">
        <ScrollToTop />
        <RouteLayoutHandler />
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/login" element={<LoginSignupPage />} />
          <Route path="/signup" element={<PureSignupPage />} />
          <Route path="/logout" element={<LogoutPage />} />
          <Route path="/lobby" element={<LobbyScreen />} />
          <Route path="/admin_lobby_view" element={<AdminLobbyView />} />
          <Route path="/create_lobby" element={<CreateLobby />} />
          <Route path="/product-selection" element={<ProductSelection />} />
          <Route path="/organizer-signup" element={<OrganizerSignup />} />
          <Route path="/organizer-signup-success" element={<OrganizerSignupSuccess />} />
          <Route path="/organizer-account-details" element={<OrganizerAccountDetails />} />
          <Route path="/organizer-dashboard" element={<OrganizerDashboard />} />
          <Route path="/master_lobby_view" element={<MasterLobbyView />} />
          <Route path="/paired-player-history" element={<PairedPlayerHistory />} />
          <Route path="/post-event-auth" element={<PostEventAuth />} />
          {/* <Route path="/cofounders" element={<MyCF />} /> */}
        </Routes>
        </Router>
      </AuthProvider>
    </StrictMode>,
)