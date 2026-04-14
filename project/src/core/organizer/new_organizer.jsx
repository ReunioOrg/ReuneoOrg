import React, { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './new_organizer.css';
import { apiFetch } from '../utils/api';
import { AuthContext } from '../Auth/AuthContext';
import FloatingLinesBackground from './FloatingLinesBackground';
import AttendeesHistoryTutorial from '../Tutorials/attendees_history_tutorial';
import TutorialMatching from '../Tutorials/tutorial-matching';
import CoolerGeneralMatchEventFlow from '../Tutorials/cooler_general_match_event_flow';
import TutorialAttendeesPhone from '../Tutorials/tutorial-attendees-phone';
import RoundDurationTutorial from '../Tutorials/round_duration_tutorial';

const NewOrganizerView = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, permissions, isLegacyOrganizer, checkAuth } = useContext(AuthContext);
    const returnData = location.state?.returnData;

    // ── Step Navigation ──
    const [currentStep, setCurrentStep] = useState(returnData ? 5 : 1);
    const [visitedSteps, setVisitedSteps] = useState(returnData ? new Set([1,2,3,4,5]) : new Set([1]));
    const [navDirection, setNavDirection] = useState('forward');
    const [step3View, setStep3View] = useState(
        returnData?.selected_tab === 'custom' ? 'tags' : 'prompt'
    );

    // ── Form Data ──
    const [lobbyCode, setLobbyCode] = useState(returnData?.lobby_code || '');
    const [selectedTab, setSelectedTab] = useState(returnData?.selected_tab || 'icebreaker');
    const [customTags, setCustomTags] = useState(returnData?.custom_tags || []);
    const [tagInput, setTagInput] = useState('');
    const [attendees, setAttendees] = useState(returnData?.attendees != null ? String(returnData.attendees) : '');
    const [minutes, setMinutes] = useState(returnData?.minutes || '5');
    const [seconds, setSeconds] = useState(returnData?.seconds || '0');
    const [showTableNumbers, setShowTableNumbers] = useState(returnData?.show_table_numbers ?? false);
    const [enableMatchHistory, setEnableMatchHistory] = useState(returnData?.enable_match_history ?? true);
    const [email, setEmail] = useState(returnData?.email || '');
    const [showEmailToast, setShowEmailToast] = useState(false);

    // ── AI Tag Generation ──
    const [aiDescription, setAiDescription] = useState('');
    const [isGeneratingTags, setIsGeneratingTags] = useState(false);
    const [tagsFromAI, setTagsFromAI] = useState(false);
    const [animationTags, setAnimationTags] = useState([]);

    // ── UI State ──
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showTutorial, setShowTutorial] = useState(false);
    const [showGeneralTutorial, setShowGeneralTutorial] = useState(false);

    const MaxMinutes = 8;
    const toastTimerRef = useRef(null);
    const hasShownEmailToast = useRef(false);

    useEffect(() => {
        if (permissions === 'organizer' && !isLegacyOrganizer) {
            navigate('/organizer-account-details');
        }
    }, [permissions, isLegacyOrganizer]);

    // ── Initialization ──
    useEffect(() => {
        window.scrollTo(0, 0);
        if (!returnData) {
            const randomCode = Array.from({ length: 6 }, () =>
                'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]
            ).join('');
            setLobbyCode(randomCode);
        }
    }, []);

    useEffect(() => {
        return () => {
            if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        };
    }, []);

    useEffect(() => {
        if (
            !returnData &&
            permissions !== 'admin' &&
            permissions !== 'organizer' &&
            !isLegacyOrganizer
        ) {
            setShowGeneralTutorial(true);
        }
    }, []);

    const handleTutorialComplete = () => {
        setShowTutorial(false);
    };

    const handleGeneralTutorialComplete = () => {
        setShowGeneralTutorial(false);
    };

    // ── Helpers ──
    const getRecommendedMinutes = () => {
        const num = parseInt(attendees) || 0;
        if (num <= 30) return 5;
        if (num <= 65) return 6;
        return 7;
    };

    const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

    const handleEmailChange = (e) => {
        const value = e.target.value;
        setEmail(value);
        if (value.length > 0 && !hasShownEmailToast.current) {
            hasShownEmailToast.current = true;
            setShowEmailToast(true);
            if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
            toastTimerRef.current = setTimeout(() => setShowEmailToast(false), 3000);
        }
    };

    // ── Navigation ──
    const goToStep = (step, direction) => {
        if (currentStep === 5 && step !== 5) hasShownEmailToast.current = false;
        setNavDirection(direction);
        setCurrentStep(step);
        window.scrollTo(0, 0);
    };

    const handleBack = () => {
        if (currentStep === 1) {
            navigate('/');
        } else if (currentStep === 3) {
            if (step3View === 'tags' || step3View === 'description') {
                setNavDirection('back');
                setStep3View('prompt');
            } else {
                goToStep(2, 'back');
            }
        } else {
            const prevStep = currentStep - 1;
            if (prevStep === 3) {
                if (selectedTab === 'custom' && customTags.length > 0) {
                    setStep3View('tags');
                } else {
                    setStep3View('prompt');
                }
            }
            goToStep(prevStep, 'back');
        }
    };

    const handleNext = () => {
        if (currentStep >= 5 || !visitedSteps.has(currentStep + 1)) return;
        if (currentStep === 1) {
            handleStep1Submit();
            return;
        }
        goToStep(currentStep + 1, 'forward');
    };

    // ── Step 1: Attendees ──
    const handleAttendeesChange = (e) => {
        const value = e.target.value;
        if (value === '' || (Number(value) >= 0 && Number.isInteger(Number(value)))) {
            setAttendees(value);
        }
    };

    const handleStep1Submit = () => {
        const num = parseInt(attendees);
        if (!num || num < 1) return;
        advanceFromStep1();
    };

    const advanceFromStep1 = () => {
        if (!visitedSteps.has(2)) {
            setMinutes(String(getRecommendedMinutes()));
            setSeconds('0');
        }
        setVisitedSteps(prev => new Set([...prev, 2]));
        goToStep(2, 'forward');
    };

    // ── Step 2: Duration ──
    const handleStep2Submit = () => {
        setVisitedSteps(prev => new Set([...prev, 3]));
        goToStep(3, 'forward');
    };

    // ── Step 3: Interest Pairing ──
    const handleTryItOut = () => {
        setNavDirection('forward');
        setStep3View('description');
    };

    const handleStep3Skip = () => {
        setSelectedTab('icebreaker');
        setCustomTags([]);
        setTagInput('');
        setVisitedSteps(prev => new Set([...prev, 4]));
        goToStep(4, 'forward');
    };

    const handleStep3Continue = () => {
        setSelectedTab('custom');
        setVisitedSteps(prev => new Set([...prev, 4]));
        goToStep(4, 'forward');
    };

    // ── Step 4: Match History ──
    const handleStep4Advance = (enable) => {
        setEnableMatchHistory(enable);
        setVisitedSteps(prev => new Set([...prev, 5]));
        goToStep(5, 'forward');
    };

    // ── Tags (preserved logic) ──
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
                const shuffled = [...data.tags].sort(() => Math.random() - 0.5);
                setAnimationTags(shuffled.slice(0, 4));
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
        setIsLoading(true);
        setError('');
        const lobbyDuration = (parseInt(minutes) * 60) + parseInt(seconds);

        const lobbyData = {
            lobby_code: lobbyCode,
            selected_tab: selectedTab,
            custom_tags: selectedTab === 'custom' ? customTags : [],
            lobby_duration: lobbyDuration,
            attendees: parseInt(attendees),
            minutes,
            seconds,
            show_table_numbers: showTableNumbers,
            enable_match_history: enableMatchHistory,
            email,
        };

        // Save lead (non-blocking, errors swallowed)
        try {
            await apiFetch('/save-organizer-lead', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    lobby_data: lobbyData,
                    attendees: parseInt(attendees),
                }),
            });
        } catch {}

        try {
            const res = await apiFetch('/create-free-trial', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    lobby_data: lobbyData,
                }),
            });

            const data = await res.json();

            if (data.success) {
                await checkAuth();
                navigate('/plan-checkout-success', {
                    state: { freeTrial: true, email, lobbyData },
                });
            } else {
                setError(data.message || 'Failed to create account. Please try again.');
                setIsLoading(false);
            }
        } catch (err) {
            console.error('Free trial creation error:', err);
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

    // ── Render: Step 1 — Attendees ──
    const renderStep1 = () => {
        const num = parseInt(attendees);
        const isValid = num >= 1;
        const showTableHint = Number.isInteger(num) && num >= 50;

        return (
            <div className="step-container">
                <h1 className="step-title">How many people are attending?</h1>
                <p className="step-subtitle" style={{ fontWeight: 600, fontStyle: 'normal' }}>
                    Estimate the max, so everyone gets to make new connections!
                </p>
                <div className="attendees-input-wrapper">
                    <input
                        type="number"
                        value={attendees}
                        onChange={handleAttendeesChange}
                        min="1"
                        placeholder="0"
                        className="form-input attendees-input"
                        autoComplete="off"
                    />
                    <button className="step2-go-btn" onClick={handleStep1Submit} disabled={!isValid}>
                        <ArrowRight />
                    </button>
                </div>
                {showTableHint
                    ? <TutorialAttendeesPhone key="tap-table" variant="table" />
                    : <TutorialAttendeesPhone key="tap-profile" variant="profile" />
                }
            </div>
        );
    };

    // ── Render: Step 2 — Duration ──
    const renderStep2 = () => {
        const recommended = getRecommendedMinutes();

        return (
            <div className="step-container">
                <h1 className="step-title">Conversation Duration</h1>
                <p className="step-subtitle" style={{ fontWeight: 600, fontStyle: 'normal' }}>
                    We recommend <strong style={{ color: '#0f1729' }}>{recommended} minutes</strong>. This includes
                    buffer time for people to end prior conversations and move onto their next person
                </p>
                <div className="duration-edit-wrapper">
                    <div className="duration-input-container">
                        <div className="duration-input-group">
                            <input
                                type="number"
                                value={minutes}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (value === '' || (parseInt(value) > 0 && parseInt(value) <= MaxMinutes)) {
                                        setMinutes(value);
                                        if (parseInt(value) === MaxMinutes) setSeconds('0');
                                    }
                                }}
                                min="1"
                                max={MaxMinutes}
                                placeholder={`1-${MaxMinutes}`}
                                className="form-input duration-input"
                                autoComplete="off"
                            />
                            <label className="duration-label">Minutes</label>
                        </div>
                        <div className="duration-input-group">
                            <input
                                type="number"
                                value={seconds}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (value === '' || (parseInt(value) >= 0 && parseInt(value) <= 59)) {
                                        setSeconds(value);
                                    }
                                }}
                                min="0"
                                max="59"
                                placeholder="0-59"
                                className="form-input duration-input"
                                autoComplete="off"
                                disabled={parseInt(minutes) === MaxMinutes}
                            />
                            <label className="duration-label">Seconds</label>
                        </div>
                    </div>
                    <button className="step2-go-btn" onClick={handleStep2Submit}>
                        <ArrowRight />
                    </button>
                </div>
                {parseInt(minutes) >= MaxMinutes && (
                    <div className="duration-max-toast">Maximum total duration is {MaxMinutes} minutes</div>
                )}
                <RoundDurationTutorial minutes={minutes} seconds={seconds} />
            </div>
        );
    };

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
                        onClick={aiDescription.trim().length >= 2 ? handleGenerateTags : handleStep3Skip}
                        disabled={isGeneratingTags}>
                        Continue <ArrowRight />
                    </button>
                </div>
            );
        }

        if (step3View === 'tags') {
            return (
                <div className="step-container">
                    <p className="step-subtitle" style={{ fontWeight: 600, fontStyle: 'normal' }}>What are your matching categories?</p>
                    <TutorialMatching
                        mode="inline"
                        isVisible={currentStep === 3 && step3View === 'tags'}
                        tags={animationTags}
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
                    <button className={`step-cta ${customTags.length < 2 ? 'step-cta-secondary' : ''}`} onClick={handleStep3Continue}>
                        Continue <ArrowRight />
                    </button>
                </div>
            );
        }

        return (
            <div className="step-container">
                <h1 className="step-title">Interest Pairing</h1>
                <p className="step-subtitle" style={{ fontWeight: 600, fontStyle: 'normal' }}>
                    Matchmaking blended in with the regular pairing, its the best of both worlds!
                </p>
                <button className="step-cta" onClick={handleTryItOut}>
                    Try it Out <ArrowRight />
                </button>
                <button className="step-cta step-cta-secondary" onClick={handleStep3Skip}>
                    Skip
                </button>
                <TutorialMatching
                    mode="inline"
                    isVisible={currentStep === 3 && step3View === 'prompt'}
                />
            </div>
        );
    };

    // ── Render: Step 4 — Match History ──
    const renderStep4 = () => (
        <div className="step-container">
            <h1 className="step-title">History of Connections</h1>
            <p className="step-subtitle" style={{ fontWeight: 600, fontStyle: 'normal' }}>
                They just <strong className="aht-header-green">save their email</strong> to
                access their connections at the end of the session. Your <strong className="aht-header-green">organizer dashboard</strong> will have insights and analytics about your attendees!
            </p>
            <div className="step5-reveal step5-reveal-step4-body">
                <button className="step-cta" onClick={() => handleStep4Advance(true)}>
                    Enable <ArrowRight />
                </button>
                <button className="step-cta step-cta-secondary" onClick={() => handleStep4Advance(false)}>
                    Skip
                </button>
                <AttendeesHistoryTutorial />
            </div>
        </div>
    );

    // ── Render: Step 5 — Get Started ──
    const renderStep5 = () => (
        <div className="step-container review-step">
            <h1 className="step-title">Get Started for Free</h1>

            {showEmailToast && (
                <div className="email-toast">
                    Make sure this email is valid, this will be used to authenticate your organizer access
                </div>
            )}

            {error && <div className="error-message">{error}</div>}

            <div className="create-row">
                <input
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="input your email"
                    className="form-input email-input"
                    autoComplete="email"
                />
                <button className="step-cta create-cta" onClick={handleSubmit}
                    disabled={isLoading || !isValidEmail(email)}>
                    {isLoading ? 'Creating...' : 'Create'}
                    {!isLoading && <SparkleIcon />}
                </button>
            </div>
            {!isLoading && !isValidEmail(email) && email.length > 0 && (
                <p className="input-hint" style={{ color: '#dc2626', textAlign: 'center', marginTop: '4px', fontSize: '13px' }}>
                    Enter a valid email address
                </p>
            )}
        </div>
    );

    // ── Main Render ──
    const stepKey = currentStep === 3 ? `3-${step3View}` : String(currentStep);

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

            {currentStep === 1 && (
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
                    {currentStep === 1 && renderStep1()}
                    {currentStep === 2 && renderStep2()}
                    {currentStep === 3 && renderStep3()}
                    {currentStep === 4 && renderStep4()}
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
        </div>
    );
};

export default NewOrganizerView;
