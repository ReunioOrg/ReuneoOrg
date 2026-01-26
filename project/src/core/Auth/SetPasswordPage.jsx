import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import './SetPasswordPage.css';
import LoadingSpinner from '../components/LoadingSpinner';
import { apiFetch } from '../utils/api';

/**
 * SetPasswordPage - Dedicated page for setting password after magic link verification
 * 
 * Flow:
 * 1. User clicks magic link → redirected here with ?token=xxx
 * 2. Page validates token and displays email (locked)
 * 3. User enters new password
 * 4. Password is saved, session created, redirected to matches
 */
const SetPasswordPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { checkAuth } = useContext(AuthContext);
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isValidating, setIsValidating] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [tokenError, setTokenError] = useState('');
    
    const token = searchParams.get('token');

    // Validate token on mount
    useEffect(() => {
        const validateToken = async () => {
            if (!token) {
                setTokenError('No token provided. Please request a new magic link.');
                setIsValidating(false);
                return;
            }

            try {
                const response = await fetch(
                    `${window.server_url}/auth/verify-setup-token?token=${encodeURIComponent(token)}`,
                    { credentials: 'include' }
                );
                
                const data = await response.json();
                
                if (data.valid && data.email) {
                    setEmail(data.email);
                } else {
                    setTokenError(data.error || 'Invalid or expired token. Please request a new magic link.');
                }
            } catch (err) {
                console.error('Token validation error:', err);
                setTokenError('Unable to validate token. Please try again.');
            } finally {
                setIsValidating(false);
            }
        };

        validateToken();
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validate password
        if (!password) {
            setError('Password is required');
            return;
        }

        if (password.length < 2) {
            setError('Password must be at least 2 characters');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await apiFetch('/auth/set-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token: token,
                    password: password
                })
            });

            const data = await response.json();

            if (data.success) {
                // Password set successfully
                // Refresh auth state to pick up the new session
                await checkAuth();
                
                // Redirect to matches page
                navigate('/paired-player-history');
            } else {
                setError(data.error || 'Failed to set password. Please try again.');
            }
        } catch (err) {
            console.error('Set password error:', err);
            setError('An error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Show loading while validating token
    if (isValidating) {
        return <LoadingSpinner fullScreen message="Verifying..." />;
    }

    // Show error if token is invalid
    if (tokenError) {
        return (
            <div className="set-password-container">
                <button 
                    onClick={() => navigate('/')} 
                    className="homescreen-button"
                >
                    Home
                </button>

                <div className="set-password-error-container">
                    <div className="error-icon">⚠️</div>
                    <h2 className="error-title">Link Expired or Invalid</h2>
                    <p className="error-description">{tokenError}</p>
                    <button 
                        onClick={() => navigate('/login')}
                        className="primary-button"
                        style={{ marginTop: '20px' }}
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="set-password-container">
            <button 
                onClick={() => navigate('/')} 
                className="homescreen-button"
            >
                Home
            </button>

            <h3 className="set-password-header">
                Set Your Password
            </h3>
            
            <p className="set-password-subtitle">
                You'll use this to log in later
            </p>

            <div className="step-form-container">
                <form onSubmit={handleSubmit}>
                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    <div style={{ marginTop: '0' }}>
                        <label className="step-label">
                            Email
                        </label>
                        <div className="email-display">
                            <input
                                type="email"
                                value={email}
                                className="step-input email-locked"
                                disabled
                                readOnly
                            />
                            <span className="lock-icon">🔒</span>
                        </div>
                        <p className="email-hint">
                            This is the email you verified
                        </p>
                    </div>

                    <div style={{ marginTop: '24px' }}>
                        <label className="step-label">
                            Create Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter a password"
                            className="step-input"
                            autoFocus
                            autoComplete="new-password"
                        />
                    </div>

                    <div style={{ marginTop: '16px' }}>
                        <label className="step-label">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm your password"
                            className="step-input"
                            autoComplete="new-password"
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="primary-button"
                        disabled={isSubmitting || !password}
                        style={{ marginTop: '30px' }}
                    >
                        {isSubmitting ? 'Setting Password...' : 'Set Password'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SetPasswordPage;
