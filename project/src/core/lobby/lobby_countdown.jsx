// src/core/lobby/lobby_countdown.jsx
import React, { useState, useEffect, useRef } from 'react';
import './lobby_countdown.css'; // We'll create this next

const LobbyCountdown = ({ onComplete }) => {
  const [count, setCount] = useState(5);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef(null);
  const countdownRef = useRef(null);
  
  useEffect(() => {
    // Clear any existing animations when component mounts or updates
    if (animationRef.current) {
      clearTimeout(animationRef.current);
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }

    // Start the countdown
    countdownRef.current = setInterval(() => {
      setIsAnimating(true);
      
      // Use a ref to track the animation timeout
      animationRef.current = setTimeout(() => {
        setCount(prevCount => {
          if (prevCount <= 1) {
            // Clear both interval and timeout when countdown finishes
            if (countdownRef.current) {
              clearInterval(countdownRef.current);
            }
            if (animationRef.current) {
              clearTimeout(animationRef.current);
            }
            // Call onComplete when countdown finishes
            if (onComplete) onComplete();
            return 0;
          }
          return prevCount - 1;
        });
        setIsAnimating(false);
      }, 500);
      
    }, 1500);

    // Cleanup function
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, [onComplete]); // Only re-run effect if onComplete changes
  
  // Add a class to handle the animation state
  const animationClass = isAnimating ? 'pop-burst' : '';
  
  return (
    <div className="lobby-countdown-overlay">
      <div className={`lobby-countdown-container ${animationClass}`}>
        <div className="lobby-countdown-number">{count}</div>
        <div className="lobby-countdown-text">
          {count > 0 ? 'Get ready!' : 'Starting...'}
        </div>
      </div>
    </div>
  );
};

export default LobbyCountdown;