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
        subtitle: 'Best for one-off events',
        priceField: 'single_use_price',
        subheader: (qty) => `${qty} activation${qty === 1 ? '' : 's'}`,
        hasQuantity: true,
        recommended: false,
        getDetails: (qty, attendees) => [
            { text: `Up to ${attendees} attendees per session`, included: true },
            { text: `${qty} activation${qty === 1 ? '' : 's'}`, included: true },
            { text: 'Interest & Random pairing modes', included: true },
            { text: 'Sponsor logo placement', included: true },
            { text: 'Match history for attendee follow-ups', included: true },
            { text: 'Attendee analytics', included: false },
            { text: 'Discounted attendee upgrades', included: false },
        ],
    },
    {
        key: 'monthly',
        title: 'Monthly Sub',
        subtitle: 'Best for community builders',
        badge: 'Best Value',
        priceField: 'monthly_price',
        subheader: () => '3 activations per month',
        recommended: true,
        getDetails: (_qty, attendees) => [
            { text: `Up to ${attendees} attendees per session`, included: true },
            { text: '3 activations per month', included: true },
            { text: 'Interest & Random pairing modes', included: true },
            { text: 'Sponsor logo placement', included: true },
            { text: 'Match history for attendee follow-ups', included: true },
            { text: 'Attendee analytics - interests, contacts, pairing history', included: true },
            { text: 'Discounted attendee upgrades per event', included: true },
        ],
    },
    {
        key: 'custom',
        title: 'Custom',
        subtitle: '',
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
        recommended: false,
        getDetails: () => [
            { text: 'Tailored plan for your organization', included: true },
            { text: 'Enterprise features and integrations', included: true },
            { text: 'Custom attendee limits', included: true },
            { text: 'Volume discounts available', included: true },
            { text: 'Dedicated onboarding support', included: true },
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
    const fromActiveLobby = !!location.state?.fromActiveLobby;
    const lobbyCode = location.state?.lobbyCode || '';
    const lobbyState = location.state?.lobbyState || null;

    const [activeLobbyData, setActiveLobbyData] = useState(null);
    const [prices, setPrices] = useState(null);
    const [singleQuantity, setSingleQuantity] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [checkoutLoadingPlan, setCheckoutLoadingPlan] = useState(null);
    const [checkoutError, setCheckoutError] = useState(null);

    const [upgradeAttendees, setUpgradeAttendees] = useState(
        currentPlan?.attendee_limit || 25
    );
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [pendingUpgradePlan, setPendingUpgradePlan] = useState(null);
    const [showEmailConfirmModal, setShowEmailConfirmModal] = useState(false);

    // Quick-upgrade state (active lobby flow)
    const [suggestionPrices, setSuggestionPrices] = useState([]);
    const [showAllPlans, setShowAllPlans] = useState(!fromActiveLobby);
    const [pendingEmailPlan, setPendingEmailPlan] = useState(null);
    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [editedEmail, setEditedEmail] = useState('');
    const [isEditingAttendees, setIsEditingAttendees] = useState(false);
    const [draftAttendees, setDraftAttendees] = useState(null);

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
                attendees: currentPlan?.attendee_limit || 25,
                email: currentPlan?.email || '',
            });
            return;
        }
        const routerData = location.state?.lobbyData;
        if (routerData) {
            const { logo_cropped_image, ...withoutLogo } = routerData;
            sessionStorage.setItem('reuneo_plan_lobbyData', JSON.stringify(withoutLogo));
            if (logo_cropped_image) localStorage.setItem('reuneo_plan_logo', logo_cropped_image);
            setActiveLobbyData(routerData);
            navigate(location.pathname, { replace: true, state: null });
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

    useEffect(() => {
        if (!activeLobbyData || isUpgrade) return;
        const { logo_cropped_image, ...withoutLogo } = activeLobbyData;
        sessionStorage.setItem('reuneo_plan_lobbyData', JSON.stringify(withoutLogo));
        if (logo_cropped_image) {
            localStorage.setItem('reuneo_plan_logo', logo_cropped_image);
        }
    }, [activeLobbyData, isUpgrade]);

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
                msg += ' Your current subscription will be canceled immediately. Any remaining time will be credited towards your new plan.';
            }
            if (currentType === 'single_use' && (currentPlan.activations_remaining || 0) > 0) {
                msg += ' Any unused value will be credited towards your new plan.';
            }
        } else if (targetType === 'single_use') {
            msg = `Your attendee limit will change from ${currentPlan.attendee_limit} to ${upgradeAttendees}, and you'll receive ${qty} new activation${qty === 1 ? '' : 's'}.`;
            if ((currentPlan.activations_remaining || 0) > 0) {
                msg += ' Any unused value will be credited towards your new plan.';
            }
        } else if (targetType === 'monthly') {
            msg = 'Your current subscription will be canceled and replaced with a new one. Any remaining time on your current billing period will be credited towards your new plan.';
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
                const checkoutBody = {
                    plan_type: PLAN_KEY_MAP[planKey],
                    attendees: upgradeAttendees,
                    quantity,
                };
                if (fromActiveLobby && lobbyCode) {
                    checkoutBody.lobby_code = lobbyCode;
                }
                const res = await apiFetch('/upgrade-plan-checkout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(checkoutBody),
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

    const handleQuickUpgrade = async (attendees) => {
        if (checkoutLoadingPlan) return;
        setCheckoutLoadingPlan(`quick_${attendees}`);
        setCheckoutError(null);
        try {
            const checkoutBody = {
                plan_type: suggestionPlanType,
                attendees,
            };
            if (lobbyCode) checkoutBody.lobby_code = lobbyCode;
            const res = await apiFetch('/upgrade-plan-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(checkoutBody),
            });
            const data = await res.json();
            if (data.checkout_url) {
                window.location.href = data.checkout_url;
                return;
            }
            setCheckoutError(data.message || data.error || 'Checkout failed. Please try again.');
            setCheckoutLoadingPlan(null);
        } catch (err) {
            console.error('Quick upgrade checkout error:', err);
            setCheckoutError('Something went wrong. Please check your connection and try again.');
            setCheckoutLoadingPlan(null);
        }
    };

    const adjustQuantity = (delta) => {
        setSingleQuantity((prev) => Math.min(3, Math.max(1, prev + delta)));
    };

    const getQuantity = (planKey) => {
        if (planKey === 'single') return singleQuantity;
        return 1;
    };

    const requiresCustom = prices?.requires_custom || (activeAttendees > 200);
    const isFreeTrialOnly = activeAttendees <= 25;

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

    // Quick-upgrade suggestions for active lobby flow
    const currentLimit = currentPlan?.attendee_limit || 25;
    const suggestions = fromActiveLobby
        ? [currentLimit + 10, currentLimit + 20, currentLimit + 30].filter(n => n <= 200)
        : [];
    const suggestionPlanType = (!currentPlan || currentPlan.plan_type === 'free_trial')
        ? 'single_use'
        : currentPlan.plan_type;

    const estimateCredit = () => {
        if (!currentPlan) return 0;
        const planType = currentPlan.plan_type;
        if (planType === 'free_trial') return 0;
        if (planType === 'single_use') {
            const amountPaid = (currentPlan.amount_paid_cents || 0) / 100;
            const rem = currentPlan.activations_remaining || 0;
            const pur = currentPlan.activations_purchased || 1;
            if (lobbyState && lobbyState !== 'checkin') {
                return (pur > 0) ? ((rem + 1) / pur) * amountPaid : 0;
            }
            return (pur > 0 && rem > 0) ? (rem / pur) * amountPaid : 0;
        }
        if (planType === 'monthly') {
            const start = currentPlan.current_period_start || 0;
            const end = currentPlan.current_period_end || 0;
            const amt = currentPlan.amount || 0;
            const now = Math.floor(Date.now() / 1000);
            const len = end - start;
            return (len > 0 && amt > 0)
                ? (Math.max(0, end - now) / len) * amt : 0;
        }
        return 0;
    };

    const credit = fromActiveLobby ? estimateCredit() : 0;

    useEffect(() => {
        if (!fromActiveLobby || suggestions.length === 0) return;
        const priceField = suggestionPlanType === 'monthly' ? 'monthly_price' : 'single_use_price';
        Promise.all(
            suggestions.map(async (att) => {
                try {
                    const res = await apiFetch(`/pricing?attendees=${att}`);
                    const data = await res.json();
                    return { attendees: att, listPrice: data[priceField] || 0, requires_custom: data.requires_custom };
                } catch {
                    return { attendees: att, listPrice: 0, requires_custom: false };
                }
            })
        ).then(setSuggestionPrices);
    }, [fromActiveLobby]);

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
                        if (fromActiveLobby && lobbyCode) {
                            navigate(`/admin_lobby_view?code=${lobbyCode}`);
                        } else if (isUpgrade) {
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
                <img src="/assets/reuneo_test_14.png" alt="Reuneo Logo" className="ps-logo-image" />
                <div className="ps-nav-placeholder" />
            </nav>

            <h1 className="ps-page-title">{isUpgrade ? 'Change Plan' : 'Choose Your Plan'}</h1>

            {isUpgrade && currentPlan && (
                <div className="ps-current-plan-banner">
                    Currently on <strong>{PLAN_TYPE_LABELS[currentPlan.plan_type] || currentPlan.plan_type}</strong> with <strong>{currentPlan.attendee_limit}</strong> attendees
                </div>
            )}

            {showAllPlans && activeAttendees && (
                <div className="ps-attendee-context">
                    Pricing for{' '}
                    <span className="ps-attendee-inline-editor">
                        <button
                            className="ps-attendee-arrow"
                            onClick={() => {
                                const current = (isEditingAttendees && draftAttendees !== '') ? draftAttendees : activeAttendees;
                                if (current < 200) {
                                    if (!isEditingAttendees) setIsEditingAttendees(true);
                                    setDraftAttendees(current + 1);
                                }
                            }}
                            aria-label="Increase attendees"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
                        </button>
                        <input
                            className="ps-attendee-count"
                            type="text"
                            inputMode="numeric"
                            value={isEditingAttendees ? draftAttendees : activeAttendees}
                            onChange={(e) => {
                                const raw = e.target.value.replace(/\D/g, '');
                                if (!isEditingAttendees) setIsEditingAttendees(true);
                                if (raw === '') {
                                    setDraftAttendees('');
                                    return;
                                }
                                setDraftAttendees(Math.max(1, parseInt(raw, 10)));
                            }}
                            onBlur={() => {
                                if (isEditingAttendees && (draftAttendees === '' || draftAttendees < 1)) {
                                    setIsEditingAttendees(false);
                                    setDraftAttendees(null);
                                }
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && isEditingAttendees && draftAttendees !== '' && draftAttendees >= 1) {
                                    e.target.blur();
                                    document.querySelector('.ps-attendee-apply')?.click();
                                }
                            }}
                        />
                        <button
                            className="ps-attendee-arrow"
                            onClick={() => {
                                const current = (isEditingAttendees && draftAttendees !== '') ? draftAttendees : activeAttendees;
                                if (current > 1) {
                                    if (!isEditingAttendees) setIsEditingAttendees(true);
                                    setDraftAttendees(current - 1);
                                }
                            }}
                            aria-label="Decrease attendees"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                        </button>
                    </span>
                    {' '}attendee{(isEditingAttendees && draftAttendees !== '' ? draftAttendees : activeAttendees) === 1 ? '' : 's'}
                    {isEditingAttendees && (
                        <span className="ps-attendee-apply-wrapper">
                            <button
                                className="ps-attendee-apply"
                                disabled={draftAttendees === '' || draftAttendees < 1}
                                onClick={() => {
                                    if (isUpgrade) {
                                        setUpgradeAttendees(draftAttendees);
                                    } else {
                                        const updated = { ...activeLobbyData, attendees: draftAttendees };
                                        setActiveLobbyData(updated);
                                        const { logo_cropped_image, ...withoutLogo } = updated;
                                        sessionStorage.setItem('reuneo_plan_lobbyData', JSON.stringify(withoutLogo));
                                    }
                                    setIsEditingAttendees(false);
                                    setDraftAttendees(null);
                                    setIsRefreshing(true);
                                    fetchPrices(draftAttendees);
                                }}
                            >
                                Apply
                            </button>
                        </span>
                    )}
                </div>
            )}

            {fromActiveLobby && suggestions.length > 0 && suggestionPrices.length > 0 && (
                <div className="ps-quick-upgrade-section">
                    <h2 className="ps-quick-upgrade-title">Quick Upgrade</h2>
                    <div className="ps-quick-upgrade-cards">
                        {suggestionPrices.filter(s => !s.requires_custom && s.listPrice > 0).map((s) => {
                            const creditCapped = Math.min(credit, s.listPrice - 1);
                            const youPay = Math.max(Math.ceil(s.listPrice - creditCapped), 1);
                            const hasDiscount = youPay < s.listPrice;
                            const isCardLoading = checkoutLoadingPlan === `quick_${s.attendees}`;

                            return (
                                <div key={s.attendees} className="ps-quick-card">
                                    <div className="ps-quick-card-attendees">{s.attendees} attendees</div>
                                    <div className="ps-quick-card-price">
                                        {hasDiscount && (
                                            <span className="ps-quick-card-original">${s.listPrice}</span>
                                        )}
                                        <span className="ps-quick-card-amount">${youPay}</span>
                                    </div>
                                    <div className="ps-quick-card-type">
                                        {PLAN_TYPE_LABELS[suggestionPlanType]}
                                    </div>
                                    <button
                                        className={`ps-quick-card-cta ${isCardLoading ? 'ps-cta-loading' : ''}`}
                                        disabled={!!checkoutLoadingPlan}
                                        onClick={() => handleQuickUpgrade(s.attendees)}
                                    >
                                        {isCardLoading ? 'Processing...' : 'Upgrade'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                    {credit > 0 && (
                        <p className="ps-quick-upgrade-disclaimer">
                            Estimated after plan credit. Final amount confirmed at checkout.
                        </p>
                    )}
                    <button
                        className="ps-quick-upgrade-viewall"
                        onClick={() => setShowAllPlans((v) => !v)}
                    >
                        {showAllPlans ? 'Hide all plans' : 'View all plans'}
                    </button>
                </div>
            )}

            {fromActiveLobby && suggestions.length === 0 && (
                <div className="ps-quick-upgrade-section">
                    <p className="ps-quick-upgrade-disclaimer" style={{ textAlign: 'center' }}>
                        You're at the maximum plan size. <a href="https://calendly.com/julian-reuneo/30min" target="_blank" rel="noopener noreferrer">Contact us</a> for a custom plan.
                    </p>
                </div>
            )}

            {showAllPlans && !isUpgrade && (
                <button
                    className={`ps-free-trial ${checkoutLoadingPlan === 'free_trial' ? 'ps-cta-loading' : ''} ${isFreeTrialOnly ? 'ps-free-trial-highlighted' : ''}`}
                    onClick={() => handleCheckout('free_trial')}
                    disabled={!!checkoutLoadingPlan}
                >
                    <span className="ps-free-trial-dot" />
                    <span className="ps-free-trial-label">
                        {checkoutLoadingPlan === 'free_trial' ? 'Processing...' : 'Free Trial Plan'}
                    </span>
                    <span className="ps-free-trial-details">
                        <span className="ps-free-trial-attendees">25 attendees</span>
                        <span className="ps-free-trial-divider" />
                        <span className="ps-free-trial-per-use">3 uses per month</span>
                    </span>
                </button>
            )}

            {checkoutError && (
                <div className="ps-error-banner">
                    {checkoutError}
                    <button className="ps-error-dismiss" onClick={() => setCheckoutError(null)}>&times;</button>
                </div>
            )}

            {showAllPlans && (
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
                                    plan.recommended ? 'ps-column-recommended' : '',
                                    plan.key === 'single' ? 'ps-column-secondary' : '',
                                    isDisabled ? 'ps-column-disabled' : '',
                                    isHighlighted ? 'ps-column-highlighted' : '',
                                ].filter(Boolean).join(' ')}
                            >
                                {isCurrent && (
                                    <div className="ps-current-badge">Current Plan</div>
                                )}
                                <div className="ps-column-title">
                                    {plan.badge && <div className="ps-column-badge">{plan.badge}</div>}
                                    {plan.title}
                                </div>
                                {plan.subtitle && <div className="ps-column-subtitle">{plan.subtitle}</div>}

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
                                            onClick={() => adjustQuantity(-1)}
                                            disabled={isDisabled || !!checkoutLoadingPlan || qty <= 1}
                                        >
                                            &minus;
                                        </button>
                                        <span className="ps-qty-value">{qty}</span>
                                        <button
                                            className="ps-qty-btn"
                                            onClick={() => adjustQuantity(1)}
                                            disabled={isDisabled || !!checkoutLoadingPlan || qty >= 3}
                                        >
                                            +
                                        </button>
                                    </div>
                                )}

                                {isDisabled && (
                                    <div className="ps-attendee-cap">200 attendee max</div>
                                )}

                                <ul className="ps-plan-details">
                                    {plan.getDetails(qty, activeAttendees).map((item, i) => (
                                        <li key={i} className={item.included ? 'ps-detail-included' : 'ps-detail-excluded'}>
                                            {item.text}
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    className={`ps-cta${plan.key === 'single' ? ' ps-cta-secondary' : ''} ${isDisabled ? 'ps-cta-disabled' : ''} ${isThisPlanLoading ? 'ps-cta-loading' : ''}`}
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
            )}

            {showAllPlans && !isLoading && (
                <div className="ps-compare-section">
                    <h2 className="ps-compare-title">Compare Plans</h2>
                    <div className="ps-compare-table-wrapper">
                        <table className="ps-compare-table">
                            <thead>
                                <tr>
                                    <th></th>
                                    <th>One-Time</th>
                                    <th className="ps-compare-highlight">Monthly</th>
                                    <th>Custom</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Attendees per session</td>
                                    <td>Up to {activeAttendees}</td>
                                    <td className="ps-compare-highlight">Up to {activeAttendees}</td>
                                    <td>Custom</td>
                                </tr>
                                <tr>
                                    <td>Activations</td>
                                    <td>{singleQuantity} per purchase</td>
                                    <td className="ps-compare-highlight">3/month</td>
                                    <td>Custom</td>
                                </tr>
                                <tr>
                                    <td>Interest &amp; Random pairing</td>
                                    <td><span className="ps-compare-check">✓</span></td>
                                    <td className="ps-compare-highlight"><span className="ps-compare-check">✓</span></td>
                                    <td><span className="ps-compare-check">✓</span></td>
                                </tr>
                                <tr>
                                    <td>Sponsor logo</td>
                                    <td><span className="ps-compare-check">✓</span></td>
                                    <td className="ps-compare-highlight"><span className="ps-compare-check">✓</span></td>
                                    <td><span className="ps-compare-check">✓</span></td>
                                </tr>
                                <tr>
                                    <td>Match history for follow-ups</td>
                                    <td><span className="ps-compare-check">✓</span></td>
                                    <td className="ps-compare-highlight"><span className="ps-compare-check">✓</span></td>
                                    <td><span className="ps-compare-check">✓</span></td>
                                </tr>
                                <tr>
                                    <td>Attendee analytics</td>
                                    <td><span className="ps-compare-x">—</span></td>
                                    <td className="ps-compare-highlight"><span className="ps-compare-check">✓</span></td>
                                    <td><span className="ps-compare-check">✓</span></td>
                                </tr>
                                <tr>
                                    <td>Discounted upgrades</td>
                                    <td><span className="ps-compare-x">—</span></td>
                                    <td className="ps-compare-highlight"><span className="ps-compare-check">✓</span></td>
                                    <td><span className="ps-compare-check">✓</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

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
                                Edit
                            </button>
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
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlanSelection;
