import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [accessToken, setAccessToken] = useState(null);
    const [refreshToken, setRefreshToken] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

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
      // Check if we have a token
      const token = localStorage.getItem('access_token');
      
      if (token) {
        try {
          // Verify token with your backend
          const response = await fetch(window.server_url+'/load_user', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (response.ok) {
            setIsAuthenticated(true);
            // Set user data
            const userData = await response.json();
            console.log("USER DATA:", userData);
            setUser(userData.username);
            setUserProfile(userData.profile);
            // setUser(userData);
          } else {
            // Token invalid - clean up
            console.log("TOKEN INVALID");
            localStorage.removeItem('token');
          }
        } catch (error) {
          // Handle error
          console.log("ERROR:", error);
        }
      }
    };

    useEffect(() => {
      checkAuth();
    }, []);

    const login = (userData) => {
      setUser(userData.username);
      setAccessToken(userData.access_token);
      setRefreshToken(userData.refresh_token);
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

    const logout = () => {
      setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, signup, logout, userProfile, checkAuth}}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;