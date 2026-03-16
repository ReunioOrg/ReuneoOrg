import React, { useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './plan_selection.css';
import { apiFetch } from '../utils/api';
import { AuthContext } from '../Auth/AuthContext';
import FloatingLinesBackground from './FloatingLinesBackground';

const bulkDiscount = (n) => {
    if (n <= 1) return 1;
    return Math.round((0.6 + 0.4 / Math.pow(n, 0.86)) * 1000) / 1000;
};

const PLAN_KEY_MAP = { single: 'single_use', monthly: 'monthly', free_trial: 'free_trial' };

const PLAN_TYPE_LABELS = { single_use: 'One-Time Use', monthly: 'Monthly', free_trial: 'Free Trial' };

const PLANS = [
    {
        key: 'single',
        title: 'One-Time Use',
        priceField: 'single_use_price',
        subheader: (qty) => `${qty} activation${qty === 1 ? '' : 's'}`,
        hasQuantity: true,
        details: [
            'Full lobby access for each activation',
            'Custom matchmaking or ice-breaker mode',
            'Sponsor logo placement',
            'Match history tracking',
            'Up to 250 attendees per session',
            'No recurring commitment',
        ],
    },
    {
        key: 'monthly',
        title: 'Monthly Sub',
        priceField: 'monthly_price',
        subheader: (qty) => `${qty} use${qty === 1 ? '' : 's'} per month`,
        hasQuantity: true,
        details: [
            'Lobby activations each month',
            'Custom matchmaking or ice-breaker mode',
            'Sponsor logo placement',
            'Match history tracking',
            'Up to 250 attendees per session',
            'Cancel anytime',
        ],
    },
    {
        key: 'custom',
        title: 'Custom',
        priceField: null,
        priceLabel: 'Book a Call',
        subheader: () => (
            <span className="ps-contact-icons">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M15.5 9.5V7.5C15.5 6.95 15.05 6.5 14.5 6.5H4.5C3.95 6.5 3.5 6.95 3.5 7.5V16.5C3.5 17.05 3.95 17.5 4.5 17.5H14.5C15.05 17.5 15.5 17.05 15.5 16.5V14.5L20.5 18V6L15.5 9.5Z" fill="#9ca3af"/>
                </svg>
                <span className="ps-contact-divider" />
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M6.62 10.79C8.06 13.62 10.38 15.93 13.21 17.38L15.41 15.18C15.68 14.91 16.08 14.82 16.43 14.94C17.55 15.31 18.76 15.51 20 15.51C20.55 15.51 21 15.96 21 16.51V20C21 20.55 20.55 21 20 21C10.61 21 3 13.39 3 4C3 3.45 3.45 3 4 3H7.5C8.05 3 8.5 3.45 8.5 4C8.5 5.25 8.7 6.45 9.07 7.57C9.18 7.92 9.1 8.31 8.82 8.59L6.62 10.79Z" fill="#9ca3af"/>
                </svg>
            </span>
        ),
        hasQuantity: false,
        details: [
            'Tailored plan for your organization',
            'Custom attendee limits',
            'Dedicated onboarding support',
            'Flexible billing options',
            'Volume discounts available',
            'White-glove setup assistance',
        ],
        ctaLabel: 'Schedule Call',
        ctaLink: 'https://calendly.com/julian-reuneo/30min',
    },
];

const PlanSelection = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { permissions, isLegacyOrganizer } = useContext(AuthContext);

    const isUpgrade = !!location.state?.isUpgrade;
    const currentPlan = location.state?.currentPlan || null;

    const [activeLobbyData, setActiveLobbyData] = useState(null);
    const [prices, setPrices] = useState(null);
    const [singleQuantity, setSingleQuantity] = useState(1);
    const [monthlyQuantity, setMonthlyQuantity] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [checkoutLoadingPlan, setCheckoutLoadingPlan] = useState(null);
    const [checkoutError, setCheckoutError] = useState(null);

    const [upgradeAttendees, setUpgradeAttendees] = useState(
        currentPlan?.attendee_limit || 15
    );
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [pendingUpgradePlan, setPendingUpgradePlan] = useState(null);
    const [showEmailConfirmModal, setShowEmailConfirmModal] = useState(false);
    const [pendingEmailPlan, setPendingEmailPlan] = useState(null);
    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [editedEmail, setEditedEmail] = useState('');

    const debounceRef = useRef(null);

    // Route guard: redirect organizers away UNLESS this is an upgrade
    useEffect(() => {
        if (!isUpgrade && permissions === 'organizer' && !isLegacyOrganizer) {
            navigate('/organizer-account-details');
        }
    }, [permissions, isLegacyOrganizer, isUpgrade, navigate]);

    // Data source: lobbyData for new purchases, currentPlan for upgrades
    useEffect(() => {
        if (isUpgrade) {
            setActiveLobbyData({
                attendees: currentPlan?.attendee_limit || 15,
                email: currentPlan?.email || '',
            });
            return;
        }
        const routerData = location.state?.lobbyData;
        if (routerData) {
            setActiveLobbyData(routerData);
            return;
        }
        try {
            const saved = sessionStorage.getItem('reuneo_plan_lobbyData');
            if (saved) {
                const parsed = JSON.parse(saved);
                const savedLogo = localStorage.getItem('reuneo_plan_logo');
                if (savedLogo) parsed.logo_cropped_image = savedLogo;
                setActiveLobbyData(parsed);
                return;
            }
        } catch {}
        navigate('/new_organizer', { replace: true });
    }, []);

    // Pricing fetch — uses upgradeAttendees in upgrade mode
    const fetchPrices = useCallback(async (attendeeCount) => {
        try {
            const res = await apiFetch(`/pricing?attendees=${attendeeCount}`);
            if (!res.ok) throw new Error('Pricing fetch failed');
            const data = await res.json();
            setPrices(data);
        } catch (err) {
            console.error('Failed to fetch pricing:', err);
            setPrices({
                single_use_price: 0,
                monthly_price: 0,
                single_use_per_attendee: 0,
                monthly_per_attendee: 0,
                requires_custom: false,
            });
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        if (!activeLobbyData) return;
        const count = isUpgrade ? upgradeAttendees : activeLobbyData.attendees;
        if (!count || count < 1) return;
        fetchPrices(count);
    }, [activeLobbyData]);

    // Debounced pricing re-fetch when upgradeAttendees changes
    useEffect(() => {
        if (!isUpgrade || !activeLobbyData) return;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        setIsRefreshing(true);
        debounceRef.current = setTimeout(() => {
            fetchPrices(upgradeAttendees);
        }, 300);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [upgradeAttendees, isUpgrade, activeLobbyData, fetchPrices]);

    const activeAttendees = isUpgrade ? upgradeAttendees : activeLobbyData?.attendees;

    // Determine CTA label for upgrade mode
    const getUpgradeCtaLabel = (planKey) => {
        if (!currentPlan) return 'Buy';
        const targetType = PLAN_KEY_MAP[planKey];
        const currentType = currentPlan.plan_type;
        const qty = getQuantity(planKey);

        if (targetType === currentType) {
            if (targetType === 'single_use' && upgradeAttendees === currentPlan.attendee_limit) {
                return `Buy ${qty} More`;
            }
            return 'Update Plan';
        }
        return 'Switch to This Plan';
    };

    // Build confirmation modal message
    const getConfirmMessage = (planKey) => {
        if (!currentPlan) return '';
        const targetType = PLAN_KEY_MAP[planKey];
        const currentType = currentPlan.plan_type;
        const currentLabel = PLAN_TYPE_LABELS[currentType] || currentType;
        const targetLabel = PLANS.find(p => p.key === planKey)?.title || planKey;
        const qty = getQuantity(planKey);

        if (targetType === currentType && targetType === 'single_use' && upgradeAttendees === currentPlan.attendee_limit) {
            const price = getDisplayPrice(PLANS.find(p => p.key === planKey));
            return `You are purchasing ${qty} additional activation${qty === 1 ? '' : 's'} for $${price}.`;
        }

        let msg = `You are switching from ${currentLabel} to ${targetLabel}.`;
        if (targetType !== currentType) {
            msg += ' Your current plan will be replaced after payment.';
            if (currentType === 'monthly') {
                msg += ' Your current subscription will be canceled immediately.';
            }
            if (currentType === 'single_use' && (currentPlan.activations_remaining || 0) > 0) {
                msg += ` You have ${currentPlan.activations_remaining} unused activation${currentPlan.activations_remaining === 1 ? '' : 's'} that will be forfeited.`;
            }
        } else if (targetType === 'single_use') {
            msg = `Your attendee limit will change from ${currentPlan.attendee_limit} to ${upgradeAttendees}, and you'll receive ${qty} new activation${qty === 1 ? '' : 's'}.`;
            if ((currentPlan.activations_remaining || 0) > 0) {
                msg += ` Your ${currentPlan.activations_remaining} remaining activation${currentPlan.activations_remaining === 1 ? '' : 's'} will be forfeited.`;
            }
        } else if (targetType === 'monthly') {
            msg = 'Your current subscription will be canceled and replaced with a new one.';
        }
        return msg;
    };

    const handleCheckout = async (planKey) => {
        if (checkoutLoadingPlan) return;

        if (isUpgrade) {
            setPendingUpgradePlan(planKey);
            setShowConfirmModal(true);
            return;
        }

        setPendingEmailPlan(planKey);
        setEditedEmail(activeLobbyData?.email || '');
        setIsEditingEmail(false);
        setShowEmailConfirmModal(true);
    };

    const executeCheckout = async (planKey, lobbyDataOverride) => {
        setCheckoutLoadingPlan(planKey);
        setCheckoutError(null);
        const data$ = lobbyDataOverride || activeLobbyData;

        try {
            if (isUpgrade) {
                const quantity = getQuantity(planKey);
                const res = await apiFetch('/upgrade-plan-checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        plan_type: PLAN_KEY_MAP[planKey],
                        attendees: upgradeAttendees,
                        quantity,
                    }),
                });
                const data = await res.json();
                if (data.checkout_url) {
                    window.location.href = data.checkout_url;
                    return;
                }
                setCheckoutError(data.message || data.error || 'Checkout failed. Please try again.');
                setCheckoutLoadingPlan(null);
                return;
            }

            const { logo_cropped_image, ...lobbyDataWithoutLogo } = data$;

            if (logo_cropped_image) {
                localStorage.setItem('reuneo_plan_logo', logo_cropped_image);
            } else {
                localStorage.removeItem('reuneo_plan_logo');
            }

            sessionStorage.setItem('reuneo_plan_lobbyData', JSON.stringify(lobbyDataWithoutLogo));

            const quantity = planKey === 'free_trial' ? 1 : getQuantity(planKey);

            const res = await apiFetch('/create-plan-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    plan_type: PLAN_KEY_MAP[planKey],
                    attendees: data$.attendees,
                    quantity,
                    email: data$.email,
                    lobby_data: lobbyDataWithoutLogo,
                }),
            });

            const data = await res.json();

            if (data.checkout_url) {
                window.location.href = data.checkout_url;
                return;
            }

            setCheckoutError(data.message || data.error || 'Checkout failed. Please try again.');
            setCheckoutLoadingPlan(null);
        } catch (err) {
            console.error('Checkout error:', err);
            setCheckoutError('Something went wrong. Please check your connection and try again.');
            setCheckoutLoadingPlan(null);
        }
    };

    const handleConfirmUpgrade = () => {
        setShowConfirmModal(false);
        if (pendingUpgradePlan) {
            executeCheckout(pendingUpgradePlan);
        }
    };

    const adjustQuantity = (planKey, delta) => {
        const setter = planKey === 'single' ? setSingleQuantity : setMonthlyQuantity;
        setter((prev) => Math.min(100, Math.max(1, prev + delta)));
    };

    const getQuantity = (planKey) => {
        if (planKey === 'single') return singleQuantity;
        if (planKey === 'monthly') return monthlyQuantity;
        return 1;
    };

    const requiresCustom = prices?.requires_custom || (activeAttendees > 250);
    const isFreeTrialOnly = activeAttendees <= 15;

    const getDisplayPrice = (plan) => {
        if (!prices || !plan.priceField) return '—';
        const base = prices[plan.priceField];
        const qty = getQuantity(plan.key);
        return Math.ceil(base * qty * bulkDiscount(qty));
    };

    const getUndiscountedPrice = (plan) => {
        if (!prices || !plan.priceField) return 0;
        return prices[plan.priceField] * getQuantity(plan.key);
    };

    const getPriceLabel = (plan) => {
        if (plan.key === 'single') return '';
        if (plan.key === 'monthly') return '/mo';
        return '';
    };

    const isCurrentPlanMatch = (planKey) => {
        if (!isUpgrade || !currentPlan) return false;
        return PLAN_KEY_MAP[planKey] === currentPlan.plan_type;
    };

    // Lock body scroll when modal is open
    useEffect(() => {
        if (showConfirmModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [showConfirmModal]);

    if (!activeLobbyData) return null;

    return (
        <div className="plan-selection-background">
            <FloatingLinesBackground />

            <nav className="ps-nav-bar">
                <button
                    className="ps-nav-arrow"
                    onClick={() => {
                        if (isUpgrade) {
                            navigate('/organizer-account-details');
                        } else {
                            navigate('/new_organizer', { state: { returnData: activeLobbyData } });
                        }
                    }}
                >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#144dff"
                        strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5" /><polyline points="12 19 5 12 12 5" />
                    </svg>
                </button>
                <img src="/assets/reuneo_test_11.png" alt="Reuneo Logo" className="ps-logo-image" />
                <div className="ps-nav-placeholder" />
            </nav>

            <h1 className="ps-page-title">{isUpgrade ? 'Change Plan' : 'Choose Your Plan'}</h1>

            {isUpgrade && currentPlan && (
                <div className="ps-current-plan-banner">
                    Currently on <strong>{PLAN_TYPE_LABELS[currentPlan.plan_type] || currentPlan.plan_type}</strong> with <strong>{currentPlan.attendee_limit}</strong> attendees
                </div>
            )}

            {isUpgrade ? (
                <div className="ps-attendee-picker">
                    <label className="ps-attendee-picker-label">Attendees:</label>
                    <input
                        type="number"
                        className="ps-attendee-picker-input"
                        value={upgradeAttendees}
                        min={1}
                        max={250}
                        onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val) && val >= 1) setUpgradeAttendees(Math.min(val, 250));
                        }}
                    />
                </div>
            ) : (
                activeAttendees && (
                    <p className="ps-attendee-context">
                        Pricing for <strong>{activeAttendees}</strong> attendee{activeAttendees === 1 ? '' : 's'}
                    </p>
                )
            )}

            {(!isUpgrade || isFreeTrialOnly) && (
                <button
                    className={`ps-free-trial ${checkoutLoadingPlan === 'free_trial' ? 'ps-cta-loading' : ''} ${requiresCustom ? 'ps-free-trial-disabled' : ''} ${isFreeTrialOnly ? 'ps-free-trial-highlighted' : ''}`}
                    onClick={() => !requiresCustom && handleCheckout('free_trial')}
                    disabled={requiresCustom || !!checkoutLoadingPlan}
                >
                    <span className="ps-free-trial-dot" />
                    <span className="ps-free-trial-label">
                        {checkoutLoadingPlan === 'free_trial' ? 'Processing...' : 'Free Trial Plan'}
                    </span>
                    <span className="ps-free-trial-details">
                        <span className="ps-free-trial-attendees">15 attendees</span>
                        <span className="ps-free-trial-divider" />
                        <span className="ps-free-trial-per-use">per use</span>
                    </span>
                </button>
            )}

            {checkoutError && (
                <div className="ps-error-banner">
                    {checkoutError}
                    <button className="ps-error-dismiss" onClick={() => setCheckoutError(null)}>&times;</button>
                </div>
            )}

            <div className={`ps-columns-container${isRefreshing ? ' ps-columns-refreshing' : ''}`}>
                {isLoading ? (
                    <div className="ps-loading">Loading plans...</div>
                ) : (
                    (isFreeTrialOnly || requiresCustom
                        ? [PLANS.find(p => p.key === 'custom'), ...PLANS.filter(p => p.key !== 'custom')]
                        : PLANS
                    ).map((plan) => {
                        const isPurchasable = plan.key !== 'custom';
                        const isDisabled = (isPurchasable && requiresCustom) || (isPurchasable && isFreeTrialOnly);
                        const isHighlighted = plan.key === 'custom' && requiresCustom;
                        const isCurrent = isCurrentPlanMatch(plan.key);
                        const qty = getQuantity(plan.key);
                        const discounted = getDisplayPrice(plan);
                        const undiscounted = getUndiscountedPrice(plan);
                        const hasSavings = isPurchasable && qty > 1 && undiscounted > discounted;
                        const isThisPlanLoading = checkoutLoadingPlan === plan.key;

                        const ctaLabel = isThisPlanLoading
                            ? 'Processing...'
                            : isUpgrade && isPurchasable
                                ? getUpgradeCtaLabel(plan.key)
                                : (plan.ctaLabel || 'Buy');

                        return (
                            <div
                                key={plan.key}
                                className={[
                                    'ps-column',
                                    isDisabled ? 'ps-column-disabled' : '',
                                    isHighlighted ? 'ps-column-highlighted' : '',
                                ].filter(Boolean).join(' ')}
                            >
                                {isCurrent && (
                                    <div className="ps-current-badge">Current Plan</div>
                                )}
                                <div className="ps-column-title">{plan.title}</div>

                                <div className="ps-price-section">
                                    {plan.priceField ? (
                                        <>
                                            <div className="ps-price">
                                                <span className="ps-price-dollar">$</span>
                                                <span className="ps-price-amount">{discounted}</span>
                                                <span className="ps-price-period">{getPriceLabel(plan)}</span>
                                            </div>
                                            {hasSavings && (
                                                <div className="ps-savings">
                                                    <span className="ps-savings-original">${undiscounted}</span>
                                                    <span className="ps-savings-badge">
                                                        {Math.round((1 - bulkDiscount(qty)) * 100)}% off
                                                    </span>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="ps-price">
                                            <span className="ps-price-amount ps-price-text">{plan.priceLabel}</span>
                                        </div>
                                    )}
                                    <div className="ps-price-subheader">{plan.subheader(qty)}</div>
                                </div>

                                {plan.hasQuantity && (
                                    <div className="ps-quantity-incrementer">
                                        <button
                                            className="ps-qty-btn"
                                            onClick={() => adjustQuantity(plan.key, -1)}
                                            disabled={isDisabled || !!checkoutLoadingPlan || qty <= 1}
                                        >
                                            &minus;
                                        </button>
                                        <span className="ps-qty-value">{qty}</span>
                                        <button
                                            className="ps-qty-btn"
                                            onClick={() => adjustQuantity(plan.key, 1)}
                                            disabled={isDisabled || !!checkoutLoadingPlan || qty >= 100}
                                        >
                                            +
                                        </button>
                                    </div>
                                )}

                                {isDisabled && (
                                    <div className="ps-attendee-cap">250 attendee max</div>
                                )}

                                <ul className="ps-plan-details">
                                    {plan.details.map((item, i) => (
                                        <li key={i}>{item}</li>
                                    ))}
                                </ul>

                                <button
                                    className={`ps-cta ${isDisabled ? 'ps-cta-disabled' : ''} ${isThisPlanLoading ? 'ps-cta-loading' : ''}`}
                                    disabled={isDisabled || !!checkoutLoadingPlan}
                                    onClick={() => {
                                        if (isDisabled) return;
                                        if (plan.ctaLink) {
                                            window.open(plan.ctaLink, '_blank', 'noopener');
                                        } else {
                                            handleCheckout(plan.key);
                                        }
                                    }}
                                >
                                    {ctaLabel}
                                </button>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Upgrade Confirmation Modal */}
            {showConfirmModal && pendingUpgradePlan && (
                <div className="ps-confirm-overlay" onClick={() => setShowConfirmModal(false)}>
                    <div className="ps-confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <h3 className="ps-confirm-title">Confirm Plan Change</h3>
                        <p className="ps-confirm-message">{getConfirmMessage(pendingUpgradePlan)}</p>
                        <div className="ps-confirm-buttons">
                            <button
                                className="ps-confirm-cancel"
                                onClick={() => { setShowConfirmModal(false); setPendingUpgradePlan(null); }}
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

            {/* Email Confirmation Modal (new purchases only) */}
            {showEmailConfirmModal && pendingEmailPlan && (
                <div className="ps-confirm-overlay" onClick={() => { setShowEmailConfirmModal(false); setPendingEmailPlan(null); setIsEditingEmail(false); }}>
                    <div className="ps-confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <h3 className="ps-confirm-title">Confirm Your Email</h3>
                        <p className="ps-confirm-message">
                            Your organizer account will be created with this email:
                        </p>
                        {isEditingEmail ? (
                            <input
                                type="email"
                                className="ps-confirm-email-input"
                                value={editedEmail}
                                onChange={(e) => setEditedEmail(e.target.value)}
                                autoFocus
                            />
                        ) : (
                            <p className="ps-confirm-email">{activeLobbyData?.email}</p>
                        )}
                        <p className="ps-confirm-message ps-confirm-message-sub">
                            Make sure it's correct — you won't be able to change it during checkout.
                        </p>
                        <div className="ps-confirm-buttons">
                            <button
                                className="ps-confirm-proceed"
                                onClick={() => {
                                    let dataOverride = null;
                                    if (isEditingEmail && editedEmail && editedEmail !== activeLobbyData?.email) {
                                        const updated = { ...activeLobbyData, email: editedEmail };
                                        setActiveLobbyData(updated);
                                        dataOverride = updated;
                                    }
                                    setShowEmailConfirmModal(false);
                                    setIsEditingEmail(false);
                                    executeCheckout(pendingEmailPlan, dataOverride);
                                    setPendingEmailPlan(null);
                                }}
                            >
                                Continue
                            </button>
                            <button
                                className="ps-confirm-cancel"
                                onClick={() => {
                                    if (isEditingEmail) {
                                        setIsEditingEmail(false);
                                    } else {
                                        setEditedEmail(activeLobbyData?.email || '');
                                        setIsEditingEmail(true);
                                    }
                                }}
                            >
                                {isEditingEmail ? 'Cancel Edit' : 'Edit Email'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlanSelection;
