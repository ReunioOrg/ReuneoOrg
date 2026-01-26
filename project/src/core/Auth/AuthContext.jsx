import React, { createContext, useState, useEffect, useRef } from 'react';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [accessToken, setAccessToken] = useState(null);
    const [refreshToken, setRefreshToken] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [permissions, setPermissions] = useState(null);
    const [emailVerified, setEmailVerified] = useState(false);
    const [isAuthLoading, setIsAuthLoading] = useState(true); // Start true - we're checking auth on mount
    const [authLoadingMessage, setAuthLoadingMessage] = useState('Connecting...');
    
    // Ref to track slow connection timer (for cleanup)
    const slowConnectionTimerRef = useRef(null);

    // useEffect(() => {
    //   // Check for cached user data (e.g., from localStorage or cookies)
    //   const cachedUser = localStorage.getItem('user');
    //   const cachedAccessToken = localStorage.getItem('access_token');
    //   const cachedRefreshToken = localStorage.getItem('refresh_token');
    //   console.log("CACHED USER:", cachedUser, cachedAccessToken, cachedRefreshToken);

    //   if (cachedUser && cachedAccessToken && cachedRefreshToken) {
    //     login({
    //       username: cachedUser,
    //       access_token: cachedAccessToken,
    //       refresh_token: cachedRefreshToken
    //     });
    //   }
    // }, []);

    const checkAuth = async () => {
      setIsAuthLoading(true);
      setAuthLoadingMessage('Connecting...');
      
      // Clear any existing slow connection timer
      if (slowConnectionTimerRef.current) {
        clearTimeout(slowConnectionTimerRef.current);
      }
      
      // Start 10-second timer for slow connection message
      slowConnectionTimerRef.current = setTimeout(() => {
        setAuthLoadingMessage('Taking longer than expected. Check your connection.');
      }, 10000);
      
      try {
        // 1. First try session-based auth (cookie from email magic link)
        try {
          const sessionResponse = await fetch(window.server_url + '/auth/session', {
            method: 'GET',
            credentials: 'include', // Send cookies cross-origin
          });
          
          if (sessionResponse.ok) {
            const sessionData = await sessionResponse.json();
            if (sessionData.authenticated) {
              console.log("SESSION AUTH SUCCESS:", sessionData);
              
              // Check if session is for a different user than what's cached in localStorage
              const cachedUser = localStorage.getItem('user');
              if (cachedUser && cachedUser !== sessionData.user.username) {
                // Different user - clear stale credentials to avoid conflicts
                console.log("Session user differs from cached user, clearing stale credentials");
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('user');
              }
              
              // If session response includes JWT, store it (forward-compatible)
              // This enables magic link users to get JWT persistence
              if (sessionData.access_token) {
                console.log("Session includes JWT, storing in localStorage");
                localStorage.setItem('access_token', sessionData.access_token);
                localStorage.setItem('user', sessionData.user.username);
                if (sessionData.refresh_token) {
                  localStorage.setItem('refresh_token', sessionData.refresh_token);
                }
              }
              
              setIsAuthenticated(true);
              setUser(sessionData.user.username);
              setUserProfile(sessionData.user.profile || null);
              setPermissions(sessionData.user.permissions || null);
              setEmailVerified(sessionData.user.email_verified === true);
              return; // Session auth succeeded, no need to try JWT
            }
          }
        } catch (error) {
          console.log("Session auth check failed (this is ok if using JWT):", error);
        }

        // 2. Fall back to JWT auth (localStorage token from username/password login)
        const token = localStorage.getItem('access_token');
        
        if (token) {
          try {
            // Verify token with your backend
            const response = await fetch(window.server_url+'/load_user', {
              headers: { 
                'Authorization': `Bearer ${token}` 
              },
              credentials: 'include', // Also include cookies for future compatibility
            });
            
            if (response.ok) {
              setIsAuthenticated(true);
              // Set user data
              const userData = await response.json();
              console.log("JWT AUTH SUCCESS:", userData);
              setUser(userData.username);
              setUserProfile(userData.profile);
              setPermissions(userData.permissions);
              setEmailVerified(userData.email_verified === true);
              console.log("PERMISSIONS:", userData.permissions);
            } else {
              // Token invalid (server explicitly rejected) - clean up
              console.log("TOKEN INVALID");
              localStorage.removeItem('access_token');
              setUser(null);
              setUserProfile(null);
              setAccessToken(null);
              setRefreshToken(null);
              setIsAuthenticated(false);
            }
          } catch (error) {
            // Network error - use optimistic auth if we have cached user data
            console.log("JWT auth error (network issue):", error);
            const cachedUser = localStorage.getItem('user');
            if (token && cachedUser) {
              console.log("Using optimistic auth with cached user:", cachedUser);
              setUser(cachedUser);
              setIsAuthenticated(true);
              // Note: userProfile and permissions will be null/stale, but user stays "logged in"
              // Once network recovers, API calls will fetch fresh data
            }
          }
        }
      } finally {
        // Clear the slow connection timer
        if (slowConnectionTimerRef.current) {
          clearTimeout(slowConnectionTimerRef.current);
          slowConnectionTimerRef.current = null;
        }
        setIsAuthLoading(false); // Always set loading to false when done
      }
    };

    useEffect(() => {
      checkAuth();
    }, []);

    const login = (userData) => {
      setUser(userData.username);
      setAccessToken(userData.access_token);
      setRefreshToken(userData.refresh_token);
      setPermissions(userData.permissions);
      console.log("PRE SAVE USERNAME:", userData.username);

      localStorage.setItem('user', userData.username);
      localStorage.setItem('access_token', userData.access_token);
      localStorage.setItem('refresh_token', userData.refresh_token);
    };


    const signup = async (username, password) => {
      const response = await fetch(window.server_url+'/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ "username": username, "password": password }),
      });

      if (response.ok) {
        const userData = await response.json();
        console.log("SIGNED UP, userData:", userData);
        // await checkAuth()
      }
    };

    const logout = async () => {
      // Clear session cookie on backend (for email auth)
      try {
        await fetch(window.server_url + '/auth/logout', {
          method: 'POST',
          credentials: 'include',
        });
      } catch (error) {
        console.log("Logout request failed (session may already be cleared):", error);
      }

      // Clear local state and localStorage (for JWT auth)
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      
      setUser(null);
      setUserProfile(null);
      setAccessToken(null);
      setRefreshToken(null);
      setIsAuthenticated(false);
      setPermissions(null);
      setEmailVerified(false);
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, userProfile, checkAuth, permissions, emailVerified, isAuthLoading, authLoadingMessage }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;