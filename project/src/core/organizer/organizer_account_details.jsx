import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../Auth/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import './organizer_account_details.css';
import { apiFetch } from '../utils/api';

const PLAN_TYPE_LABELS = {
    single_use: 'Single Use',
    monthly: 'Monthly',
    free_trial: 'Free Trial',
};

const OrganizerAccountDetails = () => {
    const { user, permissions } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [planDetails, setPlanDetails] = useState(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(true);
    const [isCanceling, setIsCanceling] = useState(false);
    const [error, setError] = useState('');
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [limitMessage, setLimitMessage] = useState(null);

    useEffect(() => {
        if (permissions !== null) {
            if (permissions !== 'admin' && permissions !== 'organizer') {
                navigate('/new_organizer');
            }
        }
    }, [permissions, navigate]);

    useEffect(() => {
        if (location.state?.limitMessage) {
            setLimitMessage(location.state.limitMessage);
            window.history.replaceState({}, '');
        }
    }, [location.state]);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const response = await apiFetch('/organizer-plan-details');
                const data = await response.json();

                if (!response.ok || data.error) {
                    setError(data.error || 'Failed to load plan details');
                    setIsLoadingDetails(false);
                    return;
                }

                if (data.has_plan === false) {
                    navigate('/new_organizer');
                    return;
                }

                setPlanDetails(data);
            } catch (err) {
                console.error('Error fetching plan details:', err);
                setError('Failed to load account details. Please try again.');
            } finally {
                setIsLoadingDetails(false);
            }
        };

        if (user) fetchDetails();
    }, [user, navigate]);

    useEffect(() => {
        if (showCancelModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [showCancelModal]);

    const formatDate = (timestamp) => {
        if (!timestamp) return null;
        return new Date(timestamp * 1000).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const handleCancelSubscription = async () => {
        setIsCanceling(true);
        setError('');

        try {
            const response = await apiFetch('/cancel-subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await response.json();

            if (!response.ok || data.error) {
                setError(data.error || 'Failed to cancel subscription');
                setIsCanceling(false);
                setShowCancelModal(false);
                return;
            }

            setShowToast(true);
            setShowCancelModal(false);
            setTimeout(() => navigate('/'), 1500);
        } catch (err) {
            console.error('Error canceling subscription:', err);
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

    if (!planDetails) {
        return (
            <div className="signup-container">
                <button onClick={() => navigate('/')} className="homescreen-button">Home</button>
                <div className="error-message">{error || 'No account details found'}</div>
            </div>
        );
    }

    const planType = planDetails.plan_type;
    const isMonthly = planType === 'monthly';

    return (
        <div className="signup-container">
            <button onClick={() => navigate('/')} className="homescreen-button">Home</button>

            <img
                src="/assets/reuneo_test_8.png"
                alt="Reuneo Logo"
                className="logo-image"
            />

            <h3 className="signup-header">Account Details</h3>

            {limitMessage && (
                <div className="oad-limit-banner">
                    <span>{limitMessage}</span>
                    <button onClick={() => setLimitMessage(null)} className="oad-limit-banner-close" aria-label="Dismiss">&times;</button>
                </div>
            )}

            <div className="step-form-container">
                <div className="account-details-content">
                    {error && (
                        <div className="error-message" style={{ marginBottom: '20px' }}>
                            {error}
                        </div>
                    )}

                    {/* Plan type */}
                    <div className="detail-row">
                        <span className="detail-label">Plan:</span>
                        <span className={`detail-value plan-badge plan-badge-${planType}`}>
                            {PLAN_TYPE_LABELS[planType] || planType}
                        </span>
                    </div>

                    {/* Status */}
                    {planDetails.subscription_status && (
                        <div className="detail-row">
                            <span className="detail-label">Status:</span>
                            <span className={`detail-value status-${planDetails.subscription_status}`}>
                                {planDetails.subscription_status}
                            </span>
                        </div>
                    )}

                    {/* Email */}
                    {planDetails.email && (
                        <div className="detail-row">
                            <span className="detail-label">Email:</span>
                            <span className="detail-value">{planDetails.email}</span>
                        </div>
                    )}

                    {/* Attendee limit */}
                    {planDetails.attendee_limit != null && (
                        <div className="detail-row">
                            <span className="detail-label">Attendee Limit:</span>
                            <span className="detail-value">{planDetails.attendee_limit}</span>
                        </div>
                    )}

                    {/* Single use: activations */}
                    {planType === 'single_use' && (
                        <>
                            <div className="detail-row">
                                <span className="detail-label">Activations Purchased:</span>
                                <span className="detail-value">{planDetails.activations_purchased}</span>
                            </div>
                            <div className="detail-row">
                                <span className="detail-label">Activations Remaining:</span>
                                <span className="detail-value">{planDetails.activations_remaining}</span>
                            </div>
                        </>
                    )}

                    {/* Free trial: activations */}
                    {planType === 'free_trial' && (
                        <div className="detail-row">
                            <span className="detail-label">Activations Remaining:</span>
                            <span className="detail-value">{planDetails.activations_remaining}</span>
                        </div>
                    )}

                    {/* Monthly: usage + billing */}
                    {isMonthly && (
                        <>
                            <div className="detail-row">
                                <span className="detail-label">Uses This Month:</span>
                                <span className="detail-value">
                                    {planDetails.uses_this_month} / {planDetails.uses_per_month}
                                </span>
                            </div>

                            {planDetails.billing_period && (
                                <div className="detail-row">
                                    <span className="detail-label">Billing Period:</span>
                                    <span className="detail-value">{planDetails.billing_period}</span>
                                </div>
                            )}

                            {planDetails.amount != null && (
                                <div className="detail-row">
                                    <span className="detail-label">Amount:</span>
                                    <span className="detail-value">
                                        ${planDetails.amount} {planDetails.currency || ''}
                                    </span>
                                </div>
                            )}

                            {planDetails.current_period_end && formatDate(planDetails.current_period_end) && (
                                <div className="detail-row">
                                    <span className="detail-label">Next Billing Date:</span>
                                    <span className="detail-value">
                                        {formatDate(planDetails.current_period_end)}
                                    </span>
                                </div>
                            )}

                            {planDetails.cancel_at_period_end && (
                                <div className="detail-row">
                                    <span className="detail-label">Cancellation:</span>
                                    <span className="detail-value">Will cancel at period end</span>
                                </div>
                            )}
                        </>
                    )}

                    {/* Action buttons */}
                    <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {planDetails.subscription_status === 'active' || planDetails.subscription_status === 'trialing' ? (
                            <button
                                onClick={() => navigate('/plan-selection', {
                                    state: { isUpgrade: true, currentPlan: planDetails },
                                })}
                                className="primary-button"
                            >
                                Change Plan
                            </button>
                        ) : (
                            <button
                                onClick={() => navigate('/new_organizer')}
                                className="primary-button"
                            >
                                Purchase a New Plan
                            </button>
                        )}

                        {isMonthly && planDetails.subscription_status === 'active' && (
                            <button
                                onClick={() => setShowCancelModal(true)}
                                className="primary-button cancel-button"
                            >
                                Cancel Subscription
                            </button>
                        )}
                    </div>
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
                                Keep Plan
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
