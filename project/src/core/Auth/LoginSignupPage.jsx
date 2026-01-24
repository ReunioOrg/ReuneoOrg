import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './LoginSignupPage.css';
import { apiFetch } from '../utils/api';

const LoginSignupPage = () => {
    const { login, signup, user, logout, checkAuth } = useContext(AuthContext);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [error, setError] = useState('');
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [fieldErrors, setFieldErrors] = useState({});
    const [showUsernameHint, setShowUsernameHint] = useState(false);
    const [linkError, setLinkError] = useState('');

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Check for error query param (e.g., from expired magic link)
    useEffect(() => {
        const errorParam = searchParams.get('error');
        if (errorParam === 'invalid_or_expired_link') {
            setLinkError('Your login link has expired or is invalid. Please request a new one.');
            // Clean up the URL
            window.history.replaceState({}, '', '/login');
        }
    }, [searchParams]);

    const validateUsername = (username) => {
        // Regular expression to match only lowercase letters and numbers
        const validUsernameRegex = /^[a-z0-9]+$/;
        return username.length >= 2 && validUsernameRegex.test(username);
    };

    const handleUsernameChange = (e) => {
        // Convert input to lowercase and remove any non-alphanumeric characters
        const sanitizedValue = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '');
        setUsername(sanitizedValue);
        
        // Show the hint when user starts typing
        if (sanitizedValue.length > 0) {
            setShowUsernameHint(true);
        } else {
            setShowUsernameHint(false);
        }
        
        if (validateUsername(sanitizedValue)) {
            setFieldErrors(prev => ({ ...prev, username: '' }));
        } else {
            setFieldErrors(prev => ({ ...prev, username: ' ' }));
        }
    };

    const handlePasswordChange = (e) => {
        // Convert input to lowercase to handle iPhone auto-capitalization
        const sanitizedValue = e.target.value.toLowerCase();
        setPassword(sanitizedValue);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateUsername(username)) {
            setError('Please enter a valid username');
            return;
        }

        try {
            const endpoint = isLoginMode ? '/login' : '/signup';
            const response = await apiFetch(endpoint, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (response.ok) {
                const userData = await response.json();
                if (isLoginMode) {
                    login(userData);
                    checkAuth();
                } else {
                    // After successful signup, automatically log them in
                    login(userData);
                    checkAuth();
                }
                navigate('/');
            } else {
                const errorData = await response.json();
                setError(errorData.message || `${isLoginMode ? 'Login' : 'Signup'} failed`);
            }
        } catch (error) {
            setError('Network error occurred. Please try again.');
            console.error('Error:', error);
        }
    };

    return (
        <div className="login-container">
            <button 
                onClick={() => navigate('/')} 
                className="homescreen-button"
            >
                Home
            </button>

            <img 
                src="/assets/reuneo_test_8.png"
                alt="Reunio Logo"
                className="logo-image"
            />

            <h1 className="login-header">Login</h1>
            
            <div className="login-signup-form">
                {linkError && (
                    <div className="error-message" style={{ 
                        backgroundColor: 'rgba(255, 107, 107, 0.1)',
                        border: '1px solid rgba(255, 107, 107, 0.3)',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        marginBottom: '16px'
                    }}>
                        {linkError}
                    </div>
                )}
                {error && <div className="error-message">{error}</div>}
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <input
                            type="text"
                            placeholder="Username"
                            className="login-input"
                            value={username}
                            onChange={handleUsernameChange}
                            required
                        />
                        {showUsernameHint && (
                            <div className="step-success">
                                lowercase letters and numbers only
                            </div>
                        )}
                    </div>
                    <div className="form-group">
                        <input
                            type="text"
                            placeholder="Password" 
                            className="login-input"
                            value={password}
                            onChange={handlePasswordChange}
                            required
                        />
                    </div>

                    <button type="submit" className="login-primary-button">
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginSignupPage;