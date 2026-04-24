import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../Auth/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import './PageNavBar.css';

const PageNavBar = () => {
  const { user, permissions, isLegacyOrganizer } = useContext(AuthContext);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDesktop] = useState(() => window.innerWidth >= 769);

  const isActivePaidOrganizer = permissions === 'organizer' && !isLegacyOrganizer;
  const pricingLabel = isActivePaidOrganizer ? 'Plan' : 'Pricing';
  const pricingPath = isActivePaidOrganizer ? '/organizer-account-details' : '/plan-selection';

  if (isDesktop) {
    return (
      <nav className="page-nav-bar">
        <img
          src="/assets/reuneo_test_14.png"
          alt="Reuneo Logo"
          className="page-nav-logo"
          onClick={() => navigate('/')}
        />
        <div className="page-nav-links">
          <button onClick={() => navigate('/tutorial')}>Tutorial</button>
          <button onClick={() => navigate(pricingPath)}>{pricingLabel}</button>
          <button onClick={() => navigate('/contact')}>Contact</button>
          {user && (permissions === 'organizer' || permissions === 'admin') && (
            <button onClick={() => navigate('/organizer-dashboard')}>Organizer</button>
          )}
          {user && (
            <button onClick={() => navigate('/paired-player-history')}>Matches</button>
          )}
        </div>
        <div className="page-nav-auth">
          <button className="page-nav-join" onClick={() => navigate('/', { state: { openJoinLobby: true } })}>
            Join Lobby
          </button>
          {!user ? (
            <button className="page-nav-login" onClick={() => navigate('/login')}>Login</button>
          ) : (
            <>
              <button className="page-nav-profile-btn" onClick={() => navigate('/')}>Profile</button>
              <button className="page-nav-logout-btn" onClick={() => navigate('/logout')}>Logout</button>
            </>
          )}
        </div>
      </nav>
    );
  }

  return (
    <>
      <nav className="page-nav-bar-mobile">
        <img
          src="/assets/reuneo_test_14.png"
          alt="Reuneo Logo"
          className="page-nav-logo"
          onClick={() => navigate('/')}
        />
        <button className="page-nav-hamburger" onClick={() => setMenuOpen(true)} aria-label="Open menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="page-menu-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="page-menu-content"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <div className="page-menu-header">
                <img
                  src="/assets/reuneo_test_14.png"
                  alt="Reuneo Logo"
                  className="page-menu-logo"
                  onClick={() => { navigate('/'); setMenuOpen(false); }}
                />
                <button className="page-menu-close" onClick={() => setMenuOpen(false)} aria-label="Close menu">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <div className="page-menu-links">
                {!user ? (
                  <button className="page-menu-link" onClick={() => { navigate('/login'); setMenuOpen(false); }}>Login</button>
                ) : (
                  <button className="page-menu-link" onClick={() => { navigate('/logout'); setMenuOpen(false); }}>Logout</button>
                )}
                <button className="page-menu-link" onClick={() => { navigate(pricingPath); setMenuOpen(false); }}>{pricingLabel}</button>
                <button className="page-menu-link" onClick={() => { navigate('/contact'); setMenuOpen(false); }}>Contact</button>
                <button className="page-menu-link" onClick={() => { navigate('/tutorial'); setMenuOpen(false); }}>Tutorial</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PageNavBar;
