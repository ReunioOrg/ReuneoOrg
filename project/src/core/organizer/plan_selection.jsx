import React, { useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './plan_selection.css';
import { apiFetch } from '../utils/api';
import { AuthContext } from '../Auth/AuthContext';
import FloatingLinesBackground from './FloatingLinesBackground';
import PageNavBar from '../components/PageNavBar/PageNavBar';

const bulkDiscount = (n) => {
    if (n <= 1) return 1;
    return Math.round((0.6 + 0.4 / Math.pow(n, 0.86)) * 1000) / 1000;
};

const PLAN_TYPE_LABELS = { single_use: 'One-Time Use', monthly: 'Monthly', free_trial: 'Free Trial' };

const SHOW_ONE_TIME_OPTION = false;

const INITIAL_VISIBLE_TIERS = 3;

const PlanSelection = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, permissions, isLegacyOrganizer } = useContext(AuthContext);

    const isUpgrade = !!location.state?.isUpgrade;
    const currentPlan = location.state?.currentPlan || null;
    const fromActiveLobby = !!location.state?.fromActiveLobby;
    const lobbyCode = location.state?.lobbyCode || '';
    const lobbyState = location.state?.lobbyState || null;

    const [isDesktop] = useState(() => window.innerWidth >= 769);

    // ── Core state ──
    const [tiers, setTiers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [checkoutLoadingTier, setCheckoutLoadingTier] = useState(null);
    const [checkoutError, setCheckoutError] = useState(null);

    const [billingMode, setBillingMode] = useState('monthly'); // 'single' | 'monthly'
    const [singleQuantity, setSingleQuantity] = useState(1);
    const [showMoreTiers, setShowMoreTiers] = useState(false);

    // User plan state (fetched on mount for authenticated users)
    const [userPlan, setUserPlan] = useState(currentPlan);
    const [pageMode, setPageMode] = useState('browse'); // 'browse' | 'freeTrial' | 'paidPlan' | 'upgrade'
    const [planLoading, setPlanLoading] = useState(!currentPlan && !!user && permissions !== 'admin' && !isLegacyOrganizer);

    // Modals
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [pendingTier, setPendingTier] = useState(null);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [checkoutEmail, setCheckoutEmail] = useState('');

    // Education lead capture
    const [eduShowInput, setEduShowInput] = useState(false);
    const [eduEmail, setEduEmail] = useState('');
    const [eduSubmitting, setEduSubmitting] = useState(false);
    const [eduSubmitted, setEduSubmitted] = useState(false);

    // ── Derive page mode ──
    useEffect(() => {
        if (isUpgrade) {
            setPageMode('upgrade');
            return;
        }
        if (!userPlan) {
            setPageMode('browse');
            return;
        }
        const status = userPlan.subscription_status;
        if (status !== 'active' && status !== 'trialing') {
            setPageMode('browse');
            return;
        }
        if (userPlan.plan_type === 'free_trial') {
            setPageMode('freeTrial');
        } else {
            setPageMode('paidPlan');
        }
    }, [userPlan, isUpgrade]);

    // ── Fetch user plan (if authenticated) ──
    useEffect(() => {
        if (currentPlan) { setPlanLoading(false); return; }
        if (!user || permissions === 'admin') { setPlanLoading(false); return; }
        if (isLegacyOrganizer) { setPlanLoading(false); return; }

        setPlanLoading(true);
        (async () => {
            try {
                const res = await apiFetch('/organizer-plan-details');
                if (!res.ok) return;
                const data = await res.json();
                if (data.has_plan) {
                    setUserPlan(data);
                }
            } catch {} finally {
                setPlanLoading(false);
            }
        })();
    }, [user, permissions, isLegacyOrganizer, currentPlan]);

    // ── Fetch tiers ──
    useEffect(() => {
        (async () => {
            try {
                const res = await apiFetch('/pricing/tiers');
                if (!res.ok) throw new Error('Tiers fetch failed');
                const data = await res.json();
                setTiers(data.tiers || []);
            } catch (err) {
                console.error('Failed to fetch tiers:', err);
                setTiers([]);
            } finally {
                setIsLoading(false);
            }
        })();
    }, []);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (showConfirmModal || showEmailModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [showConfirmModal, showEmailModal]);

    // ── Helpers ──
    const adjustQuantity = (delta) => {
        setSingleQuantity((prev) => Math.min(3, Math.max(1, prev + delta)));
    };

    const getQty = () => (billingMode === 'single' ? singleQuantity : 1);

    const getTierPrice = (tier) => {
        const base = billingMode === 'single' ? tier.single_use_price : tier.monthly_price;
        const qty = getQty();
        return Math.ceil(base * qty * bulkDiscount(qty));
    };

    const getUndiscountedPrice = (tier) => {
        const base = billingMode === 'single' ? tier.single_use_price : tier.monthly_price;
        return base * getQty();
    };

    const isCurrentTier = (tier) => {
        if (!userPlan || pageMode === 'browse') return false;
        const currentType = userPlan.plan_type;
        const activeType = billingMode === 'single' ? 'single_use' : 'monthly';
        if (currentType !== activeType) return false;
        const limit = userPlan.attendee_limit;
        return limit >= tier.lower && limit <= tier.upper;
    };

    const isBuyMore = (tier) => {
        if (!userPlan) return false;
        const activeType = billingMode === 'single' ? 'single_use' : 'monthly';
        if (userPlan.plan_type !== 'single_use' || activeType !== 'single_use') return false;
        const limit = userPlan.attendee_limit;
        return limit >= tier.lower && limit <= tier.upper;
    };

    // ── CTA labels ──
    const getCtaLabel = (tier) => {
        if (pageMode === 'browse') return 'Get Started';
        if (pageMode === 'freeTrial') return 'Upgrade';

        if (isCurrentTier(tier)) {
            if (isBuyMore(tier)) {
                const qty = getQty();
                return `Buy ${qty} More`;
            }
            return 'Current Plan';
        }
        return 'Switch Plan';
    };

    const isCtaDisabled = (tier) => {
        if (isCurrentTier(tier) && !isBuyMore(tier)) return true;
        return false;
    };

    // ── Confirm message for upgrades ──
    const getConfirmMessage = (tier) => {
        if (!userPlan) return '';
        const targetType = billingMode === 'single' ? 'single_use' : 'monthly';
        const currentType = userPlan.plan_type;
        const currentLabel = PLAN_TYPE_LABELS[currentType] || currentType;
        const qty = getQty();
        const price = getTierPrice(tier);

        if (isBuyMore(tier)) {
            return `You are purchasing ${qty} additional activation${qty === 1 ? '' : 's'} for $${price}.`;
        }

        let msg = `You are switching from ${currentLabel} to ${billingMode === 'single' ? 'One-Time Use' : 'Monthly'} (up to ${tier.upper} attendees).`;
        if (targetType !== currentType) {
            msg += ' Your current plan will be replaced after payment.';
            if (currentType === 'monthly') {
                msg += ' Your current subscription will be canceled immediately. Any remaining time will be credited towards your new plan.';
            }
            if (currentType === 'single_use' && (userPlan.activations_remaining || 0) > 0) {
                msg += ' Any unused value will be credited towards your new plan.';
            }
        } else if (targetType === 'single_use') {
            msg = `Your attendee limit will change to ${tier.upper}, and you'll receive ${qty} new activation${qty === 1 ? '' : 's'}.`;
            if ((userPlan.activations_remaining || 0) > 0) {
                msg += ' Any unused value will be credited towards your new plan.';
            }
        } else if (targetType === 'monthly') {
            msg = `Your current subscription will be canceled and replaced with a new one for up to ${tier.upper} attendees. Any remaining time on your current billing period will be credited towards your new plan.`;
        }
        return msg;
    };

    // ── Checkout handlers ──
    const handleTierClick = (tier) => {
        if (checkoutLoadingTier || planLoading) return;
        if (isCtaDisabled(tier)) return;

        if (pageMode === 'browse') {
            setPendingTier(tier);
            setCheckoutEmail('');
            setShowEmailModal(true);
            return;
        }

        // Upgrade / freeTrial / paidPlan — confirm first
        setPendingTier(tier);
        setShowConfirmModal(true);
    };

    const executeCheckout = async (tier, email) => {
        setCheckoutLoadingTier(tier.lower);
        setCheckoutError(null);
        const planType = billingMode === 'single' ? 'single_use' : 'monthly';
        const quantity = getQty();

        try {
            if (pageMode === 'browse') {
                const res = await apiFetch('/create-plan-checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        plan_type: planType,
                        attendees: tier.upper,
                        quantity,
                        email,
                        lobby_data: null,
                    }),
                });
                const data = await res.json();
                if (data.checkout_url) {
                    window.location.href = data.checkout_url;
                    return;
                }
                setCheckoutError(data.message || data.error || 'Checkout failed. Please try again.');
            } else {
                const body = {
                    plan_type: planType,
                    attendees: tier.upper,
                    quantity,
                };
                if (fromActiveLobby && lobbyCode) {
                    body.lobby_code = lobbyCode;
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
                setCheckoutError(data.message || data.error || 'Checkout failed. Please try again.');
            }
        } catch (err) {
            console.error('Checkout error:', err);
            setCheckoutError('Something went wrong. Please check your connection and try again.');
        } finally {
            setCheckoutLoadingTier(null);
        }
    };

    const handleConfirmUpgrade = () => {
        setShowConfirmModal(false);
        if (pendingTier) {
            executeCheckout(pendingTier, userPlan?.email || '');
        }
    };

    const handleEmailSubmit = () => {
        if (!checkoutEmail.trim() || !pendingTier) return;
        setShowEmailModal(false);
        executeCheckout(pendingTier, checkoutEmail.trim().toLowerCase());
    };

    const handleEduSubmit = async () => {
        const email = eduEmail.trim().toLowerCase();
        if (!email) return;
        setEduSubmitting(true);
        try {
            await apiFetch('/save-organizer-lead', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    lobby_data: null,
                    attendees: 0,
                    plan_type: 'education',
                }),
            });
        } catch (err) {
            console.error('Failed to save education lead:', err);
        }
        setEduSubmitting(false);
        setEduSubmitted(true);
    };

    // ── Visible tiers ──
    const visibleTiers = showMoreTiers ? tiers : tiers.slice(0, INITIAL_VISIBLE_TIERS);
    const hasHiddenTiers = tiers.length > INITIAL_VISIBLE_TIERS;

    const showFreeTrial = pageMode === 'browse';

    // ── Back navigation ──
    const handleBack = () => {
        if (fromActiveLobby && lobbyCode) {
            navigate(`/admin_lobby_view?code=${lobbyCode}`);
        } else if (isUpgrade || pageMode === 'paidPlan' || pageMode === 'freeTrial') {
            navigate('/organizer-account-details');
        } else {
            navigate('/');
        }
    };

    return (
        <div className="plan-selection-background ps-pricing-page">
            <FloatingLinesBackground />

            {isDesktop ? (
                <PageNavBar />
            ) : (
                <nav className="ps-nav-bar">
                    <button className="ps-nav-arrow" onClick={handleBack}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#144dff"
                            strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 12H5" /><polyline points="12 19 5 12 12 5" />
                        </svg>
                    </button>
                    <img src="/assets/reuneo_test_14.png" alt="Reuneo Logo" className="ps-logo-image" />
                    <div className="ps-nav-placeholder" />
                </nav>
            )}

            <h1 className="ps-page-title">
                {isUpgrade ? 'Change Plan' : 'Pricing'}
            </h1>
            <p className="ps-page-subtitle">
                {isUpgrade
                    ? <>Currently on <strong>{PLAN_TYPE_LABELS[currentPlan?.plan_type] || currentPlan?.plan_type}</strong> with <strong>{currentPlan?.attendee_limit}</strong> attendees</>
                    : 'Real Connections. Real Engagement. Real Results.'
                }
            </p>

            {/* ── Try for Free (browse mode) ── */}
            {showFreeTrial && (
                <button
                    className="ps-free-trial-pill"
                    onClick={() => navigate('/new_organizer')}
                >
                    <span className="ps-free-trial-dot" />
                    Try for Free
                </button>
            )}

            {/* ── Billing Toggle (hidden when one-time option is disabled) ── */}
            {SHOW_ONE_TIME_OPTION && (
            <div className="ps-billing-toggle">
                <button
                    className={`ps-billing-option ${billingMode === 'single' ? 'ps-billing-active' : ''}`}
                    onClick={() => setBillingMode('single')}
                >
                    One-Time
                </button>
                <button
                    className={`ps-billing-option ${billingMode === 'monthly' ? 'ps-billing-active' : ''}`}
                    onClick={() => setBillingMode('monthly')}
                >
                    Monthly
                    <span className="ps-billing-badge">Best Value</span>
                </button>
                <div
                    className="ps-billing-slider"
                    style={{ transform: billingMode === 'monthly' ? 'translateX(100%)' : 'translateX(0)' }}
                />
            </div>
            )}

            {/* ── Quantity Selector (One-Time only) ── */}
            {billingMode === 'single' && (
                <div className="ps-global-quantity">
                    <span className="ps-global-quantity-label">Activations per purchase:</span>
                    <div className="ps-quantity-incrementer">
                        <button
                            className="ps-qty-btn"
                            onClick={() => adjustQuantity(-1)}
                            disabled={!!checkoutLoadingTier || singleQuantity <= 1}
                        >
                            &minus;
                        </button>
                        <span className="ps-qty-value">{singleQuantity}</span>
                        <button
                            className="ps-qty-btn"
                            onClick={() => adjustQuantity(1)}
                            disabled={!!checkoutLoadingTier || singleQuantity >= 3}
                        >
                            +
                        </button>
                    </div>
                    {singleQuantity > 1 && (
                        <span className="ps-global-quantity-discount">
                            {Math.round((1 - bulkDiscount(singleQuantity)) * 100)}% bulk discount
                        </span>
                    )}
                </div>
            )}

            {/* ── Error Banner ── */}
            {checkoutError && (
                <div className="ps-error-banner">
                    <span>{checkoutError}</span>
                    <button className="ps-error-dismiss" onClick={() => setCheckoutError(null)}>&times;</button>
                </div>
            )}

            {/* ── Tier Cards ── */}
            {isLoading ? (
                <p className="ps-loading">Loading pricing...</p>
            ) : (
                <>
                    <div className="ps-tier-grid">
                        {visibleTiers.map((tier) => {
                            const price = getTierPrice(tier);
                            const undiscounted = getUndiscountedPrice(tier);
                            const qty = getQty();
                            const hasSavings = qty > 1 && undiscounted > price;
                            const current = isCurrentTier(tier);
                            const disabled = isCtaDisabled(tier);
                            const loading = checkoutLoadingTier === tier.lower;
                            const label = loading ? 'Processing...' : getCtaLabel(tier);

                            const sharedFeatures = [
                                `Up to ${tier.upper} attendees per session`,
                                'Interest and Random pairing modes',
                                'Sponsor logo placement',
                                'Match history for attendee follow-ups',
                            ];

                            const planFeatures = billingMode === 'single'
                                ? [
                                    { text: `${qty} activation${qty === 1 ? '' : 's'}`, included: true },
                                    { text: 'Attendee analytics', included: false },
                                    { text: 'Discounted attendee upgrades', included: false },
                                ]
                                : [
                                    { text: '3 activations per month', included: true },
                                    { text: 'Attendee analytics', included: true },
                                    { text: 'Discounted attendee upgrades per event', included: true },
                                ];

                            return (
                                <div
                                    key={tier.lower}
                                    className={[
                                        'ps-tier-card',
                                        current ? 'ps-tier-current' : '',
                                    ].filter(Boolean).join(' ')}
                                >
                                    {current && !isBuyMore(tier) && (
                                        <div className="ps-tier-current-badge">Your Plan</div>
                                    )}

                                    <div className="ps-tier-banner">
                                        Up to {tier.upper} attendees
                                    </div>

                                    <div className="ps-tier-price-section">
                                        <div className="ps-tier-price">
                                            <span className="ps-tier-dollar">$</span>
                                            <span className="ps-tier-amount">{price}</span>
                                            {billingMode === 'monthly' && (
                                                <span className="ps-tier-period">/mo</span>
                                            )}
                                        </div>
                                        {hasSavings && (
                                            <div className="ps-tier-savings">
                                                <span className="ps-tier-original">${undiscounted}</span>
                                                <span className="ps-tier-savings-badge">
                                                    {Math.round((1 - bulkDiscount(qty)) * 100)}% off
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="ps-tier-activations">
                                        {billingMode === 'single'
                                            ? `${qty} activation${qty === 1 ? '' : 's'}`
                                            : '3 activations / month'
                                        }
                                    </div>

                                    <ul className="ps-tier-features">
                                        {sharedFeatures.map((f) => (
                                            <li key={f} className="ps-feature-included">
                                                <span className="ps-feature-icon">✓</span>{f}
                                            </li>
                                        ))}
                                        {planFeatures.map((f) => (
                                            <li key={f.text} className={f.included ? 'ps-feature-included' : 'ps-feature-excluded'}>
                                                <span className="ps-feature-icon">{f.included ? '✓' : '—'}</span>{f.text}
                                            </li>
                                        ))}
                                    </ul>

                                    <button
                                        className={`ps-tier-cta ${disabled ? 'ps-tier-cta-disabled' : ''} ${loading ? 'ps-cta-loading' : ''}`}
                                        disabled={disabled || !!checkoutLoadingTier || planLoading}
                                        onClick={() => handleTierClick(tier)}
                                    >
                                        {label}
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    {hasHiddenTiers && (
                        <button
                            className="ps-see-more-btn"
                            onClick={() => setShowMoreTiers((v) => !v)}
                        >
                            {showMoreTiers ? 'Show less' : 'Up to 200 attendees'}
                        </button>
                    )}
                </>
            )}

            {/* ── Custom / Enterprise Block ── */}
            <div className="ps-enterprise-banner">
                <div className="ps-enterprise-content">
                    <h3 className="ps-enterprise-title">Custom</h3>
                    <p className="ps-enterprise-subtitle">
                        Let&apos;s build a tailored plan for your organization
                    </p>
                    <ul className="ps-enterprise-features">
                        <li><span className="ps-feature-icon">✓</span>200+ attendees</li>
                        <li><span className="ps-feature-icon">✓</span>Enterprise features and integrations</li>
                        <li><span className="ps-feature-icon">✓</span>Dedicated onboarding support</li>
                        <li><span className="ps-feature-icon">✓</span>Partnerships</li>
                    </ul>
                </div>
                <a
                    href="https://calendly.com/julian-reuneo/30min"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ps-enterprise-cta"
                >
                    Schedule a Call
                </a>
            </div>

            {/* ── Education Block ── */}
            <div className="ps-enterprise-banner ps-education-banner">
                <div className="ps-enterprise-content">
                    <h3 className="ps-enterprise-title">Education</h3>
                    <p className="ps-enterprise-subtitle">
                        Special pricing for universities and schools
                    </p>
                </div>
                {eduSubmitted ? (
                    <div className="ps-edu-confirmed">
                        <span className="ps-edu-confirmed-icon">✓</span>
                        We&apos;ll be in touch!
                    </div>
                ) : eduShowInput ? (
                    <div className="ps-edu-input-group">
                        <input
                            type="email"
                            className="ps-edu-email-input"
                            placeholder="you@university.edu"
                            value={eduEmail}
                            onChange={(e) => setEduEmail(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleEduSubmit(); }}
                            autoFocus
                        />
                        <button
                            className="ps-enterprise-cta ps-edu-submit-btn"
                            disabled={eduSubmitting || !eduEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(eduEmail.trim())}
                            onClick={handleEduSubmit}
                        >
                            {eduSubmitting ? 'Sending...' : 'Submit'}
                        </button>
                    </div>
                ) : (
                    <button
                        className="ps-enterprise-cta"
                        onClick={() => setEduShowInput(true)}
                    >
                        Get Started
                    </button>
                )}
            </div>

            {/* ── Compare Table (plan-type columns) ── */}
            {!isLoading && (() => {
                const selectedTier = visibleTiers.length > 0 ? visibleTiers[0] : null;
                const attendeeLabel = selectedTier ? `Up to ${selectedTier.upper}` : 'Up to 200';
                const activationsLabel = `${singleQuantity} per purchase`;

                return (
                    <div className="ps-compare-section">
                        <h2 className="ps-compare-title">Compare Plans</h2>
                        <div className="ps-compare-table-wrapper">
                            <table className="ps-compare-table">
                                <thead>
                                    <tr>
                                        <th></th>
                                        {SHOW_ONE_TIME_OPTION && (
                                        <th className={billingMode === 'single' ? 'ps-compare-highlight' : ''}>One-Time</th>
                                        )}
                                        <th className={billingMode === 'monthly' ? 'ps-compare-highlight' : ''}>Monthly</th>
                                        <th>Custom</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Attendees per session</td>
                                        {SHOW_ONE_TIME_OPTION && (
                                        <td className={billingMode === 'single' ? 'ps-compare-highlight-cell' : ''}>{attendeeLabel}</td>
                                        )}
                                        <td className={billingMode === 'monthly' ? 'ps-compare-highlight-cell' : ''}>{attendeeLabel}</td>
                                        <td>Custom</td>
                                    </tr>
                                    <tr>
                                        <td>Activations</td>
                                        {SHOW_ONE_TIME_OPTION && (
                                        <td className={billingMode === 'single' ? 'ps-compare-highlight-cell' : ''}>{activationsLabel}</td>
                                        )}
                                        <td className={billingMode === 'monthly' ? 'ps-compare-highlight-cell' : ''}>3 / month</td>
                                        <td>Custom</td>
                                    </tr>
                                    <tr>
                                        <td>Interest &amp; Random pairing</td>
                                        {SHOW_ONE_TIME_OPTION && (
                                        <td className={billingMode === 'single' ? 'ps-compare-highlight-cell' : ''}><span className="ps-compare-check">✓</span></td>
                                        )}
                                        <td className={billingMode === 'monthly' ? 'ps-compare-highlight-cell' : ''}><span className="ps-compare-check">✓</span></td>
                                        <td><span className="ps-compare-check">✓</span></td>
                                    </tr>
                                    <tr>
                                        <td>Sponsor logo</td>
                                        {SHOW_ONE_TIME_OPTION && (
                                        <td className={billingMode === 'single' ? 'ps-compare-highlight-cell' : ''}><span className="ps-compare-check">✓</span></td>
                                        )}
                                        <td className={billingMode === 'monthly' ? 'ps-compare-highlight-cell' : ''}><span className="ps-compare-check">✓</span></td>
                                        <td><span className="ps-compare-check">✓</span></td>
                                    </tr>
                                    <tr>
                                        <td>Match history</td>
                                        {SHOW_ONE_TIME_OPTION && (
                                        <td className={billingMode === 'single' ? 'ps-compare-highlight-cell' : ''}><span className="ps-compare-check">✓</span></td>
                                        )}
                                        <td className={billingMode === 'monthly' ? 'ps-compare-highlight-cell' : ''}><span className="ps-compare-check">✓</span></td>
                                        <td><span className="ps-compare-check">✓</span></td>
                                    </tr>
                                    <tr>
                                        <td>Attendee analytics</td>
                                        {SHOW_ONE_TIME_OPTION && (
                                        <td className={billingMode === 'single' ? 'ps-compare-highlight-cell' : ''}><span className="ps-compare-x">—</span></td>
                                        )}
                                        <td className={billingMode === 'monthly' ? 'ps-compare-highlight-cell' : ''}><span className="ps-compare-check">✓</span></td>
                                        <td><span className="ps-compare-check">✓</span></td>
                                    </tr>
                                    <tr>
                                        <td>Discounted attendee upgrades</td>
                                        {SHOW_ONE_TIME_OPTION && (
                                        <td className={billingMode === 'single' ? 'ps-compare-highlight-cell' : ''}><span className="ps-compare-x">—</span></td>
                                        )}
                                        <td className={billingMode === 'monthly' ? 'ps-compare-highlight-cell' : ''}><span className="ps-compare-check">✓</span></td>
                                        <td><span className="ps-compare-check">✓</span></td>
                                    </tr>
                                    <tr>
                                        <td>Dedicated support</td>
                                        {SHOW_ONE_TIME_OPTION && (
                                        <td className={billingMode === 'single' ? 'ps-compare-highlight-cell' : ''}><span className="ps-compare-x">—</span></td>
                                        )}
                                        <td className={billingMode === 'monthly' ? 'ps-compare-highlight-cell' : ''}><span className="ps-compare-x">—</span></td>
                                        <td><span className="ps-compare-check">✓</span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            })()}


            {/* ── Upgrade Confirmation Modal ── */}
            {showConfirmModal && pendingTier && (
                <div className="ps-confirm-overlay" onClick={() => setShowConfirmModal(false)}>
                    <div className="ps-confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <h3 className="ps-confirm-title">Confirm Plan Change</h3>
                        <p className="ps-confirm-message">{getConfirmMessage(pendingTier)}</p>
                        <div className="ps-confirm-buttons">
                            <button
                                className="ps-confirm-cancel"
                                onClick={() => { setShowConfirmModal(false); setPendingTier(null); }}
                            >
                                Cancel
                            </button>
                            <button
                                className="ps-confirm-proceed"
                                onClick={handleConfirmUpgrade}
                            >
                                Continue to Payment
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Email Modal (browse mode new purchases) ── */}
            {showEmailModal && pendingTier && (
                <div className="ps-confirm-overlay" onClick={() => { setShowEmailModal(false); setPendingTier(null); }}>
                    <div className="ps-confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <h3 className="ps-confirm-title">Enter Your Email</h3>
                        <p className="ps-confirm-message">
                            Your organizer account will be created with this email after payment.
                        </p>
                        <input
                            type="email"
                            className="ps-confirm-email-input"
                            placeholder="you@example.com"
                            value={checkoutEmail}
                            onChange={(e) => setCheckoutEmail(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleEmailSubmit(); }}
                            autoFocus
                        />
                        <p className="ps-confirm-message ps-confirm-message-sub">
                            Make sure it's correct — you won't be able to change it during checkout.
                        </p>
                        <div className="ps-confirm-buttons">
                            <button
                                className="ps-confirm-cancel"
                                onClick={() => { setShowEmailModal(false); setPendingTier(null); }}
                            >
                                Cancel
                            </button>
                            <button
                                className="ps-confirm-proceed"
                                disabled={!checkoutEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(checkoutEmail.trim())}
                                onClick={handleEmailSubmit}
                            >
                                Continue to Checkout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlanSelection;
