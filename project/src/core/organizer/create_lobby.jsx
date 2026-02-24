import React, { useEffect, useState } from 'react';
import { AuthContext } from '../Auth/AuthContext';
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../cropImage';
import './create_lobby.css';
import { apiFetch } from '../utils/api';
import FloatingLinesBackground from './FloatingLinesBackground';

const CreateLobbyView = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

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
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [pendingTabSwitch, setPendingTabSwitch] = useState(null);
    const [showTableModal, setShowTableModal] = useState(false);
    const [isEditingReview, setIsEditingReview] = useState(false);

    const MaxMinutes = 8;

    // ── Initialization ──
    useEffect(() => {
        window.scrollTo(0, 0);
        if (user) setLobbyCode(user);
    }, [user]);

    // ── Helpers ──
    const validateLobbyCode = (code) => {
        return code.length >= 2 && /^[a-z0-9]+$/.test(code);
    };

    const getRecommendedMinutes = () => {
        const num = parseInt(attendees) || 0;
        if (num <= 30) return 5;
        if (num <= 65) return 6;
        return 7;
    };

    // ── Navigation ──
    const goToStep = (step, direction) => {
        setNavDirection(direction);
        setCurrentStep(step);
        window.scrollTo(0, 0);
    };

    const handleBack = () => {
        if (currentStep === 1) {
            if (step1View === 'tags') {
                setNavDirection('back');
                setStep1View('selection');
            } else {
                navigate('/');
            }
        } else {
            const prevStep = currentStep - 1;
            if (prevStep === 1) {
                setStep1View(selectedTab === 'custom' ? 'tags' : 'selection');
            }
            goToStep(prevStep, 'back');
        }
    };

    const handleNext = () => {
        if (currentStep >= 5 || !visitedSteps.has(currentStep + 1)) return;
        if (currentStep === 2) {
            handleStep2Submit();
            return;
        }
        goToStep(currentStep + 1, 'forward');
    };

    // ── Step 1: Event Type ──
    const handleEventTypeSelect = (type) => {
        if (type === 'icebreaker') {
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
        } else if (type === 'custom') {
            setSelectedTab('custom');
            setNavDirection('forward');
            setStep1View('tags');
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
            setAttendees(value);
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
                show_table_numbers: showTableNumbers
            };
            if (logoIconData) requestBody.logo_icon = logoIconData;
            if (logoName.trim()) requestBody.logo_name = logoName.trim();
            if (logoUrl.trim()) requestBody.logo_hyperlink = logoUrl.trim();

            const response = await apiFetch('/create_lobby', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (response.ok) {
                navigate(`/admin_lobby_view?code=${lobbyCode}`);
            } else {
                const data = await response.json();
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
                                Upload Logo
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

    const PencilHint = () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
        </svg>
    );

    // ── Render: Step 1 — Event Type ──
    const renderStep1 = () => {
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
                    <button className="step-cta" onClick={handleStep1Continue}>
                        Continue <ArrowRight />
                    </button>
                </div>
            );
        }

        return (
            <div className="step-container">
                <h1 className="step-title">What type of event do you want?</h1>
                <div className="event-type-container">
                    <button
                        className={`event-type-button ${selectedTab === 'custom' ? 'selected' : ''}`}
                        onClick={() => handleEventTypeSelect('custom')}
                    >
                        Custom Matchmaking
                    </button>
                    <div className="event-type-divider" />
                    <button
                        className={`event-type-button ${selectedTab === 'icebreaker' ? 'selected' : ''}`}
                        onClick={() => handleEventTypeSelect('icebreaker')}
                    >
                        Community Ice-Breaker
                    </button>
                </div>
            </div>
        );
    };

    // ── Render: Step 2 — Attendees ──
    const renderStep2 = () => {
        const num = parseInt(attendees);
        const isValid = num >= 1;

        return (
            <div className="step-container">
                <h1 className="step-title">How many people are attending?</h1>
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
                </div>
                <button className="step-cta" onClick={handleStep2Submit} disabled={!isValid}>
                    Looks Good! <ArrowRight />
                </button>
            </div>
        );
    };

    // ── Render: Step 3 — Duration ──
    const renderStep3 = () => {
        const recommended = getRecommendedMinutes();

        return (
            <div className="step-container">
                <h1 className="step-title">How long should people talk in each conversation</h1>
                <p className="step-subtitle">
                    Based on your inputs, we recommend {recommended} minutes. This includes
                    buffer time for people to end prior conversations and move onto their next match.
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
                    <PencilHint />
                </div>
                <div className="input-hint">Maximum total duration is {MaxMinutes} minutes</div>
                <button className="step-cta" onClick={handleStep3Submit}>
                    Looks Good! <ArrowRight />
                </button>
            </div>
        );
    };

    // ── Render: Step 4 — Sponsor Logo ──
    const renderStep4 = () => {
        const hasLogo = logoCroppedImage && !isLogoCropping;

        return (
            <div className="step-container">
                <h1 className="step-title">Upload the logo of your preferred sponsor!</h1>
                <p className="step-subtitle">
                    For example: 100 attendees using it for an hour, that's an average of 10 pairings
                    per hour, that's 1,000 guaranteed impressions!
                </p>
                <div className="sponsor-upload-area">
                    <span className="sponsor-label">SPONSOR LOGO</span>
                    {renderLogoUpload()}
                </div>
                {!isLogoCropping && (
                    <button className="step-cta" onClick={handleStep4Advance}>
                        {hasLogo ? 'Continue' : 'Skip'} <ArrowRight />
                    </button>
                )}
            </div>
        );
    };

    // ── Render: Step 5 — Review ──
    const renderStep5 = () => (
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
                                {minutes} minutes - {seconds} seconds conversation durations
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
                                    min="1" className="form-input review-inline-input" autoComplete="off" />
                            </div>
                            <div className="review-edit-row">
                                <label className="review-edit-label">Table Numbers</label>
                                <input type="checkbox" checked={showTableNumbers}
                                    onChange={(e) => setShowTableNumbers(e.target.checked)}
                                    className="form-input checkbox-input" />
                            </div>
                        </div>
                    ) : (
                        <div className="review-section-content">
                            <span className="review-value-primary">{attendees} attendees</span>
                            <span className="review-value-secondary">
                                {showTableNumbers ? 'Table Numbers are displayed' : 'Table Numbers are not displayed'}
                            </span>
                        </div>
                    )}
                </div>

                {/* Lobby Code */}
                <div className="review-section">
                    {isEditingReview ? (
                        <div className="review-edit-group">
                            <label className="review-edit-label" style={{ textAlign: 'center', minWidth: 'auto' }}>Lobby Code</label>
                            <input type="text" value={lobbyCode}
                                onChange={handleLobbyCodeChange}
                                className="form-input review-inline-input" autoComplete="off"
                                placeholder="Enter lobby code" />
                            {lobbyCode && !validateLobbyCode(lobbyCode) && (
                                <div className="input-hint" style={{ color: '#dc2626' }}>
                                    Min 2 chars, lowercase letters and numbers only
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="review-section-content">
                            <span className="review-value-secondary">lobby code</span>
                            <span className="review-value-primary">{lobbyCode}</span>
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
                disabled={isLoading || !validateLobbyCode(lobbyCode)}>
                {isLoading ? 'Creating...' : 'Create'}
                {!isLoading && <SparkleIcon />}
            </button>
        </div>
    );

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
                <img src="/assets/reuneo_test_11.png" alt="Reuneo Logo" className="logo-image-nav" />
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

            {/* Table Numbers Modal — cannot be dismissed by tapping outside */}
            {showTableModal && (
                <div className="modal-overlay table-modal-overlay">
                    <div className="modal-content">
                        <h3>It is highly advised you provide physical table numbers throughout the space, to help people find each other in a timely manner.</h3>
                        <p>They will be displayed on your attendees screens</p>
                        <div className="modal-buttons">
                            <button type="button" onClick={handleTableModalDismiss}
                                className="modal-button modal-confirm" style={{ width: '100%' }}>
                                Got it! I will provide table numbers at event
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
        </div>
    );
};

export default CreateLobbyView;
