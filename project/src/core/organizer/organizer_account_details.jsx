import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../Auth/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import './organizer_account_details.css';
import { apiFetch } from '../utils/api';
import PageNavBar from '../components/PageNavBar/PageNavBar';

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

                console.log('Plan details from API:', data);
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
            <div className="account-container">
                <div className="account-loading">Loading account details...</div>
            </div>
        );
    }

    if (!planDetails) {
        return (
            <div className="account-container">
                <button onClick={() => navigate('/')} className="account-home-button">Home</button>
                <div className="account-error-message">{error || 'No account details found'}</div>
            </div>
        );
    }

    const planType = planDetails.plan_type;
    const isMonthly = planType === 'monthly';
    const usagePercent = isMonthly && planDetails.uses_per_month 
        ? Math.min((planDetails.uses_this_month / planDetails.uses_per_month) * 100, 100) 
        : 0;

    return (
        <div className="account-container">
            <PageNavBar />
            <button onClick={() => navigate('/')} className="account-home-button">Home</button>

            <img
                src="/assets/reuneo_test_11.png"
                alt="Reuneo Logo"
                className="account-logo"
            />

            <h1 className="account-header">Account Details</h1>

            {limitMessage && (
                <div className="account-limit-banner">
                    <span>{limitMessage}</span>
                    <button onClick={() => setLimitMessage(null)} className="account-limit-banner-close" aria-label="Dismiss">&times;</button>
                </div>
            )}

            <div className="account-form-container">
                <div className="account-details-content">
                    
                    {/* Plan Header with Status */}
                    <div className="account-plan-header">
                        <div className="account-plan-type">Your Plan</div>
                        <div className="account-plan-name">
                            {PLAN_TYPE_LABELS[planType] || planType}
                        </div>
                        {planDetails.subscription_status && (
                            <div className="account-plan-status">
                                <div className={`account-plan-status-dot ${planDetails.subscription_status !== 'active' ? 'status-' + planDetails.subscription_status : ''}`} 
                                     style={planDetails.subscription_status !== 'active' ? { background: planDetails.subscription_status === 'trialing' ? '#3b82f6' : planDetails.subscription_status === 'past_due' ? '#f59e0b' : '#ef4444', boxShadow: 'none' } : {}}
                                />
                                <span className="account-plan-status-text">
                                    {planDetails.subscription_status.charAt(0).toUpperCase() + planDetails.subscription_status.slice(1)}
                                </span>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="account-error-message">
                            {error}
                        </div>
                    )}

                    {/* Basic Details */}
                    <div className="account-details-section">
                        {planDetails.email && (
                            <div className="detail-row">
                                <span className="detail-label">Email</span>
                                <span className="detail-value">{planDetails.email}</span>
                            </div>
                        )}

                        {planDetails.attendee_limit != null && (
                            <div className="detail-row">
                                <span className="detail-label">Attendee Limit</span>
                                <span className="detail-value">{planDetails.attendee_limit} per event</span>
                            </div>
                        )}
                    </div>

                    {/* Monthly: Usage Card */}
                    {isMonthly && (
                        <div className="account-usage-section">
                            <div className="account-usage-card">
                                <div className="account-usage-label">Monthly Usage</div>
                                <div className="account-usage-bar-container">
                                    <div 
                                        className="account-usage-bar" 
                                        style={{ width: `${usagePercent}%` }}
                                    />
                                </div>
                                <div className="account-usage-text">
                                    {planDetails.uses_this_month} of {planDetails.uses_per_month} events used
                                </div>
                                {planDetails.current_period_end && formatDate(planDetails.current_period_end) && (
                                    <div className="account-usage-reset">
                                        Resets {formatDate(planDetails.current_period_end)}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Free Trial: Trial Uses Card */}
                    {planType === 'free_trial' && (
                        <div className="account-activations-card">
                            <div className="account-activations-label">Trial Activations</div>
                            <div className="account-activations-value">{planDetails.trial_uses_remaining ?? 0}</div>
                            <div className="account-activations-subtext">
                                of 3 per month
                            </div>
                            <div className="account-usage-reset">
                                Resets monthly
                            </div>
                        </div>
                    )}

                    {/* Single Use: Activations Card */}
                    {planType === 'single_use' && (
                        <div className="account-activations-card">
                            <div className="account-activations-label">Activations Remaining</div>
                            <div className="account-activations-value">{planDetails.activations_remaining}</div>
                            {planDetails.activations_purchased && (
                                <div className="account-activations-subtext">
                                    of {planDetails.activations_purchased} purchased
                                </div>
                            )}
                        </div>
                    )}

                    {/* Monthly: Billing Info */}
                    {isMonthly && (planDetails.amount != null || planDetails.current_period_end) && (
                        <div className="account-billing-card">
                            {planDetails.current_period_end && formatDate(planDetails.current_period_end) && (
                                <div className="account-billing-row">
                                    <span className="account-billing-label">Next billing & reset</span>
                                    <span className="account-billing-value">
                                        {formatDate(planDetails.current_period_end)}
                                    </span>
                                </div>
                            )}
                            {planDetails.amount != null && (
                                <div className="account-billing-row">
                                    <span className="account-billing-label">Amount</span>
                                    <span className="account-billing-value account-billing-amount">
                                        ${planDetails.amount}/{planDetails.billing_period || 'month'}
                                    </span>
                                </div>
                            )}
                            {planDetails.cancel_at_period_end && (
                                <div className="account-billing-row">
                                    <span className="account-billing-label">Status</span>
                                    <span className="account-billing-value" style={{ color: '#f59e0b' }}>
                                        Cancels at period end
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="account-button-group">
                        {planDetails.subscription_status === 'active' || planDetails.subscription_status === 'trialing' ? (
                            <button
                                onClick={() => navigate('/plan-selection', {
                                    state: { isUpgrade: true, currentPlan: planDetails },
                                })}
                                className="account-primary-button"
                            >
                                Change Plan
                            </button>
                        ) : (
                            <button
                                onClick={() => navigate('/new_organizer')}
                                className="account-primary-button"
                            >
                                Purchase a New Plan
                            </button>
                        )}

                        {isMonthly && planDetails.subscription_status === 'active' && !planDetails.cancel_at_period_end && (
                            <button
                                onClick={() => setShowCancelModal(true)}
                                className="account-primary-button account-cancel-button"
                            >
                                Cancel Subscription
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {showCancelModal && (
                <div className="account-modal-overlay" onClick={(e) => e.stopPropagation()}>
                    <div className="account-modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Cancel Subscription</h3>
                        <p>Are you sure you want to cancel? You'll still have access until the end of your current billing period.</p>
                        <div className="account-modal-buttons">
                            <button
                                className="account-modal-button account-modal-confirm"
                                onClick={handleCancelSubscription}
                                disabled={isCanceling}
                            >
                                {isCanceling ? 'Processing...' : 'Yes, Cancel'}
                            </button>
                            <button
                                className="account-modal-button account-modal-keep"
                                onClick={() => setShowCancelModal(false)}
                                disabled={isCanceling}
                            >
                                Keep Plan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showToast && (
                <div className="account-toast-container">
                    <div className="account-toast-message">
                        Subscription canceled successfully
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrganizerAccountDetails;
