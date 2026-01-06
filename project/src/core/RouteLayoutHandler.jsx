import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function RouteLayoutHandler() {
  const { pathname } = useLocation();
  
  // Detect if we're on the dashboard route
  const isDashboardRoute = pathname.startsWith('/organizer-dashboard');

  useEffect(() => {
    const rootElement = document.getElementById('root');
    const bodyElement = document.body;
    
    if (isDashboardRoute) {
      // Add classes for full-width layout
      rootElement?.classList.add('dashboard-view');
      bodyElement?.classList.add('dashboard-view');
    } else {
      // Remove classes when not on dashboard
      rootElement?.classList.remove('dashboard-view');
      bodyElement?.classList.remove('dashboard-view');
    }
    
    // Cleanup on unmount or route change
    return () => {
      // Ensure cleanup happens
      rootElement?.classList.remove('dashboard-view');
      bodyElement?.classList.remove('dashboard-view');
    };
  }, [pathname, isDashboardRoute]);

  return null;
}

export default RouteLayoutHandler;

