import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './LoginSignupPage.css';
import { apiFetch } from '../utils/api';
import PageNavBar from '../components/PageNavBar/PageNavBar';

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
    const [showPassword, setShowPassword] = useState(false);

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [isDesktop] = useState(() => window.innerWidth >= 769);

    // Check for error query param (e.g., from expired magic link)
    useEffect(() => {
        const errorParam = searchParams.get('error');
        if (errorParam === 'invalid_or_expired_link') {
            setLinkError('Your login link has expired or is invalid. Please request a new one.');
            // Clean up the URL
            window.history.replaceState({}, '', '/login');
        }
    }, [searchParams]);

    const validateIdentifier = (identifier) => {
        // Accept either email format or username format (lowercase alphanumeric)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const usernameRegex = /^[a-z0-9]+$/;
        return identifier.length >= 2 && (emailRegex.test(identifier) || usernameRegex.test(identifier));
    };

    const handleUsernameChange = (e) => {
        // Convert to lowercase, allow email characters (letters, numbers, @, ., -, _)
        const sanitizedValue = e.target.value.toLowerCase().replace(/[^a-z0-9@._\-]/g, '');
        setUsername(sanitizedValue);
        
        // Show the hint when user starts typing (only for non-email input)
        const isEmail = sanitizedValue.includes('@');
        if (sanitizedValue.length > 0 && !isEmail) {
            setShowUsernameHint(true);
        } else {
            setShowUsernameHint(false);
        }
        
        if (validateIdentifier(sanitizedValue)) {
            setFieldErrors(prev => ({ ...prev, username: '' }));
        } else {
            setFieldErrors(prev => ({ ...prev, username: ' ' }));
        }
    };

    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateIdentifier(username)) {
            setError('Please enter a valid email or username');
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
        <div className={`login-page-wrapper${isDesktop ? ' login-desktop' : ''}`}>
            {isDesktop && <PageNavBar />}
            <div className="login-container">
                {!isDesktop && (
                    <button 
                        onClick={() => navigate('/')} 
                        className="login-home-button"
                    >
                        Home
                    </button>
                )}

                {!isDesktop && (
                    <img 
                        src="/assets/reuneo_test_11.png"
                        alt="Reunio Logo"
                        className="logo-image"
                    />
                )}

                <h1 className="login-header">Login</h1>
            
            <div className="login-signup-form">
                {linkError && (
                    <div className="link-error-message">
                        {linkError}
                    </div>
                )}
                {error && <div className="error-message">{error}</div>}

                {linkError && (
                    <>
                        <button 
                            type="button"
                            onClick={() => navigate('/forgot-password')}
                            className="login-primary-button"
                        >
                            Reset Password
                        </button>
                        <div className="divider"><span>or sign in</span></div>
                    </>
                )}
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <input
                            type="text"
                            placeholder="email or username"
                            className="login-input"
                            value={username}
                            onChange={handleUsernameChange}
                            required
                            autoComplete="email"
                        />
                        {showUsernameHint && (
                            <div className="step-success">
                                or username (lowercase letters and numbers)
                            </div>
                        )}
                    </div>
                    <div className="form-group">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="password" 
                            className="login-input login-input-password"
                            value={password}
                            onChange={handlePasswordChange}
                            required
                            autoComplete="current-password"
                        />
                        <button
                            type="button"
                            className="password-toggle-btn"
                            onClick={() => setShowPassword(prev => !prev)}
                            tabIndex={-1}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                                    <line x1="1" y1="1" x2="23" y2="23"/>
                                    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/>
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                    <circle cx="12" cy="12" r="3"/>
                                </svg>
                            )}
                        </button>
                    </div>

                    <button type="submit" className={linkError ? "login-outline-button" : "login-primary-button"}>
                        Login
                    </button>
                </form>

                {!linkError && (
                    <button 
                        type="button"
                        onClick={() => navigate('/forgot-password')}
                        className="forgot-password-link"
                    >
                        Forgot password?
                    </button>
                )}
            </div>
        </div>
        </div>
    );
};

export default LoginSignupPage;