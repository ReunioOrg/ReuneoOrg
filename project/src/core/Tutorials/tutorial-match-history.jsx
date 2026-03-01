import React, { useState, useEffect } from 'react';
import { FaEnvelope, FaInstagram, FaLinkedinIn } from 'react-icons/fa';
import './tutorial-match-history.css';

const SAMPLE_DATA = {
    name: 'Kate Rodriguez',
    image: '/assets/stock-woman-cropped.png',
    starRating: 4,
    socialLinks: [
        { platform: 'email', value: 'kate_rodriguez@gmail.com', Icon: FaEnvelope, color: '#4b7ef0', prefix: '' },
        { platform: 'instagram', value: '@ kate656', Icon: FaInstagram, color: '#E4405F', prefix: '' },
        { platform: 'linkedin', value: '@ kate_consultant_atx', Icon: FaLinkedinIn, color: '#0A66C2', prefix: '' },
    ],
};

const TutorialMatchHistory = () => {
    const [starsVisible, setStarsVisible] = useState(false);
    const [yesSelected, setYesSelected] = useState(false);

    useEffect(() => {
        const starTimer = setTimeout(() => setStarsVisible(true), 2000);
        const yesTimer = setTimeout(() => setYesSelected(true), 3400);

        return () => {
            clearTimeout(starTimer);
            clearTimeout(yesTimer);
        };
    }, []);

    return (
        <div className="tutorial-mh-wrapper">
            <div className="tutorial-mh-card">
                <div className="tutorial-mh-example-label">
                    Here's what your attendees will see after the event
                </div>
                {/* 1. Profile Image — 0.0s */}
                <div className="tutorial-mh-fade tutorial-mh-delay-0 tutorial-mh-image">
                    <img src={SAMPLE_DATA.image} alt={SAMPLE_DATA.name} />
                </div>

                {/* 2. Name — 0.5s */}
                <div className="tutorial-mh-fade tutorial-mh-delay-1 tutorial-mh-name">
                    {SAMPLE_DATA.name}
                </div>

                {/* 3. Star Rating Section — 1.0s */}
                <div className="tutorial-mh-fade tutorial-mh-delay-2 tutorial-mh-stars-section">
                    <div className="tutorial-mh-stars-question">How was the chat?</div>
                    <div className="tutorial-mh-stars-row">
                        {[1, 2, 3, 4, 5].map((n) => (
                            <span
                                key={n}
                                className={`tutorial-mh-star ${starsVisible && n <= SAMPLE_DATA.starRating ? 'tutorial-mh-star-filled' : ''}`}
                            >
                                ★
                            </span>
                        ))}
                    </div>
                    <div className="tutorial-mh-stars-disclaimer">(Don't worry, your response is hidden)</div>
                </div>

                {/* 4. Share Contact Section — 2.0s */}
                <div className="tutorial-mh-fade tutorial-mh-delay-4 tutorial-mh-share-section">
                    <div className="tutorial-mh-share-question">Share Your Contact?</div>
                    <div className="tutorial-mh-share-buttons">
                        <div className="tutorial-mh-share-btn">No</div>
                        <div className={`tutorial-mh-share-btn ${yesSelected ? 'tutorial-mh-share-selected' : ''}`}>
                            Yes
                        </div>
                    </div>
                </div>

                {/* 5. Social Links — 3.0s, 3.4s, 3.8s */}
                <div className="tutorial-mh-contact-section">
                    <div className="tutorial-mh-fade tutorial-mh-delay-6 tutorial-mh-contact-header">
                        {SAMPLE_DATA.name}'s contact info
                    </div>
                    {SAMPLE_DATA.socialLinks.map((link, i) => (
                        <div
                            key={link.platform}
                            className={`tutorial-mh-fade tutorial-mh-delay-${6 + i} tutorial-mh-social-link`}
                        >
                            <span className="tutorial-mh-social-icon">
                                <link.Icon size={16} color={link.color} />
                            </span>
                            <span className="tutorial-mh-social-value">{link.prefix}{link.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TutorialMatchHistory;
