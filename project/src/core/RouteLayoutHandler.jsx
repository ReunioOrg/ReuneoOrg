import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function RouteLayoutHandler() {
  const { pathname } = useLocation();
  
  // Detect if we're on a full-width organizer route
  const isDashboardRoute = pathname.startsWith('/organizer-dashboard')
    || pathname.startsWith('/organizer-account-details')
    || pathname.startsWith('/create_lobby')
    || pathname.startsWith('/new_organizer')
    || pathname.startsWith('/plan-selection')
    || pathname.startsWith('/tutorial')
    || pathname.startsWith('/contact')
    || pathname.startsWith('/login');

  const isHomeRoute = pathname === '/';

  useEffect(() => {
    const rootElement = document.getElementById('root');
    const bodyElement = document.body;
    
    if (isDashboardRoute) {
      rootElement?.classList.add('dashboard-view');
      bodyElement?.classList.add('dashboard-view');
    } else {
      rootElement?.classList.remove('dashboard-view');
      bodyElement?.classList.remove('dashboard-view');
    }

    if (isHomeRoute) {
      rootElement?.classList.add('phone-frame');
      bodyElement?.classList.add('home-scroll');
    } else {
      rootElement?.classList.remove('phone-frame');
      bodyElement?.classList.remove('home-scroll');
    }
    
    return () => {
      rootElement?.classList.remove('dashboard-view');
      bodyElement?.classList.remove('dashboard-view');
      rootElement?.classList.remove('phone-frame');
      bodyElement?.classList.remove('home-scroll');
    };
  }, [pathname, isDashboardRoute, isHomeRoute]);

  return null;
}

export default RouteLayoutHandler;

