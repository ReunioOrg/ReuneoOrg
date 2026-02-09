import React, { useState, useEffect, useRef } from 'react';
import { useContext } from 'react';
import { AuthContext } from '../Auth/AuthContext';
import './how_to_tutorial.css';

// Slide 2: Animated Volume Slider Component
const TutorialSlide2 = ({ isActive }) => {
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
const TutorialSlide3 = ({ isActive, onPauseClicked }) => {
  const layoutRef = useRef(null);
  const subheaderRef = useRef(null);
  const pauseBtnRef = useRef(null);
  const cursorRef = useRef(null);
  const animFrameRef = useRef(null);
  const startPos = useRef({ x: 0, y: 0 });
  const endPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!isActive) return;

    const calculatePositions = () => {
      if (!layoutRef.current || !subheaderRef.current || !pauseBtnRef.current) return;
      const layoutRect = layoutRef.current.getBoundingClientRect();
      const subheaderRect = subheaderRef.current.getBoundingClientRect();
      const btnRect = pauseBtnRef.current.getBoundingClientRect();
      // Start: horizontally centered below the sub-header
      startPos.current = {
        x: (subheaderRect.left + subheaderRect.right) / 2 - layoutRect.left,
        y: subheaderRect.bottom - layoutRect.top + 12
      };
      // End: center of the Pause button
      endPos.current = {
        x: (btnRect.left + btnRect.right) / 2 - layoutRect.left,
        y: (btnRect.top + btnRect.bottom) / 2 - layoutRect.top
      };
    };

    const lerp = (a, b, t) => a + (b - a) * t;
    const easeInOut = (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

    let startTime = null;
    const duration = 3500; // matches ripple animation

    const animate = (currentTime) => {
      if (!cursorRef.current) {
        animFrameRef.current = requestAnimationFrame(animate);
        return;
      }
      if (startTime === null) startTime = currentTime;
      const elapsed = (currentTime - startTime) % duration;
      const progress = elapsed / duration;

      const sx = startPos.current.x;
      const sy = startPos.current.y;
      const ex = endPos.current.x;
      const ey = endPos.current.y;

      let x, y, scale, rotation;

      if (progress <= 0.35) {
        // Move from start to button
        const t = easeInOut(progress / 0.35);
        x = lerp(sx, ex, t);
        y = lerp(sy, ey, t);
        scale = 1;
        rotation = lerp(0, 10, t);
      } else if (progress <= 0.45) {
        // Tap down
        x = ex; y = ey;
        scale = lerp(1, 0.8, (progress - 0.35) / 0.1);
        rotation = 10;
      } else if (progress <= 0.55) {
        // Release
        x = ex; y = ey;
        scale = lerp(0.8, 1, (progress - 0.45) / 0.1);
        rotation = 10;
      } else if (progress <= 0.90) {
        // Move back to start
        const t = easeInOut((progress - 0.55) / 0.35);
        x = lerp(ex, sx, t);
        y = lerp(ey, sy, t);
        scale = 1;
        rotation = lerp(10, 0, t);
      } else {
        // Pause at start
        x = sx; y = sy;
        scale = 1;
        rotation = 0;
      }

      cursorRef.current.style.left = `${x}px`;
      cursorRef.current.style.top = `${y}px`;
      cursorRef.current.style.transform = `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`;

      animFrameRef.current = requestAnimationFrame(animate);
    };

    // Small delay to ensure DOM layout is ready before calculating positions
    const initTimeout = setTimeout(() => {
      calculatePositions();
      animFrameRef.current = requestAnimationFrame(animate);
    }, 50);

    // Recalculate positions on resize (e.g. DevTools device switch)
    window.addEventListener('resize', calculatePositions);

    return () => {
      clearTimeout(initTimeout);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', calculatePositions);
    };
  }, [isActive]);

  return (
    <div className="slide3-layout" ref={layoutRef}>
      {/* Header content at the top */}
      <div className="slide3-top-content">
        <h2 className="slide3-header">
          Click 'Pause' to take a break or leave.
        </h2>
        <span className="slide3-subheader" ref={subheaderRef}>
          You can rejoin at any time.
        </span>
      </div>

      {/* Phone frame mockup */}
      <div className="slide3-phone-frame">
        <button className="slide3-mock-pause" ref={pauseBtnRef} onClick={onPauseClicked}>
          Pause
        </button>
        <span className="slide3-tap-hint">Tap here to continue</span>
        <img
          src="/assets/stock-woman-cropped.png"
          alt="Profile example"
          className="slide3-phone-image"
        />
      </div>

      {/* Animated finger cursor - JS-driven to dynamically track element positions */}
      {isActive && (
        <div className="slide3-finger-cursor" ref={cursorRef}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
            <path
              d="M11.5 2A1.5 1.5 0 0 0 10 3.5V12l-2.3-2.3a1.5 1.5 0 0 0-2.12 2.12l5.16 5.16A4.5 4.5 0 0 0 13.92 18.5h1.58A3.5 3.5 0 0 0 19 15V8a1.5 1.5 0 0 0-3 0v-.5a1.5 1.5 0 0 0-3 0V7a1.5 1.5 0 0 0-3 0V3.5A1.5 1.5 0 0 0 11.5 2z"
              fill="#4b73ef"
              opacity="0.9"
            />
          </svg>
        </div>
      )}
    </div>
  );
};

