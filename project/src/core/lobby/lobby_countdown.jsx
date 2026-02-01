// src/core/lobby/lobby_countdown.jsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './lobby_countdown.css';

const LobbyCountdown = ({ onComplete }) => {
  const [count, setCount] = useState(7);
  const countdownRef = useRef(null);
  
  useEffect(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }

    countdownRef.current = setInterval(() => {
      setCount(prevCount => {
        if (prevCount <= 1) {
          clearInterval(countdownRef.current);
          if (onComplete) {
            setTimeout(onComplete, 400); // Slight delay for exit animation
          }
          return 0;
        }
        return prevCount - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [onComplete]);

  // Calculate progress for the ring (7 to 0)
  const progress = count / 7;
  const circumference = 2 * Math.PI * 120; // radius = 120
  const strokeDashoffset = circumference * (1 - progress);
  
  return (
    <div className="lobby-countdown-overlay">
      {/* Animated background elements */}
      <div className="countdown-bg-gradient" />
      <div className="countdown-floating-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="orb orb-4" />
      </div>
      
      {/* Main countdown content */}
      <div className="lobby-countdown-content">
        {/* Progress ring */}
        <svg className="countdown-ring" viewBox="0 0 260 260">
          {/* Background ring */}
          <circle
            className="countdown-ring-bg"
            cx="130"
            cy="130"
            r="120"
            fill="none"
            strokeWidth="6"
          />
          {/* Animated progress ring */}
          <motion.circle
            className="countdown-ring-progress"
            cx="130"
            cy="130"
            r="120"
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: 0 }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
          />
        </svg>

        {/* Animated number */}
        <div className="countdown-number-container">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={count}
              className="lobby-countdown-number"
              initial={{ 
                scale: 0.5, 
                opacity: 0,
                filter: "blur(10px)",
                y: 40
              }}
              animate={{ 
                scale: 1, 
                opacity: 1,
                filter: "blur(0px)",
                y: 0
              }}
              exit={{ 
                scale: 1.5, 
                opacity: 0,
                filter: "blur(8px)",
                y: -30
              }}
              transition={{ 
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1] // Custom spring-like easing
              }}
            >
              {count}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Text below */}
        <motion.div 
          className="lobby-countdown-text"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {count > 0 ? 'Get ready!' : 'Starting...'}
        </motion.div>
      </div>

      {/* Pulse effect on each tick */}
      <AnimatePresence>
        <motion.div
          key={count}
          className="countdown-pulse"
          initial={{ scale: 0.8, opacity: 0.5 }}
          animate={{ scale: 2.5, opacity: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </AnimatePresence>
    </div>
  );
};

export default LobbyCountdown;
