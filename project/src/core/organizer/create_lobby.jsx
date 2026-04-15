import React, { useEffect, useState, useRef } from 'react';
import { AuthContext } from '../Auth/AuthContext';
import { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../cropImage';
import './create_lobby.css';
import { apiFetch } from '../utils/api';
import FloatingLinesBackground from './FloatingLinesBackground';
import TutorialMatchHistory from '../Tutorials/tutorial-match-history';
import TutorialMatching from '../Tutorials/tutorial-matching';
import TutorialRandomMatching from '../Tutorials/tutorial-random-matching';
import CoolerGeneralMatchEventFlow from '../Tutorials/cooler_general_match_event_flow';
import TutorialAttendeesPhone from '../Tutorials/tutorial-attendees-phone';
import RoundDurationTutorial from '../Tutorials/round_duration_tutorial';
import SponsorLogoTutorial from '../Tutorials/sponsor_logo_tutorial';
import LoadingSpinner from '../components/LoadingSpinner';

const CreateLobbyView = () => {
    const { user, permissions, isLegacyOrganizer } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    // ── Step Navigation ──
    const [currentStep, setCurrentStep] = useState(1);
    const [visitedSteps, setVisitedSteps] = useState(new Set([1]));
    const [navDirection, setNavDirection] = useState('forward');
    const [step1View, setStep1View] = useState('selection');

    // ── Form Data ──
    const [lobbyCode, setLobbyCode] = useState('');
    const [selectedTab, setSelectedTab] = useState(null);
    const [customTags, setCustomTags] = useState([]);
    const [tagInput, setTagInput] = useState('');
    const [attendees, setAttendees] = useState('');
    const [minutes, setMinutes] = useState('5');
    const [seconds, setSeconds] = useState('0');
    const [showTableNumbers, setShowTableNumbers] = useState(false);
    const [enableMatchHistory, setEnableMatchHistory] = useState(true);

    // ── AI Tag Generation ──
    const [aiDescription, setAiDescription] = useState('');
    const [isGeneratingTags, setIsGeneratingTags] = useState(false);
    const [tagsFromAI, setTagsFromAI] = useState(false);

    // ── Logo Upload ──
    const [logoName, setLogoName] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [logoPreview, setLogoPreview] = useState(null);
    const [logoCroppedImage, setLogoCroppedImage] = useState(null);
    const [logoError, setLogoError] = useState('');
    const [isLogoCropping, setIsLogoCropping] = useState(false);
    const [isLogoProcessing, setIsLogoProcessing] = useState(false);
    const [logoCrop, setLogoCrop] = useState({ x: 0, y: 0 });
    const [logoZoom, setLogoZoom] = useState(1);
    const [logoCropArea, setLogoCropArea] = useState(null);

    // ── UI State ──
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingCode, setIsLoadingCode] = useState(false);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [pendingTabSwitch, setPendingTabSwitch] = useState(null);
    const [showTableModal, setShowTableModal] = useState(false);
    const [isEditingReview, setIsEditingReview] = useState(false);

    const [showTutorial, setShowTutorial] = useState(false);
    const [showRandomTutorial, setShowRandomTutorial] = useState(false);
    const [showGeneralTutorial, setShowGeneralTutorial] = useState(false);

    // ── Plan Limit ──
    const [planLimit, setPlanLimit] = useState(null);
    const [isFreeTrial, setIsFreeTrial] = useState(false);

    const MaxMinutes = 8;

    // ── Hydration state ──
    const hydratedRef = useRef(false);
    const wasHydratedRef = useRef(false);
    const [isHydrating, setIsHydrating] = useState(false);

    // ── Initialization + hydration from lobbyData ──
    useEffect(() => {
        window.scrollTo(0, 0);
        if (user) {
            fetchLobbyCode();
        } else {
            setLobbyCode(generateLobbyCode());
        }

        if (hydratedRef.current) return;

        const hydrate = (data) => {
            if (data.selected_tab) setSelectedTab(data.selected_tab);
            if (Array.isArray(data.custom_tags)) setCustomTags(data.custom_tags);
            if (data.attendees != null) setAttendees(String(data.attendees));
            if (data.minutes != null) setMinutes(String(data.minutes));
            if (data.seconds != null) setSeconds(String(data.seconds));
            if (data.show_table_numbers != null) setShowTableNumbers(data.show_table_numbers);
            if (data.enable_match_history != null) setEnableMatchHistory(data.enable_match_history);
            if (data.logo_name) setLogoName(data.logo_name);
            if (data.logo_url) setLogoUrl(data.logo_url);

            const savedLogo = localStorage.getItem('reuneo_plan_logo');
            if (savedLogo) setLogoCroppedImage(savedLogo);

            if (data.selected_tab === 'custom') {
                setStep1View('tags');
            }

            setCurrentStep(6);
            setVisitedSteps(new Set([1, 2, 3, 4, 5, 6]));
            hydratedRef.current = true;
            wasHydratedRef.current = true;
        };

        const routerData = location.state?.lobbyData;
        if (routerData) {
            hydrate(routerData);
            return;
        }

        if (!user) return;

        // Fallback: fetch lobby_data from OrganizerPlans via API
        const fetchLobbyData = async () => {
            setIsHydrating(true);
            try {
                const res = await apiFetch('/organizer-lobby-data');
                if (!res.ok) return;
                const json = await res.json();
                if (json.lobby_data) hydrate(json.lobby_data);
            } catch {} finally {
                setIsHydrating(false);
                hydratedRef.current = true;
            }
        };
        fetchLobbyData();
    }, [user, location.state]);


    // ── Fetch plan limit for regular organizers ──
    useEffect(() => {
        if (!user || permissions !== 'organizer' || isLegacyOrganizer) return;
        const fetchPlanLimit = async () => {
            try {
                const res = await apiFetch('/organizer-plan-details');
                const data = await res.json();
                if (data.has_plan && data.attendee_limit) {
                    setPlanLimit(data.attendee_limit);
                }
                if (data.plan_type === 'free_trial') {
                    setIsFreeTrial(true);
                }
            } catch (err) {
                console.error('Failed to fetch plan limit:', err);
            }
        };
        fetchPlanLimit();
    }, [user, permissions, isLegacyOrganizer]);

    // ── Clamp hydrated attendees if they exceed plan limit ──
    useEffect(() => {
        if (!planLimit || !attendees) return;
        const num = parseInt(attendees);
        if (num > planLimit) {
            setAttendees(String(planLimit));
            if (planLimit < 50) setShowTableNumbers(false);
        }
    }, [planLimit]);

    // ── Helpers ──
    const generateLobbyCode = () =>
        Array.from({ length: 6 }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]).join('');

    const fetchLobbyCode = async (forceNew = false) => {
        setIsLoadingCode(true);
        try {
            const res = await apiFetch(`/generate_lobby_code${forceNew ? '?force_new=true' : ''}`);
            if (res.ok) {
                const data = await res.json();
                if (data.lobby_code) {
                    setLobbyCode(data.lobby_code);
                    return;
                }
            }
            setLobbyCode(generateLobbyCode());
        } catch (err) {
            console.error('Error fetching lobby code:', err);
            setLobbyCode(generateLobbyCode());
        } finally {
            setIsLoadingCode(false);
        }
    };

    const validateLobbyCode = (code) => {
        return code.length >= 2 && /^[a-z0-9]+$/.test(code);
    };

    const getRecommendedMinutes = () => {
        const num = parseInt(attendees) || 0;
        if (num <= 30) return 5;
        if (num <= 65) return 6;
        return 7;
    };

    // ── Tutorial Handlers ──
    const handleTutorialComplete = () => {
        setShowTutorial(false);
        setSelectedTab('custom');
        setNavDirection('forward');
        setStep1View(customTags.length > 0 ? 'tags' : 'description');
    };
    const handleRandomTutorialComplete = () => {
        setShowRandomTutorial(false);
        if (customTags.length > 0 || tagInput.trim()) {
            setPendingTabSwitch('icebreaker');
            setShowModal(true);
        } else {
            setSelectedTab('icebreaker');
            setCustomTags([]);
            setTagInput('');
            setVisitedSteps(prev => new Set([...prev, 2]));
            goToStep(2, 'forward');
        }
    };
    const handleGeneralTutorialComplete = () => setShowGeneralTutorial(false);

    // ── Navigation ──
    const goToStep = (step, direction) => {
        setNavDirection(direction);
        setCurrentStep(step);
        window.scrollTo(0, 0);
    };

    const handleBack = () => {
        if (currentStep === 1) {
            if (step1View === 'tags' || step1View === 'description') {
                setNavDirection('back');
                setStep1View('selection');
            } else {
                navigate('/');
            }
        } else {
            const prevStep = currentStep - 1;
            if (prevStep === 1) {
                if (selectedTab === 'custom') {
                    setStep1View(customTags.length > 0 ? 'tags' : 'description');
                } else {
                    setStep1View('selection');
                }
            }
            goToStep(prevStep, 'back');
        }
    };

    const handleNext = () => {
        if (currentStep >= 6 || !visitedSteps.has(currentStep + 1)) return;
        if (currentStep === 2) {
            handleStep2Submit();
            return;
        }
        goToStep(currentStep + 1, 'forward');
    };

    // ── Step 1: Event Type ──
    const handleEventTypeSelect = (type) => {
        if (type === 'icebreaker') {
            setShowRandomTutorial(true);
        } else if (type === 'custom') {
            setShowTutorial(true);
        }
    };

    const handleStep1Continue = () => {
        setVisitedSteps(prev => new Set([...prev, 2]));
        goToStep(2, 'forward');
    };

    // ── Step 2: Attendees ──
    const handleAttendeesChange = (e) => {
        const value = e.target.value;
        if (value === '' || (Number(value) >= 0 && Number.isInteger(Number(value)))) {
            if (planLimit && value !== '' && Number(value) > planLimit) {
                setAttendees(String(planLimit));
            } else {
                setAttendees(value);
            }
        }
    };

    const handleStep2Submit = () => {
        const num = parseInt(attendees);
        if (!num || num < 1) return;
        if (num >= 50 && !showTableNumbers) {
            setShowTableModal(true);
            return;
        }
        advanceFromStep2();
    };

    const advanceFromStep2 = () => {
        if (!visitedSteps.has(3)) {
            setMinutes(String(getRecommendedMinutes()));
            setSeconds('0');
        }
        setVisitedSteps(prev => new Set([...prev, 3]));
        goToStep(3, 'forward');
    };

    const handleTableModalDismiss = () => {
        setShowTableNumbers(true);
        setShowTableModal(false);
        advanceFromStep2();
    };

    // ── Step 3: Duration ──
    const handleStep3Submit = () => {
        setVisitedSteps(prev => new Set([...prev, 4]));
        goToStep(4, 'forward');
    };

    // ── Step 4: Logo ──
    const handleStep4Advance = () => {
        setVisitedSteps(prev => new Set([...prev, 5]));
        goToStep(5, 'forward');
    };

    // ── Step 5: Match History ──
    const handleStep5Advance = (enable) => {
        setEnableMatchHistory(enable);
        setVisitedSteps(prev => new Set([...prev, 6]));
        goToStep(6, 'forward');
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
            const response = await apiFetch('/generate_tags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description })
            });

            const data = await response.json();

            if (data.status === 'success' && data.tags) {
                setCustomTags(data.tags);
                setTagsFromAI(true);
                setNavDirection('forward');
                setStep1View('tags');
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
        setStep1View('description');
        setCustomTags([]);
        setTagsFromAI(false);
    };

    // ── Lobby Code ──
    const handleLobbyCodeChange = (e) => {
        setLobbyCode(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''));
    };

    // ── Logo Upload (preserved logic) ──
    const resizeImage = (file, maxWidth, maxHeight) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                let { width, height } = img;
                if (width > height) {
                    if (width > maxWidth) { height = (height * maxWidth) / width; width = maxWidth; }
                } else {
                    if (height > maxHeight) { width = (width * maxHeight) / height; height = maxHeight; }
                }
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.src = URL.createObjectURL(file);
        });
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setLogoError('');
        setIsLogoProcessing(true);
        if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
            setLogoError('Invalid format. Please upload a JPG or PNG image.');
            setIsLogoProcessing(false);
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            setLogoError('File too large. Please choose an image under 2MB.');
            setIsLogoProcessing(false);
            return;
        }
        try {
            const resizedImage = await resizeImage(file, 400, 400);
            setLogoPreview(resizedImage);
            setIsLogoCropping(true);
            setIsLogoProcessing(false);
        } catch (err) {
            console.error('Error processing image:', err);
            setLogoError('Error processing image. Please try again.');
            setIsLogoProcessing(false);
        }
    };

    const handleLogoCropComplete = (croppedArea, croppedAreaPixels) => {
        setLogoCropArea(croppedAreaPixels);
    };

    const handleSaveLogoCrop = async () => {
        try {
            setIsLogoProcessing(true);
            const croppedImage = await getCroppedImg(logoPreview, logoCropArea);
            setLogoCroppedImage(croppedImage);
            setIsLogoCropping(false);
            setIsLogoProcessing(false);
        } catch (err) {
            console.error('Error cropping logo:', err);
            setLogoError('Error processing image. Please try again.');
            setIsLogoCropping(false);
            setIsLogoProcessing(false);
        }
    };

    const handleRemoveLogo = () => {
        setLogoPreview(null);
        setLogoCroppedImage(null);
        setIsLogoCropping(false);
        setIsLogoProcessing(false);
        setLogoCrop({ x: 0, y: 0 });
        setLogoZoom(1);
        setLogoCropArea(null);
        setLogoError('');
        const fileInput = document.getElementById('logoUpload');
        if (fileInput) fileInput.value = '';
    };

    // ── Review Event Type Switch ──
    const handleReviewTabSelect = (tabType) => {
        if (tabType === selectedTab) return;
        if (tabType === 'icebreaker') {
            if (customTags.length > 0 || tagInput.trim()) {
                setPendingTabSwitch('icebreaker');
                setShowModal(true);
            } else {
                setSelectedTab('icebreaker');
                setCustomTags([]);
                setTagInput('');
            }
        } else if (tabType === 'custom') {
            setSelectedTab('custom');
        }
    };

    // ── Modals ──
    const handleModalConfirm = () => {
        setSelectedTab(pendingTabSwitch);
        setCustomTags([]);
        setTagInput('');
        setShowModal(false);
        setPendingTabSwitch(null);
        if (currentStep === 1) {
            setVisitedSteps(prev => new Set([...prev, 2]));
            goToStep(2, 'forward');
        }
    };

    const handleModalCancel = () => {
        setShowModal(false);
        setPendingTabSwitch(null);
    };

    // ── Submit ──
    const handleSubmit = async () => {
        if (!validateLobbyCode(lobbyCode)) {
            setError("Lobby code must be at least 2 characters long and contain only lowercase letters and numbers");
            return;
        }
        setIsLoading(true);
        setError('');
        const lobbyDuration = (parseInt(minutes) * 60) + parseInt(seconds);
        let logoIconData = null;
        if (logoCroppedImage) {
            logoIconData = logoCroppedImage.split(',')[1];
        }

        try {
            const requestBody = {
                lobby_code: lobbyCode,
                custom_tags: selectedTab === 'custom' ? customTags : [],
                lobby_duration: lobbyDuration,
                show_table_numbers: showTableNumbers,
                enable_match_history: enableMatchHistory
            };
            if (logoIconData) requestBody.logo_icon = logoIconData;
            if (logoName.trim()) requestBody.logo_name = logoName.trim();
            if (logoUrl.trim()) requestBody.logo_hyperlink = logoUrl.trim();

            const response = await apiFetch('/create_lobby', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();

            if (response.ok && data.status === 'success') {
                localStorage.removeItem('reuneo_plan_logo');
                localStorage.removeItem('reuneo_plan_email');
                sessionStorage.removeItem('reuneo_plan_lobbyData');
                navigate(`/admin_lobby_view?code=${lobbyCode}`, { state: { newlyCreated: true } });
            } else {
                if (data.reason === 'activations_exhausted' || data.reason === 'monthly_limit_reached' || data.reason === 'no_active_plan' || data.reason === 'no_uses_remaining') {
                    navigate('/organizer-account-details', { state: { limitMessage: data.message } });
                    return;
                }
                setError(data.message || "Failed to create lobby");
            }
        } catch (err) {
            setError("An error occurred while creating the lobby");
            console.error("Error creating lobby:", err);
        } finally {
            setIsLoading(false);
        }
    };

    // ── Shared: Logo Upload UI (used in step 4 + review edit) ──
    const renderLogoUpload = () => (
        <>
            {!logoCroppedImage && !isLogoCropping && (
                <>
                    {isLogoProcessing ? (
                        <div className="logo-processing">Processing...</div>
                    ) : (
                        <>
                            <input type="file" id="logoUpload" accept="image/jpeg,image/jpg,image/png"
                                onChange={handleLogoUpload} style={{ display: 'none' }} />
                            <button type="button"
                                onClick={() => document.getElementById('logoUpload').click()}
                                className="logo-upload-button">
                                Upload
                            </button>
                        </>
                    )}
                    {logoError && <div className="logo-error-message">{logoError}</div>}
                </>
            )}
            {isLogoCropping && logoPreview && (
                <div className="logo-crop-container">
                    <div className="logo-crop-area">
                        <Cropper image={logoPreview} crop={logoCrop} zoom={logoZoom} aspect={1}
                            onCropChange={setLogoCrop} onZoomChange={setLogoZoom}
                            onCropComplete={handleLogoCropComplete} />
                    </div>
                    <div className="logo-crop-controls">
                        <button type="button" onClick={handleSaveLogoCrop}
                            className="logo-save-button" disabled={isLogoProcessing}>
                            {isLogoProcessing ? 'Processing...' : 'Save Crop'}
                        </button>
                        <button type="button" onClick={handleRemoveLogo}
                            className="logo-cancel-button">Cancel</button>
                    </div>
                </div>
            )}
            {logoCroppedImage && !isLogoCropping && (
                <div className="logo-preview-container">
                    <div className="logo-preview">
                        <img src={logoCroppedImage} alt="Logo preview" className="logo-preview-image" />
                        <button type="button" onClick={handleRemoveLogo}
                            className="logo-remove-button">×</button>
                    </div>
                </div>
            )}
        </>
    );

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

    const EditIcon = () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#144dff"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
    );

    const CheckIcon = () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#144dff"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
        </svg>
    );

    const RefreshIcon = () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
        </svg>
    );

    // ── Render: Step 1 — Event Type ──
    const renderStep1 = () => {
        if (step1View === 'description') {
            return (
                <div className="step-container">
                    <h1 className="step-title">Describe the people and event purpose</h1>
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
                    <button className="step-cta step-cta-secondary"
                        onClick={aiDescription.trim().length >= 2 ? handleGenerateTags : handleStep1Continue}
                        disabled={isGeneratingTags}>
                        Continue <ArrowRight />
                    </button>
                </div>
            );
        }

        if (step1View === 'tags') {
            return (
                <div className="step-container">
                    <h1 className="step-title">What are your matching categories?</h1>
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
                    <button className={`step-cta ${customTags.length < 2 ? 'step-cta-secondary' : ''}`} onClick={handleStep1Continue}>
                        Continue <ArrowRight />
                    </button>
                </div>
            );
        }

        return (
            <div className="step-container">
                <h1 className="step-title">How do you want to pair up your attendees?</h1>
                <div className="event-type-container">
                    <div className="event-type-button-wrapper">
                        <button
                            className={`event-type-button event-type-primary ${selectedTab === 'custom' ? 'selected' : ''}`}
                            onClick={() => handleEventTypeSelect('custom')}
                        >
                            Pair People By Interests
                        </button>
                    </div>
                    <div className="event-type-divider" />
                    <div className="event-type-button-wrapper">
                        <button
                            className={`event-type-button event-type-primary ${selectedTab === 'icebreaker' ? 'selected' : ''}`}
                            onClick={() => handleEventTypeSelect('icebreaker')}
                        >
                            Pair People Randomly
                        </button>
                    </div>
                </div>
                <button
                    type="button"
                    className="tutorial-pill-button tutorial-general-pill"
                    onClick={() => setShowGeneralTutorial(true)}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                </button>
            </div>
        );
    };

    // ── Render: Step 2 — Attendees ──
    const renderStep2 = () => {
        const num = parseInt(attendees);
        const isValid = num >= 1;
        const showLimitWarning = planLimit && num >= Math.floor(planLimit * 0.5);
        const showTableHint = Number.isInteger(num) && num >= 50;

        return (
            <div className="step-container">
                <h1 className="step-title">How many people are attending?</h1>
                <p className="step-subtitle" style={{ fontWeight: 600, fontStyle: 'normal' }}>
                    Estimate the max, so everyone gets to make new connections!
                </p>
                {showLimitWarning && (
                    <div className="attendee-limit-warning">
                        Your plan's max attendee limit per use is <strong>{planLimit}</strong>
                    </div>
                )}
                <div className="attendees-input-wrapper">
                    <input
                        type="number"
                        value={attendees}
                        onChange={handleAttendeesChange}
                        min="1"
                        max={planLimit || undefined}
                        placeholder="0"
                        className="form-input attendees-input"
                        autoComplete="off"
                    />
                    <button className="step2-go-btn" onClick={handleStep2Submit} disabled={!isValid}>
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

    // ── Render: Step 3 — Duration ──
    const renderStep3 = () => {
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
                    <button className="step2-go-btn" onClick={handleStep3Submit}>
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

    // ── Render: Step 4 — Sponsor Logo ──
    const renderStep4 = () => {
        const hasLogo = logoCroppedImage && !isLogoCropping;

        return (
            <div className="step-container">
                <h1 className="step-title">Sponsor Logo (optional)</h1>
                <p className="step-subtitle" style={{ fontWeight: 600, fontStyle: 'normal' }}>
                    {hasLogo
                        ? <>Estimated logo watch time: <strong style={{ color: '#0f1729' }}>{(parseInt(attendees) || 0) * 5} minutes</strong> - (5 min per person)</>
                        : 'People spend 30 seconds looking at their screen to find who they paired with, and get paired up 10 times in an event (on average)'
                    }
                </p>
                {!hasLogo && (
                    <div className="sponsor-upload-area">
                        <span className="sponsor-label">Estimated logo watch time: <strong style={{ color: '#0f1729' }}>{(parseInt(attendees) || 0) * 5} minutes</strong> - (5 min per person)</span>
                        {renderLogoUpload()}
                    </div>
                )}
                {!isLogoCropping && (
                    <div className="step4-cta-group">
                        <button className="step-cta" onClick={handleStep4Advance}>
                            {hasLogo ? 'Continue' : 'Skip'} <ArrowRight />
                        </button>
                        {hasLogo && (
                            <button className="step-cta step-cta-secondary" onClick={handleRemoveLogo}>
                                Cancel
                            </button>
                        )}
                    </div>
                )}
                {hasLogo && (
                    <SponsorLogoTutorial
                        key="slt"
                        logoSrc={logoCroppedImage}
                        minutes={minutes}
                        seconds={seconds}
                    />
                )}
            </div>
        );
    };

    // ── Render: Step 5 — Match History ──
    const renderStep5 = () => (
        <div className="step-container">
            <h1 className="step-title">Match History for Attendees</h1>
            <div className="step5-reveal step5-reveal-sub">
                <p className="step-subtitle">
                    Once the session is over, people will be taken to a match history page, where
                    they can share each other's preferred contact information.
                </p>
            </div>
            <div className="step5-reveal step5-reveal-ctas">
                <button className="step-cta" onClick={() => handleStep5Advance(true)}>
                    Enable <ArrowRight />
                </button>
                <button className="step-cta step-cta-secondary" onClick={() => handleStep5Advance(false)}>
                    Skip
                </button>
            </div>
            <div className="step5-reveal step5-reveal-tutorial">
                <TutorialMatchHistory />
            </div>
        </div>
    );

    // ── Render: Step 6 — Review ──
    const renderStep6 = () => {
        if (isFreeTrial && wasHydratedRef.current) {
            return (
                <div className="step-container review-step">
                    <h1 className="step-title">Turn any social gathering into a community!</h1>
                    <p className="step-subtitle" style={{ fontWeight: 600, fontStyle: 'normal' }}>
                        Real connections, real engagement, real results
                    </p>
                    {error && <div className="error-message">{error}</div>}
                    <button className="step-cta create-cta" onClick={handleSubmit}
                        disabled={isLoading || isLoadingCode}>
                        {isLoading ? 'Creating...' : 'Get Started'}
                        {!isLoading && <SparkleIcon />}
                    </button>
                </div>
            );
        }

        return (
        <div className="step-container review-step">
            <h1 className="step-title">Everything Look Good?</h1>

            <div className="review-card">
                <button className="review-edit-toggle"
                    onClick={() => setIsEditingReview(!isEditingReview)}
                    aria-label={isEditingReview ? 'Done editing' : 'Edit'}>
                    {isEditingReview ? <CheckIcon /> : <EditIcon />}
                </button>

                {/* Event Type + Tags */}
                <div className="review-section">
                    {isEditingReview ? (
                        <>
                            <div className="matchmaking-tabs">
                                <button type="button"
                                    className={`tab-button ${selectedTab === 'icebreaker' ? 'tab-selected' : ''}`}
                                    onClick={() => handleReviewTabSelect('icebreaker')}>
                                    Community Ice Breaker
                                </button>
                                <button type="button"
                                    className={`tab-button ${selectedTab === 'custom' ? 'tab-selected' : ''}`}
                                    onClick={() => handleReviewTabSelect('custom')}>
                                    Custom Matching
                                </button>
                            </div>
                            {selectedTab === 'custom' && (
                                <div className="custom-matching-section" style={{ marginTop: '12px' }}>
                                    <div className="tag-input-container">
                                        <input type="text" value={tagInput}
                                            onChange={(e) => setTagInput(e.target.value)}
                                            onKeyDown={handleTagKeyDown}
                                            placeholder="Add categories"
                                            className="form-input" autoComplete="off" />
                                        <button type="button" onClick={handleAddTag}
                                            className="tag-add-button">+</button>
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
                            )}
                        </>
                    ) : (
                        <div className="review-section-content">
                            <span className="review-value-primary">
                                {selectedTab === 'custom' ? 'Custom Matchmaking:' : 'Community Ice Breaker'}
                            </span>
                            {selectedTab === 'custom' && customTags.length > 0 && (
                                <span className="review-value-secondary">*{customTags.join(', ')}</span>
                            )}
                        </div>
                    )}
                </div>

                {/* Duration */}
                <div className="review-section">
                    {isEditingReview ? (
                        <div className="duration-input-container">
                            <div className="duration-input-group">
                                <input type="number" value={minutes}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (value === '' || (parseInt(value) > 0 && parseInt(value) <= MaxMinutes)) {
                                            setMinutes(value);
                                            if (parseInt(value) === MaxMinutes) setSeconds('0');
                                        }
                                    }}
                                    min="1" max={MaxMinutes}
                                    className="form-input duration-input" autoComplete="off" />
                                <label className="duration-label">Minutes</label>
                            </div>
                            <div className="duration-input-group">
                                <input type="number" value={seconds}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (value === '' || (parseInt(value) >= 0 && parseInt(value) <= 59)) setSeconds(value);
                                    }}
                                    min="0" max="59"
                                    className="form-input duration-input" autoComplete="off"
                                    disabled={parseInt(minutes) === MaxMinutes} />
                                <label className="duration-label">Seconds</label>
                            </div>
                        </div>
                    ) : (
                        <div className="review-section-content">
                            <span className="review-value-primary">
                                {minutes} minute{minutes !== '1' ? 's' : ''}{parseInt(seconds) > 0 ? ` ${seconds} second${seconds !== '1' ? 's' : ''}` : ''} conversations
                            </span>
                        </div>
                    )}
                </div>

                {/* Attendees + Table Numbers */}
                <div className="review-section">
                    {isEditingReview ? (
                        <div className="review-edit-group">
                            <div className="review-edit-row">
                                <label className="review-edit-label">Attendees</label>
                                <input type="number" value={attendees}
                                    onChange={handleAttendeesChange}
                                    min="1" max={planLimit || undefined}
                                    className="form-input review-inline-input" autoComplete="off" />
                            </div>
                            {planLimit && parseInt(attendees) >= Math.floor(planLimit * 0.5) && (
                                <div className="attendee-limit-warning" style={{ marginTop: '4px' }}>
                                    Your plan's max attendee limit per use is <strong>{planLimit}</strong>
                                </div>
                            )}
                            <div className="review-edit-row">
                                <label className="review-edit-label">Table Numbers</label>
                                <input type="checkbox" checked={showTableNumbers}
                                    onChange={(e) => setShowTableNumbers(e.target.checked)}
                                    className="form-input checkbox-input" />
                            </div>
                        </div>
                    ) : (
                        <div className="review-section-content">
                            <span className="review-value-primary">{attendees} attendees <span className="review-value-secondary" style={{ fontWeight: 500 }}>(max estimate)</span></span>
                            <span className={showTableNumbers ? 'review-value-primary' : 'review-value-secondary'}>
                                {showTableNumbers ? 'Table Numbers are displayed' : 'Table Numbers are not displayed'}
                            </span>
                        </div>
                    )}
                </div>

                {/* Lobby Code */}
                <div className="review-section">
                    <div className="review-section-content lobby-code-row">
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                            <span className="review-value-secondary">lobby code</span>
                            {(isLegacyOrganizer || permissions === 'admin') ? (
                                <>
                                    <input type="text" value={lobbyCode}
                                        onChange={handleLobbyCodeChange}
                                        className="form-input review-inline-input" autoComplete="off"
                                        placeholder="Enter lobby code" />
                                    {lobbyCode && !validateLobbyCode(lobbyCode) && (
                                        <div className="input-hint" style={{ color: '#dc2626' }}>
                                            Min 2 chars, lowercase letters and numbers only
                                        </div>
                                    )}
                                </>
                            ) : (
                                <span className="review-value-primary">
                                    {isLoadingCode ? '...' : lobbyCode}
                                </span>
                            )}
                        </div>
                        <button
                            type="button"
                            className="regenerate-code-button"
                            onClick={() => fetchLobbyCode(true)}
                            disabled={isLoadingCode}
                            title="Generate a new lobby code"
                        >
                            <RefreshIcon />
                        </button>
                    </div>
                </div>

                {/* Match History */}
                <div className="review-section">
                    {isEditingReview ? (
                        <div className="review-edit-group">
                            <div className="review-edit-row">
                                <label className="review-edit-label">Match History</label>
                                <input type="checkbox" checked={enableMatchHistory}
                                    onChange={(e) => setEnableMatchHistory(e.target.checked)}
                                    className="form-input checkbox-input" />
                            </div>
                        </div>
                    ) : (
                        <div className="review-section-content">
                            <span className={enableMatchHistory ? 'review-value-primary' : 'review-value-secondary'}>
                                {enableMatchHistory ? 'Match History enabled' : 'Match History not enabled'}
                            </span>
                        </div>
                    )}
                </div>

                {/* Sponsor Logo */}
                <div className="review-section">
                    {isEditingReview ? (
                        <div className="review-edit-group">
                            <label className="review-edit-label" style={{ textAlign: 'center', minWidth: 'auto' }}>Sponsor Logo</label>
                            {renderLogoUpload()}
                        </div>
                    ) : (
                        <div className="review-section-content">
                            <span className="review-value-secondary">sponsor logo</span>
                            {logoCroppedImage ? (
                                <img src={logoCroppedImage} alt="Sponsor logo" className="review-logo-thumbnail" />
                            ) : (
                                <span className="review-value-primary">No sponsor logo</span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <button className="step-cta create-cta" onClick={handleSubmit}
                disabled={isLoading || isLoadingCode || !validateLobbyCode(lobbyCode)}>
                {isLoading ? 'Creating...' : 'Create'}
                {!isLoading && <SparkleIcon />}
            </button>
            {(isLegacyOrganizer || permissions === 'admin') && !isLoading && !validateLobbyCode(lobbyCode) && (
                <p className="input-hint" style={{ color: '#dc2626', textAlign: 'center', marginTop: '8px', fontSize: '13px' }}>
                    Lobby code must be at least 2 characters, lowercase letters and numbers only
                </p>
            )}
        </div>
    );
    };

    // ── Hydrating: show spinner while fetching lobby data from API ──
    if (isHydrating) {
        return (
            <div className="create-lobby-background">
                <FloatingLinesBackground />
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                    <LoadingSpinner size={50} message="Loading your lobby setup..." />
                </div>
            </div>
        );
    }

    // ── Main Render ──
    const stepKey = currentStep === 1 ? `1-${step1View}` : String(currentStep);

    return (
        <div className="create-lobby-background">
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
                {currentStep < 6 && visitedSteps.has(currentStep + 1) ? (
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
            <div className="step-content-wrapper">
                <div key={stepKey} className={`step-content step-${navDirection}`}>
                    {currentStep === 1 && renderStep1()}
                    {currentStep === 2 && renderStep2()}
                    {currentStep === 3 && renderStep3()}
                    {currentStep === 4 && renderStep4()}
                    {currentStep === 5 && renderStep5()}
                    {currentStep === 6 && renderStep6()}
                </div>
            </div>

            {/* Table Numbers Modal — cannot be dismissed by tapping outside */}
            {showTableModal && (
                <div className="modal-overlay table-modal-overlay">
                    <div className="modal-content">
                        <h3>Table numbers will be displayed on your attendee's screens</h3>
                        <p>Table numbers help people find each other in larger events, you can edit this later</p>
                        <div className="modal-buttons">
                            <button type="button" onClick={handleTableModalDismiss}
                                className="modal-button modal-confirm" style={{ width: '100%' }}>
                                Got it!
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab Switch Confirmation Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Switch to Community Ice Breaker?</h3>
                        <p>This will clear your current matching categories.</p>
                        <div className="modal-buttons">
                            <button type="button" onClick={handleModalCancel}
                                className="modal-button modal-cancel">Cancel</button>
                            <button type="button" onClick={handleModalConfirm}
                                className="modal-button modal-confirm">Confirm</button>
                        </div>
                    </div>
                </div>
            )}

            <TutorialMatching
                isVisible={showTutorial}
                onComplete={handleTutorialComplete}
            />
            <TutorialRandomMatching
                isVisible={showRandomTutorial}
                onComplete={handleRandomTutorialComplete}
            />
            <CoolerGeneralMatchEventFlow
                isVisible={showGeneralTutorial}
                onComplete={handleGeneralTutorialComplete}
            />
        </div>
    );
};

export default CreateLobbyView;
