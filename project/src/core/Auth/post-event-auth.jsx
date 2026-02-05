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
    
    // Social links state
    const [instagram, setInstagram] = useState('');
    const [facebook, setFacebook] = useState('');
    const [personalEmail, setPersonalEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [website, setWebsite] = useState('');
    const [tiktok, setTiktok] = useState('');
    const [snapchat, setSnapchat] = useState('');
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
    
    // Account claim flow state (for claiming existing accounts)
    const [showAccountClaimModal, setShowAccountClaimModal] = useState(false);
    const [accountClaimSent, setAccountClaimSent] = useState(false);
    const [isClaimingAccount, setIsClaimingAccount] = useState(false);
    const [claimError, setClaimError] = useState('');
    
    // Ref for email input focus
    const emailInputRef = useRef(null);

    // Handle error query params from failed account claim redirects
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const claimErrorParam = params.get('error');
        
        if (claimErrorParam) {
            // Map error codes to user-friendly messages
            const errorMessages = {
                'claim_expired': 'Your verification link has expired. Please try again.',
                'claim_invalid': 'Invalid verification link. Please try again.',
                'claim_failed': 'Account linking failed. Please try again.',
                'claim_blocked': 'This account is an organizer account and cannot be linked this way. Please contact support.'
            };
            
            const message = errorMessages[claimErrorParam] || 'An error occurred. Please try again.';
            setError(message);
            
            // Clean up the URL
            window.history.replaceState({}, '', '/post-event-auth');
        }
    }, []);

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
                
                // Pre-populate social links
                const socialLinks = userData.profile?.social_links || {};
                setInstagram(socialLinks.instagram || '');
                setFacebook(socialLinks.facebook || '');
                setPersonalEmail(socialLinks.email || '');
                setPhone(socialLinks.phone || '');
                setWebsite(socialLinks.website || '');
                setTiktok(socialLinks.tiktok || '');
                setSnapchat(socialLinks.snapchat || '');
                
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

    // Handle input for handle-based social platforms (strip all @ symbols)
    const handleInstagramChange = (e) => {
        setInstagram(e.target.value.replace(/@/g, ''));
    };
    const handleFacebookChange = (e) => {
        setFacebook(e.target.value.replace(/@/g, ''));
    };
    const handleTiktokChange = (e) => {
        setTiktok(e.target.value.replace(/@/g, ''));
    };
    const handleSnapchatChange = (e) => {
        setSnapchat(e.target.value.replace(/@/g, ''));
    };

    // Build social_links object for API
    const buildSocialLinks = () => {
        const links = {};
        if (instagram.trim()) links.instagram = instagram.trim();
        if (facebook.trim()) links.facebook = facebook.trim();
        if (personalEmail.trim()) links.email = personalEmail.trim();
        if (phone.trim()) links.phone = phone.trim();
        if (website.trim()) {
            // Auto-prepend https:// if missing protocol
            let url = website.trim();
            if (url && !url.match(/^https?:\/\//i)) {
                url = 'https://' + url;
            }
            links.website = url;
        }
        if (tiktok.trim()) links.tiktok = tiktok.trim();
        if (snapchat.trim()) links.snapchat = snapchat.trim();
        return Object.keys(links).length > 0 ? links : null;
    };

    // Check if at least one social link is provided
    const hasAtLeastOneSocialLink = () => {
        return !!(
            instagram.trim() ||
            facebook.trim() ||
            personalEmail.trim() ||
            phone.trim() ||
            website.trim() ||
            tiktok.trim() ||
            snapchat.trim()
        );
    };

    // Actual submission logic (extracted from handleSubmit)
    const executeSubmit = async () => {
        setIsSubmitting(true);
        setError('');

        try {
            // Build payload - only include email if not already verified
            const payload = {
                name: name || '',
                social_links: buildSocialLinks()
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
                            duration: 4000
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
                    duration: 2000
                });
                await checkAuth();
                setTimeout(() => navigate('/paired-player-history'), 1500);
            }

        } catch (err) {
            console.error('Error updating profile:', err);
            
            // Check if email is already associated with another account
            if (err.message?.toLowerCase().includes('already associated with another account')) {
                // Show account claim modal instead of generic error
                setShowAccountClaimModal(true);
                setError(''); // Clear any previous error
            } else {
                setError(err.message || 'An error occurred. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // Handle sending account claim verification email
    const handleSendClaimEmail = async () => {
        setIsClaimingAccount(true);
        setClaimError('');
        
        try {
            const response = await apiFetch('/auth/claim-existing-account', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: email.trim() })
            });
            
            const data = await response.json();
            
            if (data.success) {
                setShowAccountClaimModal(false);
                setAccountClaimSent(true);
                toast.success('Verification email sent!', {
                    duration: 4000
                });
            } else {
                setClaimError(data.error || 'Failed to send verification email. Please try again.');
            }
        } catch (err) {
            console.error('Error sending claim email:', err);
            setClaimError('Network error. Please try again.');
        } finally {
            setIsClaimingAccount(false);
        }
    };
    
    // Handle closing account claim modal
    const handleClaimModalClose = () => {
        setShowAccountClaimModal(false);
        setClaimError('');
        // Focus email input so they can change it
        setTimeout(() => {
            emailInputRef.current?.focus();
        }, 100);
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
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        // Basic email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            setError('Please enter a valid email address.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        // Validate at least one social link is provided
        if (!hasAtLeastOneSocialLink()) {
            setError('Please provide at least one way to contact you.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
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
                
                <div className="step-form-container" style={{ textAlign: 'center', padding: '40px 28px' }}>
                    <div style={{ 
                        fontSize: '56px', 
                        marginBottom: '24px'
                    }}>
                        📧
                    </div>
                    <h2 style={{ 
                        color: '#1a1a2e', 
                        marginBottom: '12px',
                        fontSize: '1.4rem',
                        fontWeight: '700',
                        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                    }}>
                        Check Your Email!
                    </h2>
                    <p style={{ 
                        color: '#1a1a2e', 
                        marginBottom: '20px',
                        lineHeight: '1.6',
                        fontSize: '0.95rem',
                        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                    }}>
                        We sent a magic link to
                    </p>
                    <div style={{
                        background: '#f9fafb',
                        border: '1.5px solid #e5e7eb',
                        borderRadius: '12px',
                        padding: '14px 18px',
                        marginBottom: '20px',
                        fontWeight: '600',
                        color: '#1a1a2e',
                        wordBreak: 'break-all',
                        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                    }}>
                        {email}
                    </div>
                    <p style={{ 
                        color: '#1a1a2e', 
                        marginBottom: '24px',
                        lineHeight: '1.6',
                        fontSize: '0.95rem',
                        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                    }}>
                        Click the link in your email to access your matches.
                    </p>
                    <p style={{ 
                        color: '#6b7280', 
                        fontSize: '0.85rem',
                        marginBottom: '28px',
                        lineHeight: '1.5',
                        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                    }}>
                        The link expires in 15 minutes.
                        <br />
                        Don't see it? Check your spam folder.
                    </p>
                    <button 
                        onClick={() => setMagicLinkSent(false)}
                        className="primary-button"
                    >
                        ← Back to Form
                    </button>
                </div>
            </div>
        );
    }
    
    // Show "check your email" screen after account claim email is sent
    if (accountClaimSent) {
        return (
            <div className="post-event-auth-container">
                <Toaster position="top-center" />
                
                <div className="step-form-container" style={{ textAlign: 'center', padding: '40px 28px' }}>
                    <div style={{ 
                        fontSize: '56px', 
                        marginBottom: '24px'
                    }}>
                        🔗
                    </div>
                    <h2 style={{ 
                        color: '#1a1a2e', 
                        marginBottom: '12px',
                        fontSize: '1.4rem',
                        fontWeight: '700',
                        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                    }}>
                        Check Your Email!
                    </h2>
                    <p style={{ 
                        color: '#1a1a2e', 
                        marginBottom: '20px',
                        lineHeight: '1.6',
                        fontSize: '0.95rem',
                        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                    }}>
                        We sent a verification link to
                    </p>
                    <div style={{
                        background: '#f9fafb',
                        border: '1.5px solid #e5e7eb',
                        borderRadius: '12px',
                        padding: '14px 18px',
                        marginBottom: '20px',
                        fontWeight: '600',
                        color: '#1a1a2e',
                        wordBreak: 'break-all',
                        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                    }}>
                        {email}
                    </div>
                    <p style={{ 
                        color: '#1a1a2e', 
                        marginBottom: '24px',
                        lineHeight: '1.6',
                        fontSize: '0.95rem',
                        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                    }}>
                        Click the link to link your matches to your existing account.
                    </p>
                    <p style={{ 
                        color: '#6b7280', 
                        fontSize: '0.85rem',
                        marginBottom: '28px',
                        lineHeight: '1.5',
                        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                    }}>
                        The link expires in 24 hours.
                        <br />
                        Don't see it? Check your spam folder.
                    </p>
                    <button 
                        onClick={() => setAccountClaimSent(false)}
                        className="primary-button"
                    >
                        ← Back to Form
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="post-event-auth-container">
            <Toaster position="top-center" toastOptions={{
                style: {
                    background: '#1a1a2e',
                    color: 'white',
                    borderRadius: '12px',
                    padding: '12px 20px',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                },
                success: {
                    iconTheme: {
                        primary: '#10b981',
                        secondary: 'white'
                    }
                },
                error: {
                    iconTheme: {
                        primary: '#ef4444',
                        secondary: 'white'
                    }
                }
            }} />
            
            <button 
                onClick={() => navigate('/')} 
                className="homescreen-button"
            >
                Home
            </button>

            {/* Reuneo Logo */}
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginTop: '8px',
                marginBottom: '0'
            }}>
                <img 
                    src="/assets/reuneo_test_11.png"
                    alt="Reuneo Logo"
                    style={{
                        maxWidth: '100px',
                        height: 'auto',
                        objectFit: 'contain'
                    }}
                />
            </div>

            <h3 className="post-event-auth-header" style={{ marginTop: '12px' }}>
                Access Your Matches
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
                            Email <span style={{ color: '#ef4444' }}>*</span>
                            {isEmailVerified && (
                                <span style={{ 
                                    color: '#10b981', 
                                    fontSize: '0.75rem', 
                                    marginLeft: '8px',
                                    fontWeight: '600',
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    padding: '2px 8px',
                                    borderRadius: '6px'
                                }}>
                                    ✓ Verified
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
                                backgroundColor: '#f3f4f6',
                                color: '#9ca3af',
                                cursor: 'not-allowed',
                                borderColor: '#e5e7eb'
                            } : {}}
                        />
                    </div>

                    {/* Social Links Section */}
                    <div className="social-links-section">
                        <div className="social-links-header">
                            <span className="social-links-title">Share Your Contact Info</span>
                            <span className="social-links-subtitle">(At least one required)</span>
                        </div>
                        
                        {/* Instagram */}
                        <div className="social-link-field">
                            <label className="step-label">Instagram</label>
                            <input
                                type="text"
                                value={instagram}
                                onChange={handleInstagramChange}
                                placeholder="@username"
                                className="step-input"
                            />
                        </div>
                        
                        {/* Facebook */}
                        <div className="social-link-field">
                            <label className="step-label">Facebook</label>
                            <input
                                type="text"
                                value={facebook}
                                onChange={handleFacebookChange}
                                placeholder="@username"
                                className="step-input"
                            />
                        </div>
                        
                        {/* Personal Email */}
                        <div className="social-link-field">
                            <label className="step-label">Personal Email</label>
                            <input
                                type="email"
                                value={personalEmail}
                                onChange={(e) => setPersonalEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="step-input"
                            />
                            <span className="social-link-helper">Separate email for people to reach you</span>
                        </div>
                        
                        {/* Phone */}
                        <div className="social-link-field">
                            <label className="step-label">Phone</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+1 (555) 123-4567"
                                className="step-input"
                            />
                        </div>
                        
                        {/* Website */}
                        <div className="social-link-field">
                            <label className="step-label">Website</label>
                            <input
                                type="text"
                                value={website}
                                onChange={(e) => setWebsite(e.target.value)}
                                placeholder="https://yourwebsite.com"
                                className="step-input"
                            />
                        </div>
                        
                        {/* TikTok */}
                        <div className="social-link-field">
                            <label className="step-label">TikTok</label>
                            <input
                                type="text"
                                value={tiktok}
                                onChange={handleTiktokChange}
                                placeholder="@username"
                                className="step-input"
                            />
                        </div>
                        
                        {/* Snapchat */}
                        <div className="social-link-field">
                            <label className="step-label">Snapchat</label>
                            <input
                                type="text"
                                value={snapchat}
                                onChange={handleSnapchatChange}
                                placeholder="@username"
                                className="step-input"
                            />
                        </div>
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
            
            {/* Account Claim Modal - for claiming existing accounts */}
            {showAccountClaimModal && (
                <div className="email-confirm-modal-overlay">
                    <div className="email-confirm-modal">
                        <div className="email-confirm-modal-icon">🔗</div>
                        <h3 className="email-confirm-modal-title">This email is already registered</h3>
                        <p className="email-confirm-modal-subtitle">
                            To link your matches to your existing account, we'll send a verification email to:
                        </p>
                        <div className="email-confirm-modal-email">{email}</div>
                        
                        {claimError && (
                            <div style={{ 
                                color: '#b91c1c', 
                                fontSize: '0.85rem', 
                                marginBottom: '16px',
                                padding: '10px 14px',
                                backgroundColor: 'rgba(185, 28, 28, 0.08)',
                                borderRadius: '10px',
                                fontWeight: '500',
                                textAlign: 'left',
                                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                            }}>
                                {claimError}
                            </div>
                        )}
                        
                        <div className="email-confirm-modal-buttons">
                            <button 
                                className="email-confirm-btn email-confirm-btn-yes"
                                onClick={handleSendClaimEmail}
                                disabled={isClaimingAccount}
                            >
                                {isClaimingAccount ? 'Sending...' : 'Send Verification Email'}
                            </button>
                            <button 
                                className="email-confirm-btn email-confirm-btn-no"
                                onClick={handleClaimModalClose}
                                disabled={isClaimingAccount}
                            >
                                Use Different Email
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PostEventAuth;
