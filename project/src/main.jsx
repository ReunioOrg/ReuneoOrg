import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './core/Auth/AuthContext.jsx'

import LoginSignupPage from './core/Auth/LoginSignupPage.jsx'
import LogoutPage from './core/Auth/LogoutPage.jsx'
import LobbyScreen from './core/lobby/lobby.jsx'
import AdminLobbyView from './core/lobby/admin_lobby_view.jsx'
import PureSignupPage from './core/Auth/PureSignupPage.jsx'
import ProductSelection from './core/organizer/product-selection.jsx'
// import CreateLobby from './core/lobby/create_lobby.jsx'
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <Router basename="/">
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/login" element={<LoginSignupPage />} />
          <Route path="/signup" element={<PureSignupPage />} />
          <Route path="/logout" element={<LogoutPage />} />
          <Route path="/lobby" element={<LobbyScreen />} />
          <Route path="/admin_lobby_view" element={<AdminLobbyView />} />
          <Route path="/product-selection" element={<ProductSelection />} />
        </Routes>
        </Router>
      </AuthProvider>
    </StrictMode>,
)