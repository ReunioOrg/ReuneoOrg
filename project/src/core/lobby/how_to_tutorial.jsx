import React, { useState, useEffect, useRef } from 'react';
import { useContext } from 'react';
import { AuthContext } from '../Auth/AuthContext';
import './how_to_tutorial.css';

const HowToTutorial = ({ onComplete, lobbyCode = 'this' }) => {
  const { userProfile } = useContext(AuthContext);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isTextAnimating, setIsTextAnimating] = useState(false);
  const [visibleSlides, setVisibleSlides] = useState([0]);
  const [showAnimatedText, setShowAnimatedText] = useState(false);
  const intervalRef = useRef(null);
  const transitionTimeoutRef = useRef(null);
  
  // Slide data with custom durations
  const slides = [
    {
      image: userProfile?.image_data ? `data:image/jpeg;base64,${userProfile.image_data}` : '/assets/how_to_pt1_1.svg',
      // text: 'Welcome to the lobby! Here you can see who else is joining.',
      duration: 2000, // 1.5 second for first slide
      animatedText: 'Find your match using their profile picture!'
    },
    {
      image: '/assets/how_to_pt2_2.svg',
      // text: 'Select your tags to help us match you with the right people.',
      duration: 4000, // 4 seconds for second slide
      animatedText: 'Raise the volume, you need it to know whats going on!'
    },
    {
      image: '/assets/how_to_pt3_3.svg',
      // text: 'When the game starts, you\'ll be paired with someone for a conversation.',
      duration: 4000, // 4 seconds for third slide
      animatedText: 'Tap this to stop or pause, you can rejoin anytime'
    }
  ];
  
  // Effect for slide transitions
  useEffect(() => {
    // Function to advance to the next slide
    const advanceSlide = () => {
      // Check if we're at the last slide
      if (currentSlide >= slides.length - 1) {
        clearInterval(intervalRef.current);
        if (onComplete) onComplete();
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
  }, [currentSlide, slides.length, onComplete]);
  
  return (
    <div className="tutorial-overlay">
      <div className="tutorial-container">
        {visibleSlides.map((slideIndex) => (
          <div 
            key={slideIndex}
            className={`tutorial-slide ${
              slideIndex === currentSlide ? 'current' :
              slideIndex < currentSlide ? 'previous' : 'next'
            }`}
          >
            {slideIndex === currentSlide && slides[slideIndex].animatedText && showAnimatedText && (
              <div className="animated-text pop-burst">
                {slides[slideIndex].animatedText}
              </div>
            )}
            {slideIndex === 1 && (
              <div className="volume-arrow-container">
                <svg 
                  className="volume-arrow" 
                  width="40" 
                  height="40" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    d="M19 12H5M5 12L12 5M5 12L12 19" 
                    stroke="#144dff" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
            <div className={`tutorial-image-container ${slideIndex === 0 ? 'first-slide' : ''}`}>
              <img 
                src={slides[slideIndex].image} 
                alt={`Tutorial step ${slideIndex + 1}`} 
                className="tutorial-image"
              />
            </div>
            <div className={`tutorial-text ${isTextAnimating && slideIndex === currentSlide ? 'text-animate' : ''}`}>
              {slides[slideIndex].text}
            </div>
          </div>
        ))}
        <div className="tutorial-progress">
          {slides.map((_, index) => (
            <div 
              key={index} 
              className={`progress-dot ${index === currentSlide ? 'active' : ''}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HowToTutorial;
