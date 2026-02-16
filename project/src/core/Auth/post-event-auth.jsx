import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { FaInstagram, FaFacebookF, FaLinkedinIn, FaEnvelope, FaPhone, FaGlobe, FaTiktok, FaSnapchatGhost } from 'react-icons/fa';
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

// Social platform config — drives both the scroll selector and the input fields
// Order: phone, email, website, instagram, facebook, tiktok, snapchat
const SOCIAL_PLATFORMS = [
    { key: 'phone',     label: 'Phone',     Icon: FaPhone,          color: '#25D366', placeholder: '+1 (555) 123-4567', type: 'tel',   stripAt: false },
    { key: 'email',     label: 'Email',     Icon: FaEnvelope,       color: '#4b7ef0', placeholder: 'you@example.com',   type: 'email', stripAt: false },
    { key: 'website',   label: 'Website',   Icon: FaGlobe,          color: '#4b7ef0', placeholder: 'https://yourwebsite.com', type: 'text', stripAt: false },
    { key: 'instagram', label: 'Instagram', Icon: FaInstagram,      color: '#E4405F', placeholder: '@username',          type: 'text',  stripAt: true },
    { key: 'facebook',  label: 'Facebook',  Icon: FaFacebookF,      color: '#1877F2', placeholder: '@username',          type: 'text',  stripAt: true },
    { key: 'linkedin',  label: 'LinkedIn',  Icon: FaLinkedinIn,     color: '#0A66C2', placeholder: 'john-smith',              type: 'text',  stripAt: false },
    { key: 'tiktok',    label: 'TikTok',    Icon: FaTiktok,         color: '#000000', placeholder: '@username',          type: 'text',  stripAt: true },
    { key: 'snapchat',  label: 'Snapchat',  Icon: FaSnapchatGhost,  color: '#F7D600', placeholder: '@username',          type: 'text',  stripAt: true },
];

