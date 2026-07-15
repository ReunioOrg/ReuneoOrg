import React, { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './new_organizer.css';
import { apiFetch } from '../utils/api';
import { AuthContext } from '../Auth/AuthContext';
import FloatingLinesBackground from './FloatingLinesBackground';
import TutorialMatching from '../Tutorials/tutorial-matching';
import CoolerGeneralMatchEventFlow from '../Tutorials/cooler_general_match_event_flow';

const PLACEHOLDER_ANIMATION_TAGS = ['Content Creator', 'Plumber', 'Investor', 'Capricorn'];

const EVENT_DESCRIPTION_EXAMPLES = [
    'A speed friending event for fitness enthusiasts',
    'An icebreaker for apartment residents',
    'Speed dating for math nerds',
    'A mixer for construction workers and contractors',
    'Team building at a work event',
];

const DESCRIPTION_EXAMPLE_INTERVAL_MS = 4000;
const DESCRIPTION_EXAMPLE_FADE_MS = 180;

const DEMO_LOBBY_DEFAULTS = {
    attendees: 25,
    minutes: '5',
    seconds: '0',
    show_table_numbers: true,
    enable_match_history: false,
};

const NewOrganizerView = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { permissions, isLegacyOrganizer, checkAuth } = useContext(AuthContext);
    const returnData = location.state?.returnData;
    const fromTutorial = location.state?.fromTutorial;
    const fromSpeedFriending = location.state?.fromSpeedFriending;
    const fromResidential = location.state?.fromResidential;

    // ── Step Navigation (user-facing: step 3 interest pairing → step 5 account) ──
    const [currentStep, setCurrentStep] = useState(returnData ? 5 : 3);
    const [visitedSteps, setVisitedSteps] = useState(returnData ? new Set([3, 5]) : new Set([3]));
    const [navDirection, setNavDirection] = useState('forward');
    const [step3View, setStep3View] = useState(
        returnData?.selected_tab === 'custom' ? 'tags' : 'description'
    );

    // ── Form Data ──
    const [lobbyCode, setLobbyCode] = useState(returnData?.lobby_code || '');
    const [selectedTab, setSelectedTab] = useState(returnData?.selected_tab || 'icebreaker');
    const [customTags, setCustomTags] = useState(returnData?.custom_tags || []);
    const [tagInput, setTagInput] = useState('');
    const [organizerName, setOrganizerName] = useState('');
    const [email, setEmail] = useState(returnData?.email || '');
    const [showEmailConfirmModal, setShowEmailConfirmModal] = useState(false);

    // ── AI Tag Generation ──
    const [aiDescription, setAiDescription] = useState('');
    const [isGeneratingTags, setIsGeneratingTags] = useState(false);
    const [tagsFromAI, setTagsFromAI] = useState(false);

    // ── UI State ──
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showTutorial, setShowTutorial] = useState(false);
    const [showGeneralTutorial, setShowGeneralTutorial] = useState(false);
    const [descriptionExampleIndex, setDescriptionExampleIndex] = useState(0);
    const [descriptionExampleVisible, setDescriptionExampleVisible] = useState(true);
    const [standardPairingNote, setStandardPairingNote] = useState(false);

    const isSubmittingRef = useRef(false);
    const generalTutorialTriggeredRef = useRef(false);
    const descriptionTextareaRef = useRef(null);

    const adjustDescriptionHeight = () => {
        const el = descriptionTextareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        const maxHeight = 160;
        const nextHeight = Math.min(el.scrollHeight, maxHeight);
        el.style.height = `${nextHeight}px`;
        el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
    };

    useEffect(() => {
        if (permissions === 'organizer' && !isLegacyOrganizer && !isSubmittingRef.current) {
            navigate('/organizer-account-details');
        }
    }, [permissions, isLegacyOrganizer, navigate]);

    // ── Initialization ──
    useEffect(() => {
        window.scrollTo(0, 0);
        if (!returnData) {
            const randomCode = Array.from({ length: 6 }, () =>
                'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]
            ).join('');
            setLobbyCode(randomCode);
        }
    }, [returnData]);

    useEffect(() => {
        if (currentStep === 3 && step3View === 'description') {
            adjustDescriptionHeight();
        }
    }, [aiDescription, currentStep, step3View]);

    useEffect(() => {
        const onDescriptionStep = currentStep === 3 && step3View === 'description';
        if (!onDescriptionStep || aiDescription.trim() || isGeneratingTags) {
            setDescriptionExampleVisible(true);
            return undefined;
        }

        let fadeTimeout;

        const timer = setInterval(() => {
            setDescriptionExampleVisible(false);
            fadeTimeout = setTimeout(() => {
                setDescriptionExampleIndex((prev) => (prev + 1) % EVENT_DESCRIPTION_EXAMPLES.length);
                setDescriptionExampleVisible(true);
            }, DESCRIPTION_EXAMPLE_FADE_MS);
        }, DESCRIPTION_EXAMPLE_INTERVAL_MS);

        return () => {
            clearInterval(timer);
            clearTimeout(fadeTimeout);
        };
    }, [aiDescription, currentStep, step3View, isGeneratingTags]);

    const shouldAutoShowGeneralTutorial = () =>
        !returnData &&
        !fromTutorial &&
        !fromSpeedFriending &&
        !fromResidential &&
        permissions !== 'admin' &&
        permissions !== 'organizer' &&
        !isLegacyOrganizer;

    const triggerGeneralTutorialIfEligible = () => {
        if (generalTutorialTriggeredRef.current) return;
        if (shouldAutoShowGeneralTutorial()) {
            generalTutorialTriggeredRef.current = true;
            setShowGeneralTutorial(true);
        }
    };

    // Lock body scroll while the confirmation modal is open
    useEffect(() => {
        if (showEmailConfirmModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [showEmailConfirmModal]);

    const handleTutorialComplete = () => {
        setShowTutorial(false);
    };

    const handleGeneralTutorialComplete = () => {
        setShowGeneralTutorial(false);
    };

    const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

    const handleEmailChange = (e) => {
        setEmail(e.target.value);
    };

    // ── Navigation ──
    const goToStep = (step, direction) => {
        setNavDirection(direction);
        setCurrentStep(step);
        window.scrollTo(0, 0);
    };

    const handleBack = () => {
        if (currentStep === 5) {
            setNavDirection('back');
            setStep3View('tags');
            goToStep(3, 'back');
        } else if (currentStep === 3) {
            if (step3View === 'tags') {
                setNavDirection('back');
                setStep3View('description');
            } else {
                navigate('/');
            }
        }
    };

    const handleNext = () => {
        if (currentStep >= 5 || !visitedSteps.has(currentStep + 1)) return;
        goToStep(currentStep + 1, 'forward');
    };

    // ── Step 3: Interest Pairing ──
    const advanceToSignup = () => {
        setVisitedSteps(prev => new Set([...prev, 5]));
        setNavDirection('forward');
        goToStep(5, 'forward');
        triggerGeneralTutorialIfEligible();
    };

    const applyIcebreakerPairing = (showFallbackNote = false) => {
        setSelectedTab('icebreaker');
        setCustomTags([]);
        setTagsFromAI(false);
        setTagInput('');
        setStandardPairingNote(showFallbackNote);
    };

    const applyCustomPairingFromTags = (tags) => {
        setStandardPairingNote(false);
        if (tags.length >= 2) {
            setSelectedTab('custom');
            setCustomTags(tags);
            setTagsFromAI(true);
        } else {
            applyIcebreakerPairing(false);
        }
    };

    const handleDescriptionContinueEmpty = () => {
        setError('');
        applyIcebreakerPairing(false);
        advanceToSignup();
    };

    const handleStep3Skip = () => {
        applyIcebreakerPairing(false);
        advanceToSignup();
    };

    const handleStep3Continue = () => {
        setSelectedTab('custom');
        setStandardPairingNote(false);
        advanceToSignup();
    };

    // ── Tags ──
    const handleAddTag = () => {
        if (tagInput.includes(',')) {
            const potentialTags = tagInput.split(',').map(tag =>
                tag.startsWith(' ') ? tag.substring(1) : tag
            );
            const newTags = [];
            potentialTags.forEach(tag => {
                const trimmedTag = tag.trim();
                if (trimmedTag && !customTags.includes(trimmedTag) && !newTags.includes(trimmedTag)) {
                    newTags.push(trimmedTag);
                }
            });
            if (newTags.length > 0) setCustomTags([...customTags, ...newTags]);
            setTagInput('');
        } else {
            if (tagInput.trim() && !customTags.includes(tagInput.trim())) {
                setCustomTags([...customTags, tagInput.trim()]);
                setTagInput('');
            }
        }
    };

    const handleRemoveTag = (tagToRemove) => {
        setCustomTags(customTags.filter(tag => tag !== tagToRemove));
    };

    const handleTagKeyDown = (e) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            handleAddTag();
        }
    };

    // ── AI Tag Generation ──
    const handleGenerateTags = async () => {
        const description = aiDescription.trim();
        if (!description) return;

        setIsGeneratingTags(true);
        setError('');

        try {
            const endpoint = (permissions === 'admin' || permissions === 'organizer') ? '/generate_tags' : '/generate_tags_public';
            const response = await apiFetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description })
            });

            const data = await response.json();

            if (data.status === 'success' && data.tags) {
                const tags = Array.isArray(data.tags) ? data.tags : [];
                applyCustomPairingFromTags(tags);
                advanceToSignup();
            } else {
                applyIcebreakerPairing(true);
                advanceToSignup();
            }
        } catch (err) {
            console.error('Error generating tags:', err);
            applyIcebreakerPairing(true);
            advanceToSignup();
        } finally {
            setIsGeneratingTags(false);
        }
    };

    const handleRegenerate = () => {
        setNavDirection('back');
        setStep3View('description');
        setCustomTags([]);
        setTagsFromAI(false);
    };

    // ── Submit — create free trial account directly, then navigate to success ──
    const handleSubmit = async () => {
        isSubmittingRef.current = true;
        setIsLoading(true);
        setError('');

        const { attendees, minutes, seconds, show_table_numbers, enable_match_history } = DEMO_LOBBY_DEFAULTS;
        const lobbyDuration = (parseInt(minutes, 10) * 60) + parseInt(seconds, 10);

        const lobbyData = {
            lobby_code: lobbyCode,
            selected_tab: selectedTab,
            custom_tags: selectedTab === 'custom' ? customTags : [],
            lobby_duration: lobbyDuration,
            attendees,
            minutes,
            seconds,
            show_table_numbers,
            enable_match_history,
            email,
        };

        // Save lead (non-blocking, errors swallowed)
        try {
            await apiFetch('/save-organizer-lead', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    name: organizerName.trim(),
                    lobby_data: lobbyData,
                    attendees,
                }),
            });
        } catch {}

        try {
            // Rewardful affiliate referral. Persisted on the trial plan so a
            // future paid upgrade can credit the same affiliate even if the
            // visitor's cookie has since expired.
            const referral = window.Rewardful?.referral || null;
            const res = await apiFetch('/create-free-trial', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    name: organizerName.trim(),
                    lobby_data: lobbyData,
                    referral,
                }),
            });

            const data = await res.json();

            if (data.success) {
                await checkAuth();
                navigate('/plan-checkout-success', {
                    state: { freeTrial: true, email, lobbyData },
                });
            } else {
                isSubmittingRef.current = false;
                setError(data.message || 'Failed to create account. Please try again.');
                setIsLoading(false);
            }
        } catch (err) {
            console.error('Free trial creation error:', err);
            isSubmittingRef.current = false;
            setError('Something went wrong. Please check your connection and try again.');
            setIsLoading(false);
        }
    };

    // ── Inline SVG Components ──
    const ArrowRight = () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
    );

    const SparkleIcon = () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L14 8.5L21 10L14 11.5L12 18L10 11.5L3 10L10 8.5L12 2Z"/>
            <path d="M19 14L19.75 16.25L22 17L19.75 17.75L19 20L18.25 17.75L16 17L18.25 16.25L19 14Z" opacity="0.7"/>
        </svg>
    );

    const InputPersonIcon = () => (
        <svg className="signup-field-icon" width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="8" r="3.5" />
            <path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
        </svg>
    );

    const InputEmailIcon = () => (
        <svg className="signup-field-icon" width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M3 7l9 6 9-6" />
        </svg>
    );

    const TrustShieldIcon = () => (
        <svg className="signup-trust-icon" width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3l7 3v6c0 4.5-3.1 7.4-7 9-3.9-1.6-7-4.5-7-9V6l7-3z" />
            <path d="M9 12l2 2 4-4" />
        </svg>
    );

    const TrustLockIcon = () => (
        <svg className="signup-trust-icon" width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
    );

    // ── Render: Step 3 — Interest Pairing ──
    const renderStep3 = () => {
        if (step3View === 'description') {
            return (
                <div className="step-container step-container-prompt">
                    <h1 className="step-title step-title-prompt">Tell us about your ideal event.</h1>
                    <div className="event-prompt-card">
                        <div className="event-prompt-card-body">
                            <p className="event-prompt-card-label">
                                Who&apos;s coming?
                                <br />
                                What&apos;s the goal?
                            </p>
                            <div className="event-prompt-textarea-wrap">
                                {!aiDescription && (
                                    <span
                                        className={`event-prompt-example${descriptionExampleVisible ? '' : ' event-prompt-example-fade-out'}`}
                                        aria-hidden="true"
                                    >
                                        {EVENT_DESCRIPTION_EXAMPLES[descriptionExampleIndex]}
                                    </span>
                                )}
                                <textarea
                                    ref={descriptionTextareaRef}
                                    value={aiDescription}
                                    onChange={(e) => {
                                        if (e.target.value.length <= 500) {
                                            setAiDescription(e.target.value);
                                            requestAnimationFrame(adjustDescriptionHeight);
                                        }
                                    }}
                                    placeholder=""
                                    className="event-prompt-textarea"
                                    rows={2}
                                    maxLength={500}
                                    autoComplete="off"
                                    disabled={isGeneratingTags}
                                />
                            </div>
                            <p className="event-prompt-card-hint">
                                Reuneo handles the rotations, timing, pairing, and more.
                            </p>
                            {error && <div className="error-message event-prompt-error">{error}</div>}
                        </div>
                        <div className="event-prompt-card-footer">
                            <button
                                type="button"
                                className="step-cta event-prompt-continue"
                                onClick={aiDescription.trim().length >= 2 ? handleGenerateTags : handleDescriptionContinueEmpty}
                                disabled={isGeneratingTags}
                            >
                                {isGeneratingTags ? (
                                    <>
                                        <div className="button-spinner event-prompt-spinner" />
                                        Continuing...
                                    </>
                                ) : (
                                    <>Continue <ArrowRight /></>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="step-container">
                <p className="step-subtitle" style={{ fontWeight: 600, fontStyle: 'normal' }}>Add or edit the matching categories for your event</p>
                <TutorialMatching
                    mode="inline"
                    isVisible={currentStep === 3 && step3View === 'tags'}
                    tags={customTags.length >= 2 ? customTags.slice(0, 4) : PLACEHOLDER_ANIMATION_TAGS}
                />
                <div className="custom-matching-section">
                    <div className="tag-input-container">
                        <input
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={handleTagKeyDown}
                            placeholder="Add categories (press + to add)"
                            className="form-input"
                            autoComplete="off"
                        />
                        <button type="button" onClick={handleAddTag} className="tag-add-button">+</button>
                    </div>
                    {customTags.length > 0 && (
                        <div className="tag-list">
                            {customTags.map((tag, index) => (
                                <div key={index} className="tag-item">
                                    {tag}
                                    <button type="button" onClick={() => handleRemoveTag(tag)}
                                        className="tag-remove-button">×</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                {tagsFromAI && (
                    <button type="button" className="regenerate-button" onClick={handleRegenerate}>
                        <SparkleIcon /> Regenerate
                    </button>
                )}
                {customTags.length === 0 && (
                    <button className="step-cta step-cta-secondary" onClick={handleStep3Skip}>
                        Skip <ArrowRight />
                    </button>
                )}
                {customTags.length === 1 && (
                    <>
                        <button className="step-cta step-cta-secondary" disabled>
                            Continue <ArrowRight />
                        </button>
                        <p style={{ fontSize: '0.8rem', color: '#888', textAlign: 'center', marginTop: '8px' }}>
                            Add at least 2 categories to enable interest matching
                        </p>
                    </>
                )}
                {customTags.length >= 2 && (
                    <button className="step-cta" onClick={handleStep3Continue}>
                        Continue <ArrowRight />
                    </button>
                )}
            </div>
        );
    };

    // ── Render: Step 5 — Get Started ──
    const renderStep5 = () => (
        <div className="step-container step-container-signup">
            <h1 className="step-title step-title-prompt">Create your free organizer account.</h1>

            {standardPairingNote && (
                <p className="signup-pairing-note">Using standard pairing.</p>
            )}

            <div className="signup-form-card">
                <div className="signup-form-card-body">
                    <div className="signup-field">
                        <label htmlFor="organizer-name">Name</label>
                        <div className="signup-input-wrap">
                            <InputPersonIcon />
                            <input
                                id="organizer-name"
                                type="text"
                                value={organizerName}
                                onChange={(e) => setOrganizerName(e.target.value)}
                                placeholder="Your name"
                                autoComplete="name"
                            />
                        </div>
                    </div>
                    <div className="signup-field">
                        <label htmlFor="organizer-email">Email</label>
                        <div className="signup-input-wrap">
                            <InputEmailIcon />
                            <input
                                id="organizer-email"
                                type="email"
                                value={email}
                                onChange={handleEmailChange}
                                placeholder="you@company.com"
                                autoComplete="email"
                            />
                        </div>
                    </div>
                    {error && <div className="error-message signup-form-error">{error}</div>}
                </div>
                <div className="signup-form-card-footer">
                    <button
                        type="button"
                        className="step-cta signup-create-cta"
                        onClick={() => setShowEmailConfirmModal(true)}
                        disabled={isLoading || !organizerName.trim() || !isValidEmail(email)}
                    >
                        {isLoading ? 'Creating...' : 'Create account'}
                        {!isLoading && <SparkleIcon />}
                    </button>
                </div>
            </div>

            <ul className="signup-trust-list">
                <li className="signup-trust-item">
                    <TrustShieldIcon />
                    <span>Free to try. No credit card required.</span>
                </li>
                <li className="signup-trust-item">
                    <TrustLockIcon />
                    <span>Your information is secure.</span>
                </li>
            </ul>
        </div>
    );

    // ── Main Render ──
    const stepKey = currentStep === 3 ? `3-${step3View}` : String(currentStep);
    const isDescriptionStep = currentStep === 3 && step3View === 'description';
    const isSignupStep = currentStep === 5;

    return (
        <div className="new-organizer-background">
            <FloatingLinesBackground />

            {/* Navigation Bar */}
            <div className={`step-nav-bar${isDescriptionStep ? ' step-nav-bar-prompt' : ''}`}>
                <button className="nav-arrow" onClick={handleBack} aria-label="Back">
                    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                        <circle cx="18" cy="18" r="17" stroke="#374151" strokeWidth="1.5" fill="rgba(255,255,255,0.8)"/>
                        <path d="M21 12L15 18L21 24" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
                <img src="/assets/reuneo_test_14.png" alt="Reuneo Logo" className="logo-image-nav" />
                {!isDescriptionStep && currentStep < 5 && visitedSteps.has(currentStep + 1) ? (
                    <button className="nav-arrow" onClick={handleNext} aria-label="Next">
                        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                            <circle cx="18" cy="18" r="17" stroke="#374151" strokeWidth="1.5" fill="rgba(255,255,255,0.8)"/>
                            <path d="M15 12L21 18L15 24" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </button>
                ) : (
                    <div className="nav-arrow-placeholder" />
                )}
            </div>

            {/* Step Content */}
            <div className={`step-content-wrapper${
                isDescriptionStep ? ' step-content-wrapper-prompt' : ''
            }${isSignupStep ? ' step-content-wrapper-signup' : ''}`}>
                <div key={stepKey} className={`step-content step-${navDirection}`}>
                    {currentStep === 3 && renderStep3()}
                    {currentStep === 5 && renderStep5()}
                </div>
            </div>

            <TutorialMatching
                isVisible={showTutorial}
                onComplete={handleTutorialComplete}
            />
            {showGeneralTutorial && (
                <CoolerGeneralMatchEventFlow
                    isVisible
                    onComplete={handleGeneralTutorialComplete}
                    variant="organizer"
                    loadingFooterMessage="Preparing your lobby..."
                    tags={customTags.length >= 2 ? customTags : undefined}
                />
            )}

            {/* ── Email Confirmation Modal ── */}
            {showEmailConfirmModal && (
                <div className="email-confirm-overlay" onClick={() => setShowEmailConfirmModal(false)}>
                    <div className="email-confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <h3 className="email-confirm-title">Confirm your email</h3>
                        <p className="email-confirm-message">
                            This email will be used to authenticate your organizer access.
                            Make sure it&apos;s correct — you won&apos;t be able to change it later.
                        </p>
                        <div className="email-confirm-display">{email}</div>
                        <div className="email-confirm-buttons">
                            <button
                                className="email-confirm-cancel"
                                onClick={() => setShowEmailConfirmModal(false)}
                                disabled={isLoading}
                            >
                                Edit
                            </button>
                            <button
                                className="email-confirm-proceed"
                                onClick={() => { setShowEmailConfirmModal(false); handleSubmit(); }}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Creating...' : 'Confirm & Create'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NewOrganizerView;
