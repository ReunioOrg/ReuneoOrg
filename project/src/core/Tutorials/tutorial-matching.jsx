import React, { useState, useEffect, useCallback } from 'react';
import './tutorial-matching.css';

const SCENES = [
    { id: 'enter', duration: 2000 },
    { id: 'labels-ima', duration: 1200 },
    { id: 'labels-meet', duration: 1800 },
];

const PersonIcon = ({ color = '#144dff' }) => (
    <svg viewBox="0 0 48 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="12" r="9" fill={color} />
        <polygon points="24,14 5,60 43,60" fill={color} />
    </svg>
);

const TutorialMatching = ({ isVisible, onComplete }) => {
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

    return (
        <div className={`matching-tutorial-overlay ${fadingOut ? 'tutorial-fade-out' : ''}`}>
            <div className="tutorial-stage">
                {/* Left person — Founder */}
                <div className="tutorial-person tutorial-person-left">
                    <div className="tutorial-labels">
                        {sceneIndex >= 1 && (
                            <div className="tutorial-label-group tutorial-label-slide">
                                <span className="tutorial-label-text">I'm a:</span>
                                <span className="tutorial-label-tag">FOUNDER</span>
                            </div>
                        )}
                        {sceneIndex >= 2 && (
                            <div className="tutorial-label-group tutorial-label-slide">
                                <span className="tutorial-label-text">I want to meet:</span>
                                <span className="tutorial-label-tag">INVESTOR</span>
                            </div>
                        )}
                    </div>
                    <div className="tutorial-person-hop">
                        <PersonIcon />
                    </div>
                </div>

                {/* Right person — Investor */}
                <div className="tutorial-person tutorial-person-right">
                    <div className="tutorial-labels">
                        {sceneIndex >= 1 && (
                            <div className="tutorial-label-group tutorial-label-slide">
                                <span className="tutorial-label-text">I'm a:</span>
                                <span className="tutorial-label-tag">INVESTOR</span>
                            </div>
                        )}
                        {sceneIndex >= 2 && (
                            <div className="tutorial-label-group tutorial-label-slide">
                                <span className="tutorial-label-text">I want to meet:</span>
                                <span className="tutorial-label-tag">FOUNDER</span>
                            </div>
                        )}
                    </div>
                    <div className="tutorial-person-hop">
                        <PersonIcon />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TutorialMatching;