// Infinite-loop scroll selector for choosing which social platforms to share
const SocialPlatformSelector = ({ platforms, selectedPlatforms, onToggle }) => {
    const listRef = useRef(null);
    const isSnapping = useRef(false);

    // After first paint, jump to the middle copy so the user can scroll in both directions
    useEffect(() => {
        const el = listRef.current;
        if (!el) return;
        const raf = requestAnimationFrame(() => {
            const setHeight = el.scrollHeight / 3;
            el.scrollTop = setHeight;
        });
        return () => cancelAnimationFrame(raf);
    }, []);

    // Infinite-loop snap: keep the viewport within the middle copy
    const handleScroll = useCallback(() => {
        const el = listRef.current;
        if (!el || isSnapping.current) return;

        const setHeight = el.scrollHeight / 3;
        const scrollTop = el.scrollTop;

        if (scrollTop < setHeight) {
            isSnapping.current = true;
            el.scrollTop = scrollTop + setHeight;
            requestAnimationFrame(() => { isSnapping.current = false; });
        } else if (scrollTop >= setHeight * 2) {
            isSnapping.current = true;
            el.scrollTop = scrollTop - setHeight;
            requestAnimationFrame(() => { isSnapping.current = false; });
        }
    }, []);

    // Render three identical copies: [clone A] [original B] [clone C]
    const tripleItems = [...platforms, ...platforms, ...platforms];

    return (
        <div className="social-selector-container">
            <div
                ref={listRef}
                className="social-selector-list"
                onScroll={handleScroll}
            >
                {tripleItems.map((platform, index) => {
                    const isSelected = selectedPlatforms.has(platform.key);
                    const { Icon, color, label } = platform;

                    return (
                        <div key={`${platform.key}-${index}`} className="social-selector-item-wrapper">
                            <label
                                className={`social-selector-item ${isSelected ? 'selected' : ''}`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    onToggle(platform.key);
                                }}
                            >
                                <div className={`social-selector-checkbox ${isSelected ? 'checked' : ''}`}>
                                    {isSelected && (
                                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                            <path d="M11.5 3.5L5.5 10L2.5 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    )}
                                </div>
                                <span className="social-selector-label">{label}</span>
                                <span className="social-selector-icon">
                                    <Icon size={20} color={color} />
                                </span>
                            </label>
                        </div>
                    );
                })}
            </div>
            <div className="social-selector-top-gradient"></div>
            <div className="social-selector-bottom-gradient"></div>
        </div>
    );
};

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
    const [linkedin, setLinkedin] = useState('');
    const [tiktok, setTiktok] = useState('');
    const [snapchat, setSnapchat] = useState('');
    const [selectedPlatforms, setSelectedPlatforms] = useState(new Set());
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
                setLinkedin(socialLinks.linkedin || '');
                setTiktok(socialLinks.tiktok || '');
                setSnapchat(socialLinks.snapchat || '');
                
                // Pre-select platforms that have saved values
                const initialSelected = new Set();
                if (socialLinks.phone) initialSelected.add('phone');
                if (socialLinks.email) initialSelected.add('email');
                if (socialLinks.website) initialSelected.add('website');
                if (socialLinks.instagram) initialSelected.add('instagram');
                if (socialLinks.facebook) initialSelected.add('facebook');
                if (socialLinks.linkedin) initialSelected.add('linkedin');
                if (socialLinks.tiktok) initialSelected.add('tiktok');
                if (socialLinks.snapchat) initialSelected.add('snapchat');
                setSelectedPlatforms(initialSelected);
                
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

    // Auto-redirect after magic link is sent: show spinner for 4s then go to matches
    useEffect(() => {
        if (!magicLinkSent) return;

        const timer = setTimeout(async () => {
            try {
                await checkAuth();
            } catch (err) {
                console.error('checkAuth failed during redirect:', err);
            }
            navigate('/paired-player-history');
        }, 4000);

        return () => clearTimeout(timer);
    }, [magicLinkSent, checkAuth, navigate]);

    // Handle email input focus - show warning toast once
    const handleEmailFocus = () => {
        if (!isEmailVerified && !hasShownEmailToast) {
            setHasShownEmailToast(true);
            setShowEmailWarningToast(true);
        }
    };

    // Social field value and setter maps for generic handling
    const socialFieldValues = {
        phone, email: personalEmail, website, instagram, facebook, linkedin, tiktok, snapchat
    };
    const socialFieldSetters = {
        phone: setPhone, email: setPersonalEmail, website: setWebsite,
        instagram: setInstagram, facebook: setFacebook, linkedin: setLinkedin, tiktok: setTiktok, snapchat: setSnapchat
    };

    // Generic handler for social link field changes (strips @ for handle-based platforms)
    const handleSocialFieldChange = (key, value) => {
        const platform = SOCIAL_PLATFORMS.find(p => p.key === key);
        const cleanedValue = platform?.stripAt ? value.replace(/@/g, '') : value;
        socialFieldSetters[key](cleanedValue);
    };

    // Toggle platform selection in the scroll selector
    const handlePlatformToggle = (key) => {
        setSelectedPlatforms(prev => {
            const newSet = new Set(prev);
            if (newSet.has(key)) {
                newSet.delete(key);
            } else {
                newSet.add(key);
            }
            return newSet;
        });
    };

    // Build social_links object for API (only includes selected platforms with values)
    const buildSocialLinks = () => {
        const links = {};
        if (selectedPlatforms.has('phone') && phone.trim()) links.phone = phone.trim();
        if (selectedPlatforms.has('email') && personalEmail.trim()) links.email = personalEmail.trim();
        if (selectedPlatforms.has('website') && website.trim()) {
            // Auto-prepend https:// if missing protocol
            let url = website.trim();
            if (url && !url.match(/^https?:\/\//i)) {
                url = 'https://' + url;
            }
            links.website = url;
        }
        if (selectedPlatforms.has('instagram') && instagram.trim()) links.instagram = instagram.trim();
        if (selectedPlatforms.has('facebook') && facebook.trim()) links.facebook = facebook.trim();
        if (selectedPlatforms.has('linkedin') && linkedin.trim()) {
            let handle = linkedin.trim();
            // Extract handle from full URL if user pasted one (e.g. linkedin.com/in/john-smith)
            const linkedinMatch = handle.match(/linkedin\.com\/in\/([^/?#]+)/i);
            if (linkedinMatch) {
                handle = linkedinMatch[1];
            }
            handle = handle.replace(/^\/+|\/+$/g, '');
            links.linkedin = handle;
        }
        if (selectedPlatforms.has('tiktok') && tiktok.trim()) links.tiktok = tiktok.trim();
        if (selectedPlatforms.has('snapchat') && snapchat.trim()) links.snapchat = snapchat.trim();
        return Object.keys(links).length > 0 ? links : null;
    };

    // Check if at least one social link is selected and has a value
    const hasAtLeastOneSocialLink = () => {
        return SOCIAL_PLATFORMS.some(p =>
            selectedPlatforms.has(p.key) && socialFieldValues[p.key]?.trim()
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
                        marginBottom: '28px',
                        fontWeight: '600',
                        color: '#1a1a2e',
                        wordBreak: 'break-all',
                        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                    }}>
                        {email}
                    </div>
                    <LoadingSpinner size={40} />
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
                            <span className="social-links-title">Choose your preferred info to share</span>
                            <span className="social-links-subtitle">Don't worry, only people who you choose to share with can see it</span>
                        </div>
                        
                        {/* Platform Selector — Infinite Scroll */}
                        <SocialPlatformSelector
                            platforms={SOCIAL_PLATFORMS}
                            selectedPlatforms={selectedPlatforms}
                            onToggle={handlePlatformToggle}
                        />
                        
                        {/* Conditional Fields — only show selected platforms */}
                        <AnimatePresence initial={false}>
                            {SOCIAL_PLATFORMS.filter(p => selectedPlatforms.has(p.key)).map(platform => (
                                <motion.div
                                    key={platform.key}
                                    className="social-link-field"
                                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                    animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                                    style={{ overflow: 'hidden' }}
                                >
                                    <label className="step-label">{platform.label}</label>
                                    <input
                                        type={platform.type}
                                        value={socialFieldValues[platform.key]}
                                        onChange={(e) => handleSocialFieldChange(platform.key, e.target.value)}
                                        placeholder={platform.placeholder}
                                        className="step-input"
                                    />
                                    {platform.key === 'email' && (
                                        <span className="social-link-helper">Separate email for people to reach you</span>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
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
