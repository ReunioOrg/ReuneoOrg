import React, { useState, useEffect, useCallback } from 'react';
import './tutorial-random-matching.css';

const SCENES = [
    { id: 'enter', duration: 2000 },            // 0
    { id: 'close-together', duration: 1500 },   // 1
    { id: 'match-text', duration: 1800 },       // 2
    { id: 'move-to-corner', duration: 1500 },   // 3
    { id: 'enter2', duration: 1400 },           // 4
    { id: 'close-together2', duration: 1000 },  // 5
    { id: 'match-text2', duration: 1400 },      // 6
    { id: 'move-to-corner2', duration: 1200 },  // 7
    { id: 'fill-row', duration: 3400 },         // 8
];

const FILL_POSITIONS = [75, 70, 65, 60, 55, 50, 45, 40, 35, 30, 25, 20, 15, 10, 5];
const FILL_HOPPERS = new Set([75, 65, 55, 45, 35, 25, 15, 5]);

const CHAT_BLURBS = [
    { text: "Favorite hobby?", left: 88, top: 56, delay: 0.15 },
    { text: "How's your day?", left: 67, top: 48, delay: 0.4 },
    { text: "How are you?",    left: 45, top: 60, delay: 0.65 },
    { text: "Love that!",      left: 25, top: 50, delay: 0.9 },
    { text: "Same!",           left: 8,  top: 58, delay: 1.15 },
];

const PersonIcon = ({ color = '#3b82f6' }) => (
    <svg viewBox="0 0 48 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="10" r="9" fill={color} />
        <rect x="10" y="23" width="28" height="40" rx="14" fill={color} />
    </svg>
);

const TutorialRandomMatching = ({ isVisible, onComplete }) => {
    const [currentScene, setCurrentScene] = useState(0);
    const [fadingOut, setFadingOut] = useState(false);

    const finishTutorial = useCallback(() => {
        setFadingOut(true);
        setTimeout(() => {
            onComplete?.();
        }, 600);
    }, [onComplete]);

    useEffect(() => {
        if (!isVisible) {
            setCurrentScene(0);
            setFadingOut(false);
            return;
        }

        let elapsed = 0;
        const timers = [];

        SCENES.forEach((scene, index) => {
            if (index > 0) {
                const timer = setTimeout(() => setCurrentScene(index), elapsed);
                timers.push(timer);
            }
            elapsed += scene.duration;
        });

        const endTimer = setTimeout(() => finishTutorial(), elapsed);
        timers.push(endTimer);

        return () => timers.forEach(clearTimeout);
    }, [isVisible, finishTutorial]);

    if (!isVisible) return null;

    const sceneIndex = currentScene;

    const getHeaderText = (scene) => {
        if (scene >= 0 && scene <= 3) return "Everyone gets paired with someone new!";
        if (scene >= 4 && scene <= 7) return "This is the most recommended use case if you are just starting out";
        if (scene === 8) return "The fastest way to create many quality interactions for your all your attendees!";
        return null;
    };

    const headerText = getHeaderText(sceneIndex);

    return (
        <div className={`random-matching-tutorial-overlay ${fadingOut ? 'rmt-fade-out' : ''}`}>
            <div className="rmt-wrapper">
                <div className="rmt-header-container">
                    {headerText && (
                        <span className="rmt-header-text" key={headerText}>{headerText}</span>
                    )}
                </div>
            <div className="rmt-stage">
                {/* Round 1 — Left person */}
                <div className={`rmt-person rmt-person-left ${sceneIndex >= 1 ? 'rmt-person-close' : ''} ${sceneIndex >= 3 ? 'rmt-person-corner rmt-person-behind' : ''}`}>
                    <div className="rmt-person-hop">
                        <PersonIcon />
                    </div>
                </div>

                {/* Round 1 — Right person */}
                <div className={`rmt-person rmt-person-right ${sceneIndex >= 1 ? 'rmt-person-close' : ''} ${sceneIndex >= 3 ? 'rmt-person-corner' : ''}`}>
                    <div className="rmt-person-hop">
                        <PersonIcon />
                    </div>
                </div>

                {/* "Nice to meet you!" toast */}
                {(sceneIndex === 2 || sceneIndex === 6) && (
                    <div className="rmt-match-toast" key={sceneIndex}>
                        <span className="rmt-match-text">Nice to meet you!</span>
                        <div className="rmt-confetti-burst">
                            {[1,2,3,4,5,6,7,8].map(n => (
                                <span key={n} className={`rmt-conf rmt-c${n}`} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Round 2 — Left person */}
                {sceneIndex >= 4 && (
                    <div className={`rmt-person rmt-person-left-r2 ${sceneIndex >= 5 ? 'rmt-person-close' : ''} ${sceneIndex >= 7 ? 'rmt-person-corner-r2 rmt-person-behind' : ''}`}>
                        <div className="rmt-person-hop">
                            <PersonIcon />
                        </div>
                    </div>
                )}

                {/* Round 2 — Right person */}
                {sceneIndex >= 4 && (
                    <div className={`rmt-person rmt-person-right-r2 ${sceneIndex >= 5 ? 'rmt-person-close' : ''} ${sceneIndex >= 7 ? 'rmt-person-corner-r2' : ''}`}>
                        <div className="rmt-person-hop">
                            <PersonIcon />
                        </div>
                    </div>
                )}

                {/* Round 3 — Rapid fill */}

                {sceneIndex >= 8 && FILL_POSITIONS.map((pos, i) => {
                    const isHopper = FILL_HOPPERS.has(pos);
                    return (
                        <div
                            key={`fill-${pos}`}
                            className="rmt-person rmt-person-fill"
                            style={{
                                left: `${pos}%`,
                                animationDelay: `${i * 0.12}s`,
                            }}
                        >
                            <div
                                className={`rmt-person-hop ${isHopper ? 'rmt-fill-hopper' : ''}`}
                                style={isHopper ? { animationDelay: `${i * 0.12 + 0.5}s` } : undefined}
                            >
                                <PersonIcon />
                            </div>
                        </div>
                    );
                })}

                {/* Conversation blurbs */}

                {sceneIndex >= 8 && CHAT_BLURBS.map((blurb, i) => (
                    <div
                        key={`blurb-${i}`}
                        className="rmt-chat-blurb"
                        style={{
                            left: `${blurb.left}%`,
                            top: `${blurb.top}%`,
                            animationDelay: `${blurb.delay}s`,
                        }}
                    >
                        <span className="rmt-blurb-text">{blurb.text}</span>
                        <div className="rmt-confetti-burst">
                            {[1,2,3,4,5,6,7,8].map(n => (
                                <span key={n} className={`rmt-conf rmt-c${n}`} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            </div>
            <button className="rmt-skip" onClick={finishTutorial}>
                skip <span className="rmt-skip-arrow">{'\u2192'}</span>
            </button>
        </div>
    );
};

export default TutorialRandomMatching;
