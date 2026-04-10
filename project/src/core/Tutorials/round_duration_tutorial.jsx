import React from 'react';
import './round_duration_tutorial.css';

const TIMER_RADIUS = 42;
const TIMER_CIRCUMFERENCE = 2 * Math.PI * TIMER_RADIUS;

const RoundDurationTutorial = ({ minutes, seconds }) => {
    const totalSeconds = (parseInt(minutes) || 0) * 60 + (parseInt(seconds) || 0);
    const displaySeconds = Math.max(totalSeconds - 5, 0);
    const displayMin = Math.floor(displaySeconds / 60);
    const displaySec = displaySeconds % 60;
    const timeLabel = `${displayMin}:${String(displaySec).padStart(2, '0')}`;

    const progress = totalSeconds > 0 ? displaySeconds / totalSeconds : 0;
    const dashOffset = TIMER_CIRCUMFERENCE * (1 - progress);

    return (
        <div className="rdt-wrapper">
            <div className="rdt-phone">
                <div className="rdt-notch" />

                <div className="rdt-screen">
                    <p className="rdt-info-text">
                        Everyone's timer is synced, ringing together at the same time
                    </p>

                    <div className="rdt-match-name">Go find Sarah!</div>

                    <div className="rdt-timer-section">
                        <div className="rdt-timer">
                            <svg className="rdt-timer-svg" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r={TIMER_RADIUS} className="rdt-timer-track" />
                                <circle
                                    cx="50" cy="50" r={TIMER_RADIUS}
                                    className="rdt-timer-fill"
                                    strokeDasharray={TIMER_CIRCUMFERENCE}
                                    strokeDashoffset={dashOffset}
                                />
                            </svg>
                            <div className="rdt-timer-label">
                                <span className="rdt-timer-digits">{timeLabel}</span>
                                <span className="rdt-timer-sub">time left</span>
                            </div>
                        </div>
                        <span className="rdt-ring rdt-ring-1" />
                        <span className="rdt-ring rdt-ring-2" />
                    </div>

                    <div className="rdt-profile-card">
                        <img
                            src="/assets/sarah_ramirez.png"
                            alt="Sarah Ramirez"
                            className="rdt-profile-img"
                        />
                    </div>

                    <div className="rdt-screen-overlay" />
                </div>

                <div className="rdt-home-indicator" />
            </div>
        </div>
    );
};

export default RoundDurationTutorial;
