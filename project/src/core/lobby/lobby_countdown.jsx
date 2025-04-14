// src/core/lobby/lobby_countdown.jsx
import React, { useState, useEffect } from 'react';
import './lobby_countdown.css'; // We'll create this next

const LobbyCountdown = ({ onComplete }) => {
  const [count, setCount] = useState(5);
  const [isAnimating, setIsAnimating] = useState(false);
  
  useEffect(() => {
    // Start the countdown when component mounts
    const interval = setInterval(() => {
      setIsAnimating(true);
      
      // After animation starts, update the count
      setTimeout(() => {
        setCount(prevCount => {
          if (prevCount <= 1) {
            clearInterval(interval);
            // Call onComplete when countdown finishes
            if (onComplete) onComplete();
            return 0;
          }
          return prevCount - 1;
        });
        setIsAnimating(false);
      }, 500); // Half a second for the animation
      
    }, 1500); // 1.5 seconds between each count
    
    return () => clearInterval(interval);
  }, [onComplete]);
  
  return (
    <div className="lobby-countdown-overlay">
      <div className={`lobby-countdown-container ${isAnimating ? 'pop-burst' : ''}`}>
        <div className="lobby-countdown-number">{count}</div>
        <div className="lobby-countdown-text">
          {count > 0 ? 'Get ready!' : 'Starting...'}
        </div>
      </div>
    </div>
  );
};

export default LobbyCountdown;