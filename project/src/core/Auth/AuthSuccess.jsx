/**
 * AuthSuccess.jsx
 * Landing page after user clicks magic link in email.
 * The backend has already validated the token and set the session cookie.
 * This page just needs to verify the session and update the app state.
 */

import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import './AuthSuccess.css';

const AuthSuccess = () => {
  const navigate = useNavigate();
  const { checkAuth } = useContext(AuthContext);
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const verifySession = async () => {
      try {
        // Call the session endpoint to verify the cookie was set correctly
        const response = await fetch(`${window.server_url}/auth/session`, {
          method: 'GET',
          credentials: 'include', // Important: send cookies cross-origin
        });

        if (response.ok) {
          const data = await response.json();
          
          if (data.authenticated) {
            setStatus('success');
            
            // Refresh the auth context to pick up the new session
            await checkAuth();
            
            // Redirect to home after a brief success message
            setTimeout(() => {
              navigate('/');
            }, 2000);
          } else {
            setStatus('error');
            setErrorMessage('Session not found. Please try logging in again.');
          }
        } else {
          setStatus('error');
          setErrorMessage('Could not verify your session. Please try again.');
        }
      } catch (error) {
        console.error('Session verification error:', error);
        setStatus('error');
        setErrorMessage('Network error. Please check your connection and try again.');
      }
    };

    verifySession();
  }, [checkAuth, navigate]);

  return (
    <div className="auth-success-container">
      <div className="auth-success-card">
        {status === 'verifying' && (
          <>
            <div className="auth-success-spinner"></div>
            <h2>Signing you in...</h2>
            <p>Please wait while we verify your session.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="auth-success-checkmark">✓</div>
            <h2>Welcome to Reuneo!</h2>
            <p>You're now signed in. Redirecting you...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="auth-success-error">✕</div>
            <h2>Something went wrong</h2>
            <p>{errorMessage}</p>
            <button 
              className="auth-success-button"
              onClick={() => navigate('/login')}
            >
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthSuccess;
