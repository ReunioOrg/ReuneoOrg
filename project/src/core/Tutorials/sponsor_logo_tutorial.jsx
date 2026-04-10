import React from 'react';
import './sponsor_logo_tutorial.css';

const TIMER_RADIUS = 42;
const TIMER_CIRCUMFERENCE = 2 * Math.PI * TIMER_RADIUS;

const SponsorLogoTutorial = ({ logoSrc, minutes, seconds }) => {
    const totalSeconds = (parseInt(minutes) || 0) * 60 + (parseInt(seconds) || 0);
    const displaySeconds = Math.max(totalSeconds - 5, 0);
    const displayMin = Math.floor(displaySeconds / 60);
    const displaySec = displaySeconds % 60;
    const timeLabel = `${displayMin}:${String(displaySec).padStart(2, '0')}`;

    const progress = totalSeconds > 0 ? displaySeconds / totalSeconds : 0;
    const dashOffset = TIMER_CIRCUMFERENCE * (1 - progress);

    return (
        <div className="slt-wrapper">
            <div className="slt-phone">
                <div className="slt-notch" />

                <div className="slt-screen">
                    <p className="slt-info-text">
                        Visible brand recognition for real engagement
                    </p>

                    <div className="slt-match-name">Go find Jonah!</div>

                    <div className="slt-logo-timer-row">
                        <div className="slt-logo-section">
                            <img
                                src={logoSrc}
                                alt="Sponsor logo"
                                className="slt-logo-img"
                            />
                            <span className="slt-ring slt-ring-1" />
                            <span className="slt-ring slt-ring-2" />
                        </div>

                        <div className="slt-timer">
                            <svg className="slt-timer-svg" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r={TIMER_RADIUS} className="slt-timer-track" />
                                <circle
                                    cx="50" cy="50" r={TIMER_RADIUS}
                                    className="slt-timer-fill"
                                    strokeDasharray={TIMER_CIRCUMFERENCE}
                                    strokeDashoffset={dashOffset}
                                />
                            </svg>
                            <div className="slt-timer-label">
                                <span className="slt-timer-digits">{timeLabel}</span>
                                <span className="slt-timer-sub">time left</span>
                            </div>
                        </div>
                    </div>

                    <div className="slt-profile-card">
                        <img
                            src="/assets/topaz_jones.png"
                            alt="Topaz Jones"
                            className="slt-profile-img"
                        />
                    </div>

                    <div className="slt-screen-overlay" />
                </div>

                <div className="slt-home-indicator" />
            </div>
        </div>
    );
};

export default SponsorLogoTutorial;
