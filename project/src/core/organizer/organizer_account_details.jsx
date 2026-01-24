import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../Auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import './organizer_account_details.css';
import { apiFetch } from '../utils/api';

const OrganizerAccountDetails = () => {
    const { user, checkAuth, permissions } = useContext(AuthContext);
    const navigate = useNavigate();
    const [accountDetails, setAccountDetails] = useState(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(true);
    const [isCanceling, setIsCanceling] = useState(false);
    const [error, setError] = useState('');
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showToast, setShowToast] = useState(false);

    // Check permissions on mount
    useEffect(() => {
        if (permissions !== null) {
            if (permissions !== 'admin' && permissions !== 'organizer') {
                // User doesn't have organizer access - redirect to signup
                navigate('/organizer-signup');
            }
        }
    }, [permissions, navigate]);

    // Fetch account details on mount
    useEffect(() => {
        const fetchAccountDetails = async () => {
            try {
                const response = await apiFetch('/organizer-account-details');

                const data = await response.json();

                // Handle errors gracefully
                if (!response.ok || data.error) {
                    // If user is admin/organizer and has subscription, show partial data
                    if ((permissions === 'admin' || permissions === 'organizer') && 
                        data.has_subscription !== false) {
                        // Show error as warning but continue with partial data
                        setError(data.error || 'Some subscription details may be incomplete');
                        setAccountDetails(data); // Show what we have
                        setIsLoadingDetails(false);
                        return;
                    }
                    // Only redirect if explicitly no subscription
                    if (data.has_subscription === false) {
                        navigate('/organizer-signup');
                        return;
                    }
                    // For other errors, show error but try to show data if available
                    setError(data.error || 'Failed to load account details');
                    if (data.has_subscription !== false) {
                        setAccountDetails(data); // Show partial data even with error
                    }
                    setIsLoadingDetails(false);
                    return;
                }

                // Explicitly check for no subscription
                if (data.has_subscription === false) {
                    navigate('/organizer-signup');
                    return;
                }

                setAccountDetails(data);
            } catch (error) {
                console.error('Error fetching account details:', error);
                setError('Failed to load account details. Please try again.');
                // If user is admin/organizer, don't redirect on network errors
                if (permissions !== 'admin' && permissions !== 'organizer') {
                    // Only redirect non-admin users on network errors
                }
            } finally {
                setIsLoadingDetails(false);
            }
        };

        if (user) {
            fetchAccountDetails();
        }
    }, [user, permissions, navigate]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (showCancelModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [showCancelModal]);

    const formatDate = (timestamp) => {
        if (!timestamp) return null;
        return new Date(timestamp * 1000).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    const handleCancelSubscription = async () => {
        setIsCanceling(true);
        setError('');

        try {
            const response = await apiFetch('/cancel-subscription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (!response.ok || data.error) {
                setError(data.error || 'Failed to cancel subscription');
                setIsCanceling(false);
                setShowCancelModal(false);
                return;
            }

            // Show toast notification
            setShowToast(true);
            setShowCancelModal(false);

            // Redirect to home after 1.5 seconds
            setTimeout(() => {
                navigate('/');
            }, 1500);
        } catch (error) {
            console.error('Error canceling subscription:', error);
            setError('An error occurred. Please try again.');
            setIsCanceling(false);
            setShowCancelModal(false);
        }
    };

    if (isLoadingDetails) {
        return (
            <div className="signup-container">
                <div className="loading-message">Loading account details...</div>
            </div>
        );
    }

    if (!accountDetails && !isLoadingDetails) {
        return (
            <div className="signup-container">
                <button 
                    onClick={() => navigate('/')} 
                    className="homescreen-button"
                >
                    Home
                </button>
                <div className="error-message">{error || 'No account details found'}</div>
            </div>
        );
    }

    // If no account details but we're not loading, show error
    if (!accountDetails) {
        return null; // Still loading or will show error above
    }

    return (
        <div className="signup-container">
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

            <h3 className="signup-header">
                Organizer Account Details
            </h3>

            <div className="step-form-container">
                <div className="account-details-content">
                    {/* Show error message at top if present */}
                    {error && (
                        <div className="error-message" style={{ marginBottom: '20px' }}>
                            {error}
                        </div>
                    )}

                    {accountDetails.subscription_status && (
                        <div className="detail-row">
                            <span className="detail-label">Subscription Status:</span>
                            <span className={`detail-value status-${accountDetails.subscription_status}`}>
                                {accountDetails.subscription_status}
                            </span>
                        </div>
                    )}

                    {accountDetails.email && (
                        <div className="detail-row">
                            <span className="detail-label">Email:</span>
                            <span className="detail-value">{accountDetails.email}</span>
                        </div>
                    )}

                    {accountDetails.billing_period && (
                        <div className="detail-row">
                            <span className="detail-label">Billing Period:</span>
                            <span className="detail-value">{accountDetails.billing_period}</span>
                        </div>
                    )}

                    {(accountDetails.amount !== null && accountDetails.amount !== undefined) && (
                        <div className="detail-row">
                            <span className="detail-label">Amount:</span>
                            <span className="detail-value">
                                ${accountDetails.amount} {accountDetails.currency || ''}
                            </span>
                        </div>
                    )}

                    {accountDetails.current_period_start && formatDate(accountDetails.current_period_start) && (
                        <div className="detail-row">
                            <span className="detail-label">Current Period Start:</span>
                            <span className="detail-value">
                                {formatDate(accountDetails.current_period_start)}
                            </span>
                        </div>
                    )}

                    {accountDetails.current_period_end && formatDate(accountDetails.current_period_end) && (
                        <div className="detail-row">
                            <span className="detail-label">Current Period End:</span>
                            <span className="detail-value">
                                {formatDate(accountDetails.current_period_end)}
                            </span>
                        </div>
                    )}

                    {accountDetails.cancel_at_period_end && (
                        <div className="detail-row">
                            <span className="detail-label">Cancellation:</span>
                            <span className="detail-value">Will cancel at period end</span>
                        </div>
                    )}

                    <button 
                        onClick={() => setShowCancelModal(true)}
                        className="primary-button cancel-button"
                        style={{ marginTop: '30px' }}
                    >
                        Cancel Subscription
                    </button>
                </div>
            </div>

            {/* Cancel Confirmation Modal */}
            {showCancelModal && (
                <div className="modal-overlay" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Cancel Subscription</h3>
                        <p>Are you sure you want to cancel your subscription?</p>
                        <div className="modal-buttons">
                            <button
                                className="modal-button modal-cancel"
                                onClick={() => setShowCancelModal(false)}
                                disabled={isCanceling}
                            >
                                Cancel
                            </button>
                            <button
                                className="modal-button modal-confirm"
                                onClick={handleCancelSubscription}
                                disabled={isCanceling}
                            >
                                {isCanceling ? 'Processing...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {showToast && (
                <div className="toast-container">
                    <div className="toast-message">
                        Subscription canceled successfully
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrganizerAccountDetails;
