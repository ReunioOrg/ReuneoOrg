import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useContext } from 'react';
import { AuthContext } from '../Auth/AuthContext';
import { apiFetch } from '../utils/api';
import './how_to_tutorial.css';

// Slide 2: Animated Volume Slider Component
export const TutorialSlide2 = ({ isActive }) => {
  const [progress, setProgress] = useState(0);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!isActive) return;

    let startTime = null;
    const duration = 4000;

    const animate = (currentTime) => {
      if (startTime === null) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const fraction = Math.min(elapsed / duration, 1);
      setProgress(fraction);

      if (fraction < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive]);

  const displayNumber = Math.round(progress * 100);
  const fillHeight = progress * 100;

  return (
    <div className="slide2-layout">
      <h2 className="slide2-header">
        Raise your volume to 100%
        <span className="slide2-header-sub">
          You need this to know when you've matched.
        </span>
      </h2>

      <div className="slide2-content">
        {/* Chevron arrows pointing left toward volume buttons */}
        <div className="slide2-arrow-section">
          <div className="slide2-chevron-group">
            <svg className="slide2-chevron slide2-chevron-1" width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="#4b73ef" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <svg className="slide2-chevron slide2-chevron-2" width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="#4b73ef" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <svg className="slide2-chevron slide2-chevron-3" width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="#4b73ef" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* Vertical volume slider */}
        <div className="slide2-slider-section">
          {/* Volume loud icon at top */}
          <svg className="slide2-volume-icon" width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path d="M11 5L6 9H2v6h4l5 4V5z" fill="#4b73ef" stroke="#4b73ef" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" stroke="#4b73ef" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>

          <div className={`slide2-number ${progress >= 1 ? 'slide2-number-complete' : ''}`}>
            {displayNumber}
          </div>

          <div className="slide2-track">
            <div className="slide2-track-bg">
              <div 
                className={`slide2-track-fill ${progress >= 1 ? 'slide2-fill-complete' : ''}`}
                style={{ height: `${fillHeight}%` }}
              />
            </div>
          </div>

          {/* Volume muted icon at bottom */}
          <svg className="slide2-volume-icon" width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M11 5L6 9H2v6h4l5 4V5z" fill="#4b73ef" stroke="#4b73ef" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="23" y1="9" x2="17" y2="15" stroke="#4b73ef" strokeWidth="2" strokeLinecap="round"/>
            <line x1="17" y1="9" x2="23" y2="15" stroke="#4b73ef" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
      </div>
    </div>
  );
};

// Slide 3: Interactive Pause Button Tutorial
export const TutorialSlide3 = ({ isActive, onPauseClicked }) => {
  return (
    <div className="slide3-layout">
      <div className="slide3-top-content">
        <h2 className="slide3-header">
          Click 'Pause' to take a break or leave.
        </h2>
        <span className="slide3-subheader">
          You can rejoin at any time.
        </span>
      </div>

      <div className="slide3-phone-frame">
        <div className="slide3-pause-wrapper">
          <button className="slide3-mock-pause" onClick={onPauseClicked}>
            Pause
          </button>
          <span className="slide3-pulse-ring slide3-pulse-ring-1" />
          <span className="slide3-pulse-ring slide3-pulse-ring-2" />
          <span className="slide3-tap-label">Tap here</span>
        </div>
        <img
          src="/assets/stock-woman-cropped.png"
          alt="Profile example"
          className="slide3-phone-image"
        />
      </div>
    </div>
  );
};

// Email collection slide (conditional — shown when organizer enabled match history & user has no email)
const TutorialEmailSlide = ({ isActive, onEmailSubmit, onSkip, onClaimTriggered }) => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [claimState, setClaimState] = useState(null); // null | 'prompt' | 'sending' | 'sent'
  const inputRef = useRef(null);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email.trim());

  useEffect(() => {
    if (isActive && inputRef.current && !claimState) {
      setTimeout(() => inputRef.current?.focus(), 600);
    }
  }, [isActive, claimState]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;

    setEmailError('');
    setIsSubmitting(true);

    try {
      const response = await apiFetch('/update_profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.detail?.toLowerCase().includes('already associated')) {
          setClaimState('prompt');
          setEmailError('');
        } else {
          setEmailError(errorData.detail || 'Failed to save email.');
        }
        setIsSubmitting(false);
        return;
      }

      onEmailSubmit();
    } catch (err) {
      console.error('Tutorial email save error:', err);
      setEmailError('Something went wrong. Try again.');
      setIsSubmitting(false);
    }
  };

  const handleClaimAccount = async () => {
    setClaimState('sending');

    try {
      const response = await apiFetch('/auth/claim-existing-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });

      const data = await response.json();
      if (data.success) {
        setClaimState('sent');
        if (onClaimTriggered) onClaimTriggered();
      } else {
        setEmailError(data.error || 'Failed to send verification email.');
        setClaimState('prompt');
      }
    } catch (err) {
      console.error('Account claim error:', err);
      setEmailError('Something went wrong. Try again.');
      setClaimState('prompt');
    }
  };

  const handleBackToInput = () => {
    setClaimState(null);
    setEmail('');
    setEmailError('');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // Claim sent confirmation — user can continue to congrats
  if (claimState === 'sent') {
    return (
      <div className="slide-email-layout">
        <div className="slide-email-content">
          <div className="slide-email-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M22 4L12 14.01l-3-3" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="slide-email-header">Check Your Email</h2>
          <p className="slide-email-subheader">
            We sent a verification link to <strong>{email}</strong>. Click it to merge your matches into your existing account.
          </p>

          <button
            type="button"
            className="slide-email-cta slide-email-cta-active"
            onClick={onSkip}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // Claim prompt — email is already associated, offer to claim
  if (claimState === 'prompt' || claimState === 'sending') {
    return (
      <div className="slide-email-layout">
        <div className="slide-email-content">
          <div className="slide-email-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#4b73ef" strokeWidth="1.5"/>
              <path d="M12 8v4M12 16h.01" stroke="#4b73ef" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="slide-email-header">Welcome Back</h2>
          <p className="slide-email-subheader">
            <strong>{email}</strong> is linked to an existing account. Claim it to merge your matches.
          </p>

          {emailError && (
            <div className="slide-email-error">{emailError}</div>
          )}

          <button
            type="button"
            className="slide-email-cta slide-email-cta-active"
            onClick={handleClaimAccount}
            disabled={claimState === 'sending'}
          >
            {claimState === 'sending' ? 'Sending...' : 'Claim My Account'}
          </button>

          <button
            type="button"
            className="slide-email-cta slide-email-cta-secondary"
            onClick={handleBackToInput}
          >
            Use a Different Email
          </button>
        </div>

        <button className="slide-email-skip" onClick={onSkip} aria-label="Opt out">
          <span className="slide-email-skip-text">Opt out</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M9 18l6-6-6-6" stroke="#b0b0b0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    );
  }

  // Default state — email input form
  return (
    <div className="slide-email-layout">
      <div className="slide-email-content">
        <div className="slide-email-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="4" width="20" height="16" rx="3" stroke="#4b73ef" strokeWidth="1.5" />
            <path d="M2 7l10 7 10-7" stroke="#4b73ef" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h2 className="slide-email-header">Save Your Connections</h2>
        <p className="slide-email-subheader">
          Enter your email to access your match history after the event.
        </p>

        <form className="slide-email-form" onSubmit={handleSubmit}>
          <div className="slide-email-input-wrapper">
            <input
              ref={inputRef}
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
              placeholder="you@example.com"
              className={`slide-email-input ${emailError ? 'slide-email-input-error' : ''} ${isValid ? 'slide-email-input-valid' : ''}`}
              disabled={isSubmitting}
              autoComplete="email"
            />
          </div>

          {emailError && (
            <div className="slide-email-error">{emailError}</div>
          )}

          <button
            type="submit"
            className={`slide-email-cta ${isValid && !isSubmitting ? 'slide-email-cta-active' : ''}`}
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Continue'}
          </button>
        </form>
      </div>

      <button className="slide-email-skip" onClick={onSkip} aria-label="Opt out">
        <span className="slide-email-skip-text">Opt out</span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M9 18l6-6-6-6" stroke="#b0b0b0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
};

const HowToTutorial = ({ onComplete, lobbyCode = 'this', showEmailSlide = false, onClaimTriggered }) => {
  const { userProfile } = useContext(AuthContext);
  const [currentSlide, setCurrentSlide] = useState(0);
  const currentSlideRef = useRef(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isTextAnimating, setIsTextAnimating] = useState(false);
  const [visibleSlides, setVisibleSlides] = useState([0]);
  const [showAnimatedText, setShowAnimatedText] = useState(false);
  const [tutorialCompleting, setTutorialCompleting] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);
  const intervalRef = useRef(null);
  const transitionTimeoutRef = useRef(null);
  const hasCompleted = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const showEmailSlideRef = useRef(showEmailSlide);


  const safeComplete = () => {
    if (hasCompleted.current) return;
    hasCompleted.current = true;
    if (onCompleteRef.current) onCompleteRef.current();
  };

  // Build slides dynamically — email slide inserted after pause only when showEmailSlide was true at mount
  const slides = useMemo(() => {
    const base = [
      { type: 'blank', duration: 2000 },
      { type: 'volume', customSlide: true, duration: 4000 },
      { type: 'pause', customSlide: true, duration: 10000 },
    ];
    if (showEmailSlideRef.current) {
      base.push({ type: 'email', customSlide: true, duration: null });
    }
    return base;
  }, []);

  const advanceFromCurrentSlide = () => {
    if (intervalRef.current) clearTimeout(intervalRef.current);
    if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);

    const slide = currentSlideRef.current;

    if (slide >= slides.length - 1) {
      if (!hasCompleted.current) {
        setTutorialCompleting(true);
        setTimeout(() => {
          setShowCongrats(true);
          setTimeout(() => { safeComplete(); }, 1500);
        }, 500);
      }
      return;
    }

    setIsAnimating(true);
    const nextSlideIndex = slide + 1;
    setVisibleSlides([slide, nextSlideIndex]);

    transitionTimeoutRef.current = setTimeout(() => {
      setShowAnimatedText(false);
      currentSlideRef.current = nextSlideIndex;
      setCurrentSlide(nextSlideIndex);
      setIsAnimating(false);
      setTimeout(() => {
        setVisibleSlides([nextSlideIndex]);
        setIsTextAnimating(true);
        if (slides[nextSlideIndex].animatedText) {
          setShowAnimatedText(true);
        }
      }, 500);
    }, 500);
  };

  const handleSlide3PauseClicked = () => {
    if (hasCompleted.current) return;
    advanceFromCurrentSlide();
  };

  const handleEmailSubmit = () => {
    advanceFromCurrentSlide();
  };

  const handleEmailSkip = () => {
    advanceFromCurrentSlide();
  };

  const advanceRef = useRef(advanceFromCurrentSlide);
  advanceRef.current = advanceFromCurrentSlide;

  // Slide transition timer — skips indefinite-duration slides
  useEffect(() => {
    const currentDuration = slides[currentSlide]?.duration;

    if (!currentDuration) return;

    intervalRef.current = setTimeout(() => {
      advanceRef.current();
    }, currentDuration);
    setIsTextAnimating(true);

    if (currentSlide === 0 && slides[0].animatedText) {
      setShowAnimatedText(true);
    }

    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current);
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
    };
  }, [currentSlide, slides]);

  const isOnEmailSlide = slides[currentSlide]?.type === 'email';

  return (
    <div className="tutorial-overlay">
      <div className="tutorial-container">
        {showCongrats && (
          <div className="slide3-congrats">
            <h2 className="slide3-congrats-text">Congratulations! You are ready.</h2>
          </div>
        )}

        {visibleSlides.map((slideIndex) => (
          <div 
            key={slideIndex}
            className={`tutorial-slide ${
              slideIndex === currentSlide ? 'current' :
              slideIndex < currentSlide ? 'previous' : 'next'
            } ${tutorialCompleting ? 'tutorial-fading' : ''}`}
          >
            {slideIndex === currentSlide && slides[slideIndex].animatedText && showAnimatedText && (
              <div className="animated-text pop-burst">
                {slides[slideIndex].animatedText}
              </div>
            )}
            {slides[slideIndex].type === 'volume' ? (
              <TutorialSlide2 isActive={slideIndex === currentSlide} />
            ) : slides[slideIndex].type === 'email' ? (
              <TutorialEmailSlide isActive={slideIndex === currentSlide} onEmailSubmit={handleEmailSubmit} onSkip={handleEmailSkip} onClaimTriggered={onClaimTriggered} />
            ) : slides[slideIndex].type === 'pause' ? (
              <TutorialSlide3 isActive={slideIndex === currentSlide} onPauseClicked={handleSlide3PauseClicked} />
            ) : null}
            <div className={`tutorial-text ${isTextAnimating && slideIndex === currentSlide ? 'text-animate' : ''}`}>
              {slides[slideIndex].text}
            </div>
          </div>
        ))}
        {!isOnEmailSlide && (
          <div className={`tutorial-progress-bar-container ${tutorialCompleting ? 'tutorial-fading' : ''}`}>
            <div className="tutorial-progress-bar">
              <div className="tutorial-progress-bar-fill"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HowToTutorial;
