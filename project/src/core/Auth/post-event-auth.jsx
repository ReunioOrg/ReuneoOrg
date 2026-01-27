import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import './post-event-auth.css';
import LoadingSpinner from '../components/LoadingSpinner';
import { apiFetch } from '../utils/api';

// ============================================================
// FEATURE FLAG: Toggle email authentication mode
// ============================================================
// true  = Full email auth (sends magic link, shows "check email" screen)
// false = Direct access (saves email, skips magic link, redirects immediately)
// 
// Set to FALSE if Postmark isn't approved before the event!
// ============================================================
const ENABLE_MAGIC_LINK = true;

const PostEventAuth = () => {
    const navigate = useNavigate();
    const { checkAuth, user, isAuthLoading } = useContext(AuthContext);
    
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [contactUrl, setContactUrl] = useState('');
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [isLoadingUserData, setIsLoadingUserData] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [magicLinkSent, setMagicLinkSent] = useState(false);
    
    // Email confirmation flow state
    const [hasShownEmailToast, setHasShownEmailToast] = useState(false);
    const [hasShownEmailModal, setHasShownEmailModal] = useState(false);
    const [showEmailConfirmModal, setShowEmailConfirmModal] = useState(false);
    const [showEmailWarningToast, setShowEmailWarningToast] = useState(false);
    
    // Ref for email input focus
    const emailInputRef = useRef(null);

    // Wait for auth check, then fetch user data
    useEffect(() => {
        // Wait for auth loading to complete
        if (isAuthLoading) return;
        
        // If not authenticated, redirect to login
        if (!user) {
            navigate('/login');
            return;
        }

        const fetchUserData = async () => {
            try {
                const response = await apiFetch('/load_user');

                if (response.status === 401) {
                    navigate('/login');
                    return;
                }

                if (!response.ok) {
                    throw new Error('Failed to load user data');
                }

                const userData = await response.json();
                
                // Pre-populate form fields with existing values
                setName(userData.profile?.name || '');
                setEmail(userData.email || '');
                setContactUrl(userData.profile?.contact_url || '');
                
                // Check if email is already verified
                setIsEmailVerified(userData.email_verified === true);

            } catch (err) {
                console.error('Error fetching user data:', err);
                setError('Failed to load user data. Please try again.');
            } finally {
                setIsLoadingUserData(false);
            }
        };

        fetchUserData();
    }, [isAuthLoading, user, navigate]);

    // Auto-dismiss email warning toast after 4 seconds
    useEffect(() => {
        if (showEmailWarningToast) {
            const timer = setTimeout(() => {
                setShowEmailWarningToast(false);
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [showEmailWarningToast]);

    // Handle email input focus - show warning toast once
    const handleEmailFocus = () => {
        if (!isEmailVerified && !hasShownEmailToast) {
            setHasShownEmailToast(true);
            setShowEmailWarningToast(true);
        }
    };

    // Actual submission logic (extracted from handleSubmit)
    const executeSubmit = async () => {
        setIsSubmitting(true);
        setError('');

        try {
            // Build payload - only include email if not already verified
            const payload = {
                name: name || '',
                contact_url: contactUrl || ''
            };

            // Only include email if not already verified (verified emails are locked)
            if (!isEmailVerified) {
                payload.email = email || '';
            }

            const response = await apiFetch('/update_profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.status === 401) {
                navigate('/login');
                return;
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || errorData.message || 'Failed to update profile');
            }

            // Check if magic link is enabled (skip if email already verified)
            if (ENABLE_MAGIC_LINK && !isEmailVerified) {
                // Full email auth mode - send magic link
                try {
                    const magicLinkResponse = await apiFetch('/auth/send-magic-link', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ email: email.trim() })
                    });

                    const magicLinkData = await magicLinkResponse.json();

                    if (magicLinkData.success) {
                        // Show success screen
                        setMagicLinkSent(true);
                        toast.success('Check your email for the magic link!', {
                            duration: 4000,
                            style: {
                                background: '#4b73ef',
                                color: 'white',
                                borderRadius: '8px',
                                padding: '12px 20px',
                                fontSize: '0.9rem',
                                fontWeight: '500'
                            }
                        });
                    } else {
                        // Magic link failed but profile was updated - still allow access (Option A fallback)
                        console.error('Magic link failed:', magicLinkData.error);
                        toast.success('Profile saved! (Email verification unavailable)', {
                            duration: 3000
                        });
                        await checkAuth();
                        setTimeout(() => navigate('/paired-player-history'), 1500);
                    }
                } catch (magicLinkErr) {
                    // Magic link request failed but profile was updated (Option A fallback)
                    console.error('Magic link request error:', magicLinkErr);
                    toast.success('Profile saved!', { duration: 2000 });
                    await checkAuth();
                    setTimeout(() => navigate('/paired-player-history'), 1500);
                }
            } else {
                // Direct access mode - skip magic link, redirect immediately
                // Email is saved for future use when Postmark is approved
                toast.success('Profile saved! Redirecting to your matches...', {
                    duration: 2000,
                    style: {
                        background: '#4b73ef',
                        color: 'white',
                        borderRadius: '8px',
                        padding: '12px 20px',
                        fontSize: '0.9rem',
                        fontWeight: '500'
                    }
                });
                await checkAuth();
                setTimeout(() => navigate('/paired-player-history'), 1500);
            }

        } catch (err) {
            console.error('Error updating profile:', err);
            setError(err.message || 'An error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle modal "Yes, it's correct" click
    const handleModalConfirm = () => {
        setShowEmailConfirmModal(false);
        executeSubmit();
    };

    // Handle modal "Let me edit" click
    const handleModalCancel = () => {
        setShowEmailConfirmModal(false);
        // Focus the email input for editing
        setTimeout(() => {
            emailInputRef.current?.focus();
        }, 100);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validate email is required
        if (!email || !email.trim()) {
            setError('Email is required to access your matches.');
            return;
        }

        // Basic email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            setError('Please enter a valid email address.');
            return;
        }

        // Show confirmation modal once (only if email is not verified)
        if (!isEmailVerified && !hasShownEmailModal) {
            setHasShownEmailModal(true);
            setShowEmailConfirmModal(true);
            return;
        }

        // If modal already shown or email is verified, proceed with submission
        executeSubmit();
    };

    // Show fullscreen spinner while checking auth
    if (isAuthLoading || isLoadingUserData) {
        return <LoadingSpinner fullScreen />;
    }

    // Show "check your email" screen after magic link is sent
    if (magicLinkSent) {
        return (
            <div className="post-event-auth-container">
                <Toaster position="top-center" />
                
                <div className="step-form-container" style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <div style={{ 
                        fontSize: '48px', 
                        marginBottom: '20px'
                    }}>
                        📧
                    </div>
                    <h2 style={{ 
                        color: '#545454', 
                        marginBottom: '16px',
                        fontSize: '1.5rem'
                    }}>
                        Check Your Email!
                    </h2>
                    <p style={{ 
                        color: '#545454', 
                        marginBottom: '24px',
                        lineHeight: '1.6'
                    }}>
                        We sent a magic link to <strong>{email}</strong>
                        <br /><br />
                        Click the link in your email to access your matches.
                    </p>
                    <p style={{ 
                        color: '#777777', 
                        fontSize: '0.85rem',
                        marginBottom: '24px'
                    }}>
                        The link expires in 15 minutes.
                        <br />
                        Don't see it? Check your spam folder.
                    </p>
                    <button 
                        onClick={() => setMagicLinkSent(false)}
                        className="primary-button"
                        style={{ 
                            marginTop: '10px'
                        }}
                    >
                        ← Back to Form
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="post-event-auth-container">
            <Toaster position="top-center" />
            
            <button 
                onClick={() => navigate('/')} 
                className="homescreen-button"
            >
                Home
            </button>

            <h3 className="post-event-auth-header">
                Gain Access to Your Matches
            </h3>

            <div className="step-form-container">
                <form onSubmit={handleSubmit}>
                    {error && (
                        <div className="error-message" style={{ marginBottom: '20px' }}>
                            {error}
                        </div>
                    )}

                    <div style={{ marginTop: '0' }}>
                        <label className="step-label">
                            Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your name"
                            className="step-input"
                        />
                    </div>

                    <div style={{ marginTop: '20px', position: 'relative' }}>
                        <label className="step-label">
                            Email <span style={{ color: '#ff6b6b' }}>*</span>
                            {isEmailVerified && (
                                <span style={{ 
                                    color: '#4ade80', 
                                    fontSize: '0.75rem', 
                                    marginLeft: '8px',
                                    fontWeight: '500'
                                }}>
                                    (Verified)
                                </span>
                            )}
                        </label>
                        
                        {/* Email Warning Toast - positioned above input */}
                        {showEmailWarningToast && (
                            <div className="email-warning-toast">
                                <span className="email-warning-icon">⚠️</span>
                                <span className="email-warning-text">Make sure the email is correct</span>
                            </div>
                        )}
                        
                        <input
                            ref={emailInputRef}
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onFocus={handleEmailFocus}
                            placeholder="Enter your email"
                            className="step-input"
                            required
                            disabled={isEmailVerified}
                            style={isEmailVerified ? {
                                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                color: '#888888',
                                cursor: 'not-allowed',
                                borderColor: 'rgba(255, 255, 255, 0.15)'
                            } : {}}
                        />
                    </div>

                    <div style={{ marginTop: '20px' }}>
                        <label className="step-label">
                            Contact URL
                        </label>
                        <input
                            type="text"
                            value={contactUrl}
                            onChange={(e) => setContactUrl(e.target.value)}
                            placeholder="Enter your contact URL (e.g., https://linkedin.com/...)"
                            className="step-input"
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="primary-button"
                        disabled={isSubmitting}
                        style={{ marginTop: '30px' }}
                    >
                        {isSubmitting 
                            ? (isEmailVerified ? 'Updating...' : 'Submitting...') 
                            : (isEmailVerified ? 'Update' : 'Submit')}
                    </button>
                </form>
            </div>

            {/* Email Confirmation Modal */}
            {showEmailConfirmModal && (
                <div className="email-confirm-modal-overlay">
                    <div className="email-confirm-modal">
                        <div className="email-confirm-modal-icon">📧</div>
                        <h3 className="email-confirm-modal-title">Is this email correct?</h3>
                        <p className="email-confirm-modal-subtitle">Make sure its right</p>
                        <div className="email-confirm-modal-email">{email}</div>
                        <div className="email-confirm-modal-buttons">
                            <button 
                                className="email-confirm-btn email-confirm-btn-yes"
                                onClick={handleModalConfirm}
                            >
                                Yes, it's correct
                            </button>
                            <button 
                                className="email-confirm-btn email-confirm-btn-no"
                                onClick={handleModalCancel}
                            >
                                Let me edit
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PostEventAuth;