const HowToTutorial = ({ onComplete, lobbyCode = 'this' }) => {
  const { userProfile } = useContext(AuthContext);
  const [currentSlide, setCurrentSlide] = useState(0);
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
  onCompleteRef.current = onComplete; // Keep ref in sync every render

  // Safe completion guard - prevents double-calling onComplete
  const safeComplete = () => {
    if (hasCompleted.current) return;
    hasCompleted.current = true;
    if (onCompleteRef.current) onCompleteRef.current();
  };

  // Handler for when user clicks mock Pause button on slide 3
  const handleSlide3PauseClicked = () => {
    if (hasCompleted.current) return;
    // Clear auto-advance timer
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
    // Start the completion flow: fade out → congrats → exit
    setTutorialCompleting(true);
    setTimeout(() => {
      setShowCongrats(true);
      setTimeout(() => {
        safeComplete();
      }, 1500);
    }, 500);
  };

  // Slide data with custom durations
  const slides = [
    {
      // Empty white slide — no image or text
      duration: 2000, // 2 seconds for first slide
    },
    {
      customSlide: true, // Uses TutorialSlide2 component instead of an image
      duration: 4000, // 4 seconds for second slide
    },
    {
      customSlide: true, // Uses TutorialSlide3 component
      duration: 10000, // 10 seconds max for interactive slide
    }
  ];
  
  // Effect for slide transitions
  useEffect(() => {
    // Function to advance to the next slide
    const advanceSlide = () => {
      // Check if we're at the last slide
      if (currentSlide >= slides.length - 1) {
        clearInterval(intervalRef.current);
        // Same fade + congrats flow as the Pause button click
        if (!hasCompleted.current) {
          setTutorialCompleting(true);
          setTimeout(() => {
            setShowCongrats(true);
            setTimeout(() => {
              safeComplete();
            }, 1500);
          }, 500);
        }
        return;
      }

      // Start the transition
      setIsAnimating(true);
      
      // Add next slide to visible slides
      const nextSlideIndex = currentSlide + 1;
      setVisibleSlides([currentSlide, nextSlideIndex]);
      
      // After animation starts, update the slide
      transitionTimeoutRef.current = setTimeout(() => {
        // Only hide animated text when we're actually transitioning to the next slide
        setShowAnimatedText(false);
        
        setCurrentSlide(nextSlideIndex);
        setIsAnimating(false);
        
        // Remove the previous slide after transition
        setTimeout(() => {
          setVisibleSlides([nextSlideIndex]);
          
          // Start text animation after slide change is complete
          setIsTextAnimating(true);
          
          // Show animated text for the current slide
          if (slides[nextSlideIndex].animatedText) {
            setShowAnimatedText(true);
          }
        }, 500);
      }, 500);
    };
    
    // Start the slideshow with the appropriate duration for the current slide
    intervalRef.current = setInterval(advanceSlide, slides[currentSlide].duration);
    
    // Initial text animation for first slide
    setIsTextAnimating(true);
    
    // Show animated text for the first slide on initial render
    if (currentSlide === 0 && slides[0].animatedText) {
      setShowAnimatedText(true);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, [currentSlide, slides.length]);
  
  return (
    <div className="tutorial-overlay">
      <div className="tutorial-container">
        {/* Congratulations message - renders on top after slide 3 completion */}
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
            {slideIndex === 1 ? (
              <TutorialSlide2 isActive={slideIndex === currentSlide} />
            ) : slideIndex === 2 ? (
              <TutorialSlide3 isActive={slideIndex === currentSlide} onPauseClicked={handleSlide3PauseClicked} />
            ) : null}
            <div className={`tutorial-text ${isTextAnimating && slideIndex === currentSlide ? 'text-animate' : ''}`}>
              {slides[slideIndex].text}
            </div>
          </div>
        ))}
        <div className={`tutorial-progress-bar-container ${tutorialCompleting ? 'tutorial-fading' : ''}`}>
          <div className="tutorial-progress-bar">
            <div className="tutorial-progress-bar-fill"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowToTutorial;
