import React, { useContext, useState } from 'react';
import { AuthContext } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import './LoginSignupPage.css';

const LoginSignupPage = () => {
    const { login, signup, user, logout, checkAuth } = useContext(AuthContext);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [error, setError] = useState('');
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [fieldErrors, setFieldErrors] = useState({});

    const navigate = useNavigate();

    const validateUsername = (username) => {
        // Regular expression to match only lowercase letters and numbers
        const validUsernameRegex = /^[a-z0-9]+$/;
        return username.length >= 2 && validUsernameRegex.test(username);
    };

    const handleUsernameChange = (e) => {
        // Convert input to lowercase and remove any non-alphanumeric characters
        const sanitizedValue = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '');
        setUsername(sanitizedValue);
        
        if (validateUsername(sanitizedValue)) {
            setFieldErrors(prev => ({ ...prev, username: '' }));
        } else {
            setFieldErrors(prev => ({ ...prev, username: ' ' }));
        }
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
            const response = await fetch(window.server_url+endpoint, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ username, password }),
                mode: 'cors'
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
                src="/assets/reunio-game-logo-1.png"
                alt="Reunio Logo"
                className="logo-image"
            />

            <h1 className="login-header">Login</h1>
            
            <div className="login-signup-form">
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
                    </div>
                    <div className="form-group">
                        <input
                            type="password"
                            placeholder="Password" 
                            className="login-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="primary-button">
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginSignupPage;