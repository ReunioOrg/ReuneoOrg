import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../Auth/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import './PageNavBar.css';

/** White wordmark for glass bar over hero video (transparent BG). */
const MOBILE_HOME_GLASS_LOGO_SRC = '/assets/Reuneo%20(White%20-%20Horizontal).svg';

/** Color / dark horizontal wordmark for home past the video hero (light page sections). */
const MOBILE_HOME_COLOR_HORIZONTAL_LOGO_SRC =
  '/assets/Reuneo%20(Color%20-%20Horizontal).svg';

/**
 * @typedef {'page' | 'home'} PageNavVariant
 *
 * Shared top nav — desktop horizontal bar; mobile: logo + hamburger / full-screen menu.
 * Pass `variant="home"` for `/` plus `menuOpen` + `onMenuOpenChange` to sync scroll-lock / floating CTA in App.jsx.
 * `pastVideoHero` (mobile home only): when true, color horizontal logo + dark hamburger — mirrors App `mobileCtaPastVideoHero`.
 */

function PageNavBar({
  variant = 'page',
  pastVideoHero = false,
  menuOpen: controlledMenuOpen,
  onMenuOpenChange,
  onJoinLobby,
  onProfileClick,
  joinLobbyDisabled = false,
  joinLobbyTitle,
}) {
  const { user, permissions, isLegacyOrganizer } = useContext(AuthContext);
  const navigate = useNavigate();
  const [internalMenuOpen, setInternalMenuOpen] = useState(false);
  const [isDesktop] = useState(() => window.innerWidth >= 769);

  const isControlledMenu = controlledMenuOpen !== undefined && typeof onMenuOpenChange === 'function';
  const menuOpen = isControlledMenu ? controlledMenuOpen : internalMenuOpen;
  const setMenuOpen = isControlledMenu ? onMenuOpenChange : setInternalMenuOpen;

  const isHome = variant === 'home';

  const isActivePaidOrganizer = permissions === 'organizer' && !isLegacyOrganizer;
  const pricingLabel = isActivePaidOrganizer ? 'Plan' : 'Pricing';
  const pricingPath = isActivePaidOrganizer ? '/organizer-account-details' : '/plan-selection';

  const closeMenu = () => setMenuOpen(false);

  const handleJoinLobby = () => {
    closeMenu();
    if (isHome && typeof onJoinLobby === 'function') {
      onJoinLobby();
      return;
    }
    navigate('/', { state: { openJoinLobby: true } });
  };

  const handleProfile = () => {
    closeMenu();
    if (isHome && typeof onProfileClick === 'function') {
      onProfileClick();
      return;
    }
    navigate('/');
  };

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
          <button type="button" onClick={() => navigate('/tutorial')}>Tutorial</button>
          <button type="button" onClick={() => navigate(pricingPath)}>{pricingLabel}</button>
          <button type="button" onClick={() => navigate('/contact')}>Contact</button>
          {user && (permissions === 'organizer' || permissions === 'admin') && (
            <button type="button" onClick={() => navigate('/organizer-dashboard')}>Organizer</button>
          )}
          {user && (
            <button type="button" onClick={() => navigate('/paired-player-history')}>Matches</button>
          )}
        </div>
        <div className="page-nav-auth">
          <button type="button" className="page-nav-join" onClick={() => navigate('/', { state: { openJoinLobby: true } })}>
            Join Lobby
          </button>
          {!user ? (
            <button type="button" className="page-nav-login" onClick={() => navigate('/login')}>Login</button>
          ) : (
            <>
              <button type="button" className="page-nav-profile-btn" onClick={() => navigate('/')}>Profile</button>
              <button type="button" className="page-nav-logout-btn" onClick={() => navigate('/logout')}>Logout</button>
            </>
          )}
        </div>
      </nav>
    );
  }

  const glassOverVideoHero = isHome && !pastVideoHero;
  const mobileHomeHorizontalWordmark = glassOverVideoHero || (isHome && pastVideoHero);

  const mobileLogoSrc = glassOverVideoHero
    ? MOBILE_HOME_GLASS_LOGO_SRC
    : isHome && pastVideoHero
      ? MOBILE_HOME_COLOR_HORIZONTAL_LOGO_SRC
      : '/assets/reuneo_test_14.png';

  const mobileNavClass = [
    'page-nav-bar-mobile',
    isHome ? 'page-nav-bar-mobile--fixed-home page-nav-bar-mobile--glass' : '',
    isHome && pastVideoHero ? 'page-nav-bar-mobile--past-video-hero' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <nav className={mobileNavClass}>
        <img
          src={mobileLogoSrc}
          alt="Reuneo Logo"
          className={`page-nav-logo${mobileHomeHorizontalWordmark ? ' page-nav-logo--mobile-horizontal' : ''}`}
          onClick={() => navigate('/')}
        />
        <button type="button" className="page-nav-hamburger" onClick={() => setMenuOpen(true)} aria-label="Open menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
                  onClick={() => { navigate('/'); closeMenu(); }}
                />
                <button type="button" className="page-menu-close" onClick={closeMenu} aria-label="Close menu">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <div className="page-menu-links page-menu-links-scroll">
                {!user ? (
                  <>
                    <button type="button" className="page-menu-link" onClick={() => { navigate('/login'); closeMenu(); }}>
                      Login
                    </button>
                    <button
                      type="button"
                      className="page-menu-link"
                      disabled={joinLobbyDisabled}
                      title={joinLobbyTitle || undefined}
                      onClick={() => !joinLobbyDisabled && handleJoinLobby()}
                    >
                      Join Lobby
                    </button>
                    <button type="button" className="page-menu-link" onClick={() => { navigate(pricingPath); closeMenu(); }}>
                      Pricing
                    </button>
                    <button type="button" className="page-menu-link" onClick={() => { navigate('/tutorial'); closeMenu(); }}>
                      Tutorial
                    </button>
                    <button type="button" className="page-menu-link" onClick={() => { navigate('/contact'); closeMenu(); }}>
                      Contact
                    </button>
                  </>
                ) : permissions === 'organizer' || permissions === 'admin' ? (
                  <>
                    {permissions === 'admin' && (
                      <button type="button" className="page-menu-link" onClick={() => { navigate('/master_lobby_view'); closeMenu(); }}>
                        Lobbies
                      </button>
                    )}
                    <button type="button" className="page-menu-link" onClick={() => { navigate('/organizer-dashboard'); closeMenu(); }}>
                      Organizer
                    </button>
                    <button type="button" className="page-menu-link" onClick={() => { navigate('/paired-player-history'); closeMenu(); }}>
                      Matches
                    </button>
                    <button
                      type="button"
                      className="page-menu-link"
                      disabled={joinLobbyDisabled}
                      title={joinLobbyTitle || undefined}
                      onClick={() => !joinLobbyDisabled && handleJoinLobby()}
                    >
                      Join Lobby
                    </button>
                    <button type="button" className="page-menu-link" onClick={handleProfile}>
                      Profile
                    </button>
                    <button type="button" className="page-menu-link" onClick={() => { navigate('/logout'); closeMenu(); }}>
                      Logout
                    </button>
                    <button type="button" className="page-menu-link" onClick={() => { navigate(pricingPath); closeMenu(); }}>
                      {pricingLabel}
                    </button>
                    <button type="button" className="page-menu-link" onClick={() => { navigate('/tutorial'); closeMenu(); }}>
                      Tutorial
                    </button>
                    <button type="button" className="page-menu-link" onClick={() => { navigate('/contact'); closeMenu(); }}>
                      Contact
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" className="page-menu-link" onClick={() => { navigate('/paired-player-history'); closeMenu(); }}>
                      Matches
                    </button>
                    <button
                      type="button"
                      className="page-menu-link"
                      disabled={joinLobbyDisabled}
                      title={joinLobbyTitle || undefined}
                      onClick={() => !joinLobbyDisabled && handleJoinLobby()}
                    >
                      Join Lobby
                    </button>
                    <button type="button" className="page-menu-link" onClick={handleProfile}>
                      Profile
                    </button>
                    <button type="button" className="page-menu-link" onClick={() => { navigate('/logout'); closeMenu(); }}>
                      Logout
                    </button>
                    <button type="button" className="page-menu-link" onClick={() => { navigate(pricingPath); closeMenu(); }}>
                      Pricing
                    </button>
                    <button type="button" className="page-menu-link" onClick={() => { navigate('/tutorial'); closeMenu(); }}>
                      Tutorial
                    </button>
                    <button type="button" className="page-menu-link" onClick={() => { navigate('/contact'); closeMenu(); }}>
                      Contact
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default PageNavBar;
