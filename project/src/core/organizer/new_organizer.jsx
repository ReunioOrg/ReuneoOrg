import React, { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './new_organizer.css';
import { apiFetch } from '../utils/api';
import { AuthContext } from '../Auth/AuthContext';
import FloatingLinesBackground from './FloatingLinesBackground';
import TutorialMatching from '../Tutorials/tutorial-matching';
import CoolerGeneralMatchEventFlow from '../Tutorials/cooler_general_match_event_flow';

const PLACEHOLDER_ANIMATION_TAGS = ['Content Creator', 'Plumber', 'Investor', 'Capricorn'];

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

    const isSubmittingRef = useRef(false);

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
        if (
            !returnData &&
            !fromTutorial &&
            !fromSpeedFriending &&
            !fromResidential &&
            permissions !== 'admin' &&
            permissions !== 'organizer' &&
            !isLegacyOrganizer
        ) {
            setShowGeneralTutorial(true);
        }
    }, [returnData, fromTutorial, fromSpeedFriending, fromResidential, permissions, isLegacyOrganizer]);

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
    const handleGoToTagsEmpty = () => {
        setError('');
        setNavDirection('forward');
        setStep3View('tags');
    };

    const handleStep3Skip = () => {
        setSelectedTab('icebreaker');
        setCustomTags([]);
        setTagInput('');
        setVisitedSteps(prev => new Set([...prev, 5]));
        goToStep(5, 'forward');
    };

    const handleStep3Continue = () => {
        setSelectedTab('custom');
        setVisitedSteps(prev => new Set([...prev, 5]));
        goToStep(5, 'forward');
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
                setCustomTags(data.tags);
                setTagsFromAI(true);
                setNavDirection('forward');
                setStep3View('tags');
            } else {
                setError(data.message || 'Failed to generate categories.');
            }
        } catch (err) {
            console.error('Error generating tags:', err);
            setError('Failed to generate categories. Try again or enter tags manually separated by commas.');
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

    // ── Render: Step 3 — Interest Pairing ──
    const renderStep3 = () => {
        if (step3View === 'description') {
            return (
                <div className="step-container">
                    <h1 className="step-title">Describe the people and purpose of your event</h1>
                    <div className="description-input-container">
                        <textarea
                            value={aiDescription}
                            onChange={(e) => {
                                if (e.target.value.length <= 500) setAiDescription(e.target.value);
                            }}
                            placeholder="ex: A networking mixer for content creators and local construction companies"
                            className="form-input description-textarea"
                            rows={3}
                            maxLength={500}
                            autoComplete="off"
                            disabled={isGeneratingTags}
                        />
                        <button
                            type="button"
                            onClick={handleGenerateTags}
                            className="sparkle-submit-button"
                            disabled={isGeneratingTags || !aiDescription.trim()}
                        >
                            {isGeneratingTags ? (
                                <div className="button-spinner" />
                            ) : (
                                <SparkleIcon />
                            )}
                        </button>
                    </div>
                    {aiDescription.length > 0 && (
                        <div className="char-counter">{aiDescription.length}/500</div>
                    )}
                    {error && <div className="error-message">{error}</div>}
                    <button className={`step-cta ${aiDescription.trim().split(/\s+/).filter(Boolean).length <= 1 ? 'step-cta-secondary' : ''}`}
                        onClick={aiDescription.trim().length >= 2 ? handleGenerateTags : handleGoToTagsEmpty}
                        disabled={isGeneratingTags}>
                        Continue <ArrowRight />
                    </button>
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
        <div className="step-container review-step">
            <h1 className="step-title">Get Started for Free</h1>

            {error && <div className="error-message">{error}</div>}

            <input
                type="text"
                value={organizerName}
                onChange={(e) => setOrganizerName(e.target.value)}
                placeholder="Name"
                className="form-input name-input"
                autoComplete="name"
            />

            <div className="create-row">
                <input
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="Email"
                    className="form-input email-input"
                    autoComplete="email"
                />
                <button className="step-cta create-cta" onClick={() => setShowEmailConfirmModal(true)}
                    disabled={isLoading || !organizerName.trim() || !isValidEmail(email)}>
                    {isLoading ? 'Creating...' : 'Create'}
                    {!isLoading && <SparkleIcon />}
                </button>
            </div>
        </div>
    );

    // ── Main Render ──
    const stepKey = currentStep === 3 ? `3-${step3View}` : String(currentStep);
    const showExistingAccountLink = currentStep === 3 && step3View === 'description';

    return (
        <div className="new-organizer-background">
            <FloatingLinesBackground />

            {/* Navigation Bar */}
            <div className="step-nav-bar">
                <button className="nav-arrow" onClick={handleBack} aria-label="Back">
                    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                        <circle cx="18" cy="18" r="17" stroke="#374151" strokeWidth="1.5" fill="rgba(255,255,255,0.8)"/>
                        <path d="M21 12L15 18L21 24" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
                <img src="/assets/reuneo_test_14.png" alt="Reuneo Logo" className="logo-image-nav" />
                {currentStep < 5 && visitedSteps.has(currentStep + 1) ? (
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

            {showExistingAccountLink && (
                <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="existing-organizer-button step1-fade-link"
                >
                    I have an account
                </button>
            )}

            {/* Step Content */}
            <div className="step-content-wrapper">
                <div key={stepKey} className={`step-content step-${navDirection}`}>
                    {currentStep === 3 && renderStep3()}
                    {currentStep === 5 && renderStep5()}
                </div>
            </div>

            <TutorialMatching
                isVisible={showTutorial}
                onComplete={handleTutorialComplete}
            />
            <CoolerGeneralMatchEventFlow
                isVisible={showGeneralTutorial}
                onComplete={handleGeneralTutorialComplete}
            />

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
