import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../Auth/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import './organizer_account_details.css';
import { apiFetch } from '../utils/api';
import FloatingLinesBackground from './FloatingLinesBackground';

const PLAN_TYPE_LABELS = {
    single_use: 'Single Use',
    monthly: 'Monthly',
    free_trial: 'Free Trial',
};

const PLAN_NAMES = { 50: 'Basic', 100: 'Plus', 150: 'Pro', 200: 'Ultra' };

const getNextTier = (planDetails, tiers) => {
    if (!planDetails || !tiers.length) return null;
    const status = planDetails.subscription_status;
    if (status !== 'active' && status !== 'trialing') return null;
    if (planDetails.plan_type === 'free_trial') return tiers[0];
    if (planDetails.plan_type === 'monthly') {
        return tiers.find(t => t.lower > planDetails.attendee_limit) ?? null;
    }
    return null;
};

const OrganizerAccountDetails = () => {
    const { user, permissions } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [planDetails, setPlanDetails] = useState(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(true);
    const [isCanceling, setIsCanceling] = useState(false);
    const [error, setError] = useState('');
    const [tiers, setTiers] = useState([]);
    const [isTileCheckingOut, setIsTileCheckingOut] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [limitMessage, setLimitMessage] = useState(null);
    // Live-lobby upgrade context forwarded from admin_lobby_view so that a
    // subsequent "Change Plan" -> /plan-selection click can carry lobbyCode
    // through the upgrade flow. Stashed in state because the limitMessage
    // effect below wipes location.state.
    const [lobbyContext, setLobbyContext] = useState({
        lobbyCode: '',
        fromActiveLobby: false,
        lobbyState: null,
    });

    useEffect(() => {
        if (permissions !== null) {
            if (permissions !== 'admin' && permissions !== 'organizer') {
                navigate('/new_organizer');
            }
        }
    }, [permissions, navigate]);

    useEffect(() => {
        if (location.state?.lobbyCode || location.state?.fromActiveLobby) {
            setLobbyContext({
                lobbyCode: location.state.lobbyCode || '',
                fromActiveLobby: !!location.state.fromActiveLobby,
                lobbyState: location.state.lobbyState || null,
            });
        }
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

    // Fetch pricing tiers independently (public endpoint, no user dependency)
    useEffect(() => {
        (async () => {
            try {
                const res = await apiFetch('/pricing/tiers');
                if (!res.ok) return;
                const data = await res.json();
                setTiers(data.tiers || []);
            } catch {}
        })();
    }, []);

    const handleTileUpgrade = async (tier) => {
        setIsTileCheckingOut(true);
        setError('');
        try {
            const body = {
                plan_type: 'monthly',
                attendees: tier.upper,
                quantity: 1,
            };
            if (lobbyContext.fromActiveLobby && lobbyContext.lobbyCode) {
                body.lobby_code = lobbyContext.lobbyCode;
            }
            const res = await apiFetch('/upgrade-plan-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (data.checkout_url) {
                window.location.href = data.checkout_url;
                return;
            }
            setError(data.message || data.error || 'Checkout failed. Please try again.');
        } catch {
            setError('Something went wrong. Please check your connection and try again.');
        } finally {
            setIsTileCheckingOut(false);
        }
    };

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
    const nextTier = getNextTier(planDetails, tiers);

    return (
        <div className="account-container">
            <FloatingLinesBackground />
            <div className="account-nav-row">
                <button onClick={() => navigate('/')} className="account-home-button">Home</button>
                <img
                    src="/assets/reuneo_test_14.png"
                    alt="Reuneo Logo"
                    className="account-logo"
                />
                {lobbyContext.fromActiveLobby ? (
                    <button
                        onClick={() => navigate(`/admin_lobby_view?code=${lobbyContext.lobbyCode}`)}
                        className="account-return-lobby-button"
                    >
                        Your Lobby
                    </button>
                ) : (
                    <div className="account-nav-placeholder" />
                )}
            </div>

            <h1 className="account-header">Account Details</h1>

            {limitMessage && (
                <div className="account-limit-banner">
                    <span>{limitMessage}</span>
                    <button onClick={() => setLimitMessage(null)} className="account-limit-banner-close" aria-label="Dismiss">&times;</button>
                </div>
            )}

            <div className="account-form-container">
                <div className="account-details-content">

                    {/* Upgrade tile: mobile position (above plan header) */}
                    {nextTier && (
                        <div className="account-tile-slot account-tile-slot--mobile">
                            <div className="account-next-plan-tile">
                                <div className="account-next-plan-badge">Next Step</div>
                                <div className="account-next-plan-name">
                                    {PLAN_NAMES[nextTier.upper] ?? `Up to ${nextTier.upper}`}
                                </div>
                                <div className="account-next-plan-meta">
                                    Up to {nextTier.upper} attendees &nbsp;·&nbsp; <strong>${nextTier.monthly_price}/mo</strong>
                                </div>
                                <button
                                    className="account-next-plan-cta"
                                    onClick={() => handleTileUpgrade(nextTier)}
                                    disabled={isTileCheckingOut}
                                >
                                    {isTileCheckingOut ? 'Processing...' : 'Upgrade →'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Plan Header — full-width hero */}
                    <div className="account-plan-header">
                        <div className="account-plan-header-inner">
                            <div>
                                <div className="account-plan-type">Your Plan</div>
                                <div className="account-plan-name">
                                    {PLAN_TYPE_LABELS[planType] || planType}
                                </div>
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
                    </div>

                    {error && (
                        <div className="account-error-message">{error}</div>
                    )}

                    {/* Body Grid — single column mobile, two columns desktop */}
                    <div className="account-body-grid">

                        {/* Left column: details + usage + billing */}
                        <div className="account-col-left">
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

                            {isMonthly && (
                                <div className="account-usage-section">
                                    <div className="account-usage-card">
                                        <div className="account-usage-label">Monthly Usage</div>
                                        <div className="account-usage-bar-container">
                                            <div className="account-usage-bar" style={{ width: `${usagePercent}%` }} />
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

                            {planType === 'free_trial' && (
                                <div className="account-activations-card">
                                    <div className="account-activations-label">Trial Activations</div>
                                    <div className="account-activations-value">{planDetails.trial_uses_remaining ?? 0}</div>
                                    <div className="account-activations-subtext">of 3 per month</div>
                                    <div className="account-usage-reset">Resets monthly</div>
                                </div>
                            )}

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

                            {isMonthly && (planDetails.amount != null || planDetails.current_period_end) && (
                                <div className="account-billing-card">
                                    {planDetails.current_period_end && formatDate(planDetails.current_period_end) && (
                                        <div className="account-billing-row">
                                            <span className="account-billing-label">Next billing & reset</span>
                                            <span className="account-billing-value">{formatDate(planDetails.current_period_end)}</span>
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
                        </div>

                        {/* Right column: upgrade tile (desktop) + action buttons */}
                        <div className="account-col-right">
                            {nextTier && (
                                <div className="account-tile-slot account-tile-slot--desktop">
                                    <div className="account-next-plan-tile">
                                        <div className="account-next-plan-badge">Next Step</div>
                                        <div className="account-next-plan-name">
                                            {PLAN_NAMES[nextTier.upper] ?? `Up to ${nextTier.upper}`}
                                        </div>
                                        <div className="account-next-plan-meta">
                                            Up to {nextTier.upper} attendees &nbsp;·&nbsp; <strong>${nextTier.monthly_price}/mo</strong>
                                        </div>
                                        <button
                                            className="account-next-plan-cta"
                                            onClick={() => handleTileUpgrade(nextTier)}
                                            disabled={isTileCheckingOut}
                                        >
                                            {isTileCheckingOut ? 'Processing...' : 'Upgrade →'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="account-button-group">
                                {planDetails.subscription_status === 'active' || planDetails.subscription_status === 'trialing' ? (
                                    <button
                                        onClick={() => navigate('/plan-selection', {
                                            state: {
                                                isUpgrade: true,
                                                currentPlan: planDetails,
                                                lobbyCode: lobbyContext.lobbyCode,
                                                fromActiveLobby: lobbyContext.fromActiveLobby,
                                                lobbyState: lobbyContext.lobbyState,
                                            },
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
                </div>
            </div>

            {showCancelModal && (
                <div className="account-modal-overlay" onClick={(e) => e.stopPropagation()}>
                    <div className="account-modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Cancel Subscription</h3>
                        <p className="account-modal-lead">Heads up &mdash; canceling will:</p>
                        <ul className="account-modal-list">
                            <li>End your access to organizer features immediately</li>
                            <li>Stop all future charges</li>
                            <li>Not refund the current billing period</li>
                        </ul>
                        <p className="account-modal-trailing">You can re-subscribe at any time.</p>
                        <div className="account-modal-buttons">
                            <button
                                className="account-modal-button account-modal-confirm"
                                onClick={handleCancelSubscription}
                                disabled={isCanceling}
                            >
                                {isCanceling ? 'Processing...' : 'Cancel Now'}
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
