import React, { useState, useEffect, useCallback, useRef } from 'react';
import './tutorial-matching.css';

const SCENES = [
    { id: 'enter', duration: 2000 },                    // 0
    { id: 'labels-ima', duration: 1200 },                // 1
    { id: 'labels-meet', duration: 1200 },               // 2
    { id: 'highlight-founder-origin', duration: 800 },   // 3
    { id: 'arrow-founder', duration: 300 },              // 4
    { id: 'highlight-founder-dest', duration: 1400 },    // 5
    { id: 'highlight-investor-origin', duration: 800 },  // 6
    { id: 'arrow-investor', duration: 300 },             // 7
    { id: 'highlight-investor-dest', duration: 1200 },   // 8
    { id: 'close-together', duration: 2000 },            // 9
    { id: 'labels-fade', duration: 800 },                // 10
    { id: 'match-text', duration: 1800 },                // 11
    { id: 'move-to-corner', duration: 1500 },            // 12
    { id: 'enter2', duration: 1400 },                    // 13
    { id: 'labels-ima2', duration: 800 },                // 14
    { id: 'labels-meet2', duration: 800 },               // 15
    { id: 'highlight-capricorn-origin', duration: 600 }, // 16
    { id: 'arrow-capricorn', duration: 300 },            // 17
    { id: 'highlight-capricorn-dest', duration: 1000 },  // 18
    { id: 'highlight-dogmom-origin', duration: 600 },    // 19
    { id: 'arrow-dogmom', duration: 300 },               // 20
    { id: 'highlight-dogmom-dest', duration: 800 },      // 21
    { id: 'close-together2', duration: 1400 },           // 22
    { id: 'labels-fade2', duration: 600 },               // 23
    { id: 'match-text2', duration: 1400 },               // 24
    { id: 'move-to-corner2', duration: 1200 },           // 25
    { id: 'enter3', duration: 800 },                    // 26
    { id: 'match-text3', duration: 1400 },              // 27
    { id: 'move-to-corner3', duration: 1000 },          // 28
    { id: 'fill-row', duration: 3200 },                 // 29
];

const FILL_POSITIONS = [65, 60, 55, 50, 45, 40, 35, 30, 25, 20, 15, 10, 5];
const FILL_HOPPERS = new Set([65, 55, 45, 35, 25, 15, 5]);

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

const TutorialMatching = ({ isVisible, onComplete }) => {
    const [currentScene, setCurrentScene] = useState(0);
    const [fadingOut, setFadingOut] = useState(false);

    const stageRef = useRef(null);
    const founderTagLeftRef = useRef(null);
    const founderTagRightRef = useRef(null);
    const investorTagLeftRef = useRef(null);
    const investorTagRightRef = useRef(null);
    const capricornTagLeftRef = useRef(null);
    const capricornTagRightRef = useRef(null);
    const dogmomTagLeftRef = useRef(null);
    const dogmomTagRightRef = useRef(null);

    const [founderArrow, setFounderArrow] = useState(null);
    const [investorArrow, setInvestorArrow] = useState(null);
    const [capricornArrow, setCapricornArrow] = useState(null);
    const [dogmomArrow, setDogmomArrow] = useState(null);
    const [stageDims, setStageDims] = useState({ w: 420, h: 380 });

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
            setFounderArrow(null);
            setInvestorArrow(null);
            setCapricornArrow(null);
            setDogmomArrow(null);
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

    useEffect(() => {
        const stage = stageRef.current;
        if (!stage) return;

        const compute = () => {
            const sr = stage.getBoundingClientRect();
            setStageDims({ w: sr.width, h: sr.height });

            const fl = founderTagLeftRef.current;
            const fr = founderTagRightRef.current;
            if (fl && fr) {
                const fromRect = fr.getBoundingClientRect();
                const toRect = fl.getBoundingClientRect();
                setFounderArrow({
                    x1: fromRect.left - sr.left,
                    y1: fromRect.top - sr.top + fromRect.height / 2,
                    x2: toRect.right - sr.left,
                    y2: toRect.top - sr.top + toRect.height / 2,
                });
            }

            const il = investorTagLeftRef.current;
            const ir = investorTagRightRef.current;
            if (il && ir) {
                const fromRect = il.getBoundingClientRect();
                const toRect = ir.getBoundingClientRect();
                setInvestorArrow({
                    x1: fromRect.right - sr.left,
                    y1: fromRect.top - sr.top + fromRect.height / 2,
                    x2: toRect.left - sr.left,
                    y2: toRect.top - sr.top + toRect.height / 2,
                });
            }

            const cl = capricornTagLeftRef.current;
            const cr = capricornTagRightRef.current;
            if (cl && cr) {
                const fromRect = cr.getBoundingClientRect();
                const toRect = cl.getBoundingClientRect();
                setCapricornArrow({
                    x1: fromRect.left - sr.left,
                    y1: fromRect.top - sr.top + fromRect.height / 2,
                    x2: toRect.right - sr.left,
                    y2: toRect.top - sr.top + toRect.height / 2,
                });
            }

            const dl = dogmomTagLeftRef.current;
            const dr = dogmomTagRightRef.current;
            if (dl && dr) {
                const fromRect = dl.getBoundingClientRect();
                const toRect = dr.getBoundingClientRect();
                setDogmomArrow({
                    x1: fromRect.right - sr.left,
                    y1: fromRect.top - sr.top + fromRect.height / 2,
                    x2: toRect.left - sr.left,
                    y2: toRect.top - sr.top + toRect.height / 2,
                });
            }
        };

        const timer = setTimeout(compute, 60);
        return () => clearTimeout(timer);
    }, [currentScene]);

    if (!isVisible) return null;

    const sceneIndex = currentScene;

    const getHeaderText = (scene) => {
        if (scene >= 1 && scene <= 12) return "You can pair everyone by matching complimentary interests";
        if (scene >= 13 && scene <= 25) return "Customize how they get paired up, all in one easy step";
        if (scene >= 26 && scene <= 29) return "If someone has no interest pairs available - we default to random pairing";
        return null;
    };

    const headerText = getHeaderText(sceneIndex);
    const showSubheader = sceneIndex === 29;

    const renderArrowPath = (arrow, markerId) => {
        if (!arrow) return null;
        const d = `M ${arrow.x1} ${arrow.y1} L ${arrow.x2} ${arrow.y2}`;

        return (
            <>
                <defs>
                    <marker
                        id={markerId}
                        markerWidth="8"
                        markerHeight="8"
                        refX="7"
                        refY="4"
                        orient="auto"
                    >
                        <path
                            d="M 1 1 L 7 4 L 1 7"
                            fill="none"
                            stroke="rgba(160, 190, 220, 0.6)"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </marker>
                </defs>
                <path
                    d={d}
                    fill="none"
                    stroke="rgba(160, 190, 220, 0.55)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    markerEnd={`url(#${markerId})`}
                />
            </>
        );
    };

    return (
        <div className={`matching-tutorial-overlay ${fadingOut ? 'tutorial-fade-out' : ''}`}>
            <div className="tm-wrapper">
                <div className="tm-header-container">
                    {headerText && (
                        <span className="tm-header-text" key={headerText}>{headerText}</span>
                    )}
                    {showSubheader && (
                        <span className="tm-header-text tm-subheader" key="subheader">This way everyone has someone new to talk to!</span>
                    )}
                </div>
                <div className="tutorial-stage" ref={stageRef}>
                {/* Left person — Founder */}
                <div className={`tutorial-person tutorial-person-left ${sceneIndex >= 9 ? 'tutorial-person-close' : ''} ${sceneIndex >= 12 ? 'tutorial-person-corner tutorial-person-behind' : ''}`}>
                    <div className={`tutorial-labels ${sceneIndex >= 10 ? 'tutorial-labels-fade' : ''}`}>
                        {sceneIndex >= 1 && (
                            <div className="tutorial-label-group tutorial-label-slide">
                                <span className="tutorial-label-text">I'm a:</span>
                                <span
                                    ref={founderTagLeftRef}
                                    className={`tutorial-label-tag ${sceneIndex >= 5 ? 'tutorial-tag-highlight' : ''}`}
                                >
                                    FOUNDER
                                </span>
                            </div>
                        )}
                        {sceneIndex >= 2 && (
                            <div className="tutorial-label-group tutorial-label-slide">
                                <span className="tutorial-label-text">I want to meet:</span>
                                <span
                                    ref={investorTagLeftRef}
                                    className={`tutorial-label-tag ${sceneIndex >= 6 ? 'tutorial-tag-highlight-alt' : ''}`}
                                >
                                    INVESTOR
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="tutorial-person-hop">
                        <PersonIcon />
                    </div>
                </div>

                {/* Right person — Investor */}
                <div className={`tutorial-person tutorial-person-right ${sceneIndex >= 9 ? 'tutorial-person-close' : ''} ${sceneIndex >= 12 ? 'tutorial-person-corner' : ''}`}>
                    <div className={`tutorial-labels ${sceneIndex >= 10 ? 'tutorial-labels-fade' : ''}`}>
                        {sceneIndex >= 1 && (
                            <div className="tutorial-label-group tutorial-label-slide">
                                <span className="tutorial-label-text">I'm a:</span>
                                <span
                                    ref={investorTagRightRef}
                                    className={`tutorial-label-tag ${sceneIndex >= 8 ? 'tutorial-tag-highlight-alt' : ''}`}
                                >
                                    INVESTOR
                                </span>
                            </div>
                        )}
                        {sceneIndex >= 2 && (
                            <div className="tutorial-label-group tutorial-label-slide">
                                <span className="tutorial-label-text">I want to meet:</span>
                                <span
                                    ref={founderTagRightRef}
                                    className={`tutorial-label-tag ${sceneIndex >= 3 ? 'tutorial-tag-highlight' : ''}`}
                                >
                                    FOUNDER
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="tutorial-person-hop">
                        <PersonIcon />
                    </div>
                </div>

                {/* Arrow: right FOUNDER → left FOUNDER */}
                {sceneIndex >= 4 && founderArrow && (
                    <svg className={`tutorial-arrow tutorial-arrow-fade-in ${sceneIndex >= 9 ? 'tutorial-arrow-hide' : ''}`} viewBox={`0 0 ${stageDims.w} ${stageDims.h}`}>
                        {renderArrowPath(founderArrow, 'arrow-founder')}
                    </svg>
                )}

                {/* Arrow: left INVESTOR → right INVESTOR */}
                {sceneIndex >= 7 && investorArrow && (
                    <svg className={`tutorial-arrow tutorial-arrow-fade-in ${sceneIndex >= 9 ? 'tutorial-arrow-hide' : ''}`} viewBox={`0 0 ${stageDims.w} ${stageDims.h}`}>
                        {renderArrowPath(investorArrow, 'arrow-investor')}
                    </svg>
                )}

                {/* "It's a Match!" pop — between persons during close-together */}
                {(sceneIndex === 11 || sceneIndex === 24 || sceneIndex === 27) && (
                    <div className="tutorial-match-toast" key={sceneIndex}>
                        <span className="match-text-inner">Nice to meet you!</span>
                        <div className="tm-confetti-burst">
                            {[1,2,3,4,5,6,7,8].map(n => (
                                <span key={n} className={`tm-conf tm-c${n}`} />
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Round 2 ── */}

                {/* Left person — Capricorn */}
                {sceneIndex >= 13 && (
                    <div className={`tutorial-person tutorial-person-left-r2 ${sceneIndex >= 22 ? 'tutorial-person-close' : ''} ${sceneIndex >= 25 ? 'tutorial-person-corner-r2 tutorial-person-behind' : ''}`}>
                        <div className={`tutorial-labels ${sceneIndex >= 23 ? 'tutorial-labels-fade' : ''}`}>
                            {sceneIndex >= 14 && (
                                <div className="tutorial-label-group tutorial-label-slide-r2">
                                    <span className="tutorial-label-text">I'm a:</span>
                                    <span
                                        ref={capricornTagLeftRef}
                                        className={`tutorial-label-tag ${sceneIndex >= 18 ? 'tutorial-tag-highlight-gold' : ''}`}
                                    >
                                        CAPRICORN
                                    </span>
                                </div>
                            )}
                            {sceneIndex >= 15 && (
                                <div className="tutorial-label-group tutorial-label-slide-r2">
                                    <span className="tutorial-label-text">I want to meet:</span>
                                    <span
                                        ref={dogmomTagLeftRef}
                                        className={`tutorial-label-tag ${sceneIndex >= 19 ? 'tutorial-tag-highlight-purple' : ''}`}
                                    >
                                        DOG MOM
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="tutorial-person-hop">
                            <PersonIcon />
                        </div>
                    </div>
                )}

                {/* Right person — Dog Mom */}
                {sceneIndex >= 13 && (
                    <div className={`tutorial-person tutorial-person-right-r2 ${sceneIndex >= 22 ? 'tutorial-person-close' : ''} ${sceneIndex >= 25 ? 'tutorial-person-corner-r2' : ''}`}>
                        <div className={`tutorial-labels ${sceneIndex >= 23 ? 'tutorial-labels-fade' : ''}`}>
                            {sceneIndex >= 14 && (
                                <div className="tutorial-label-group tutorial-label-slide-r2">
                                    <span className="tutorial-label-text">I'm a:</span>
                                    <span
                                        ref={dogmomTagRightRef}
                                        className={`tutorial-label-tag ${sceneIndex >= 21 ? 'tutorial-tag-highlight-purple' : ''}`}
                                    >
                                        DOG MOM
                                    </span>
                                </div>
                            )}
                            {sceneIndex >= 15 && (
                                <div className="tutorial-label-group tutorial-label-slide-r2">
                                    <span className="tutorial-label-text">I want to meet:</span>
                                    <span
                                        ref={capricornTagRightRef}
                                        className={`tutorial-label-tag ${sceneIndex >= 16 ? 'tutorial-tag-highlight-gold' : ''}`}
                                    >
                                        CAPRICORN
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="tutorial-person-hop">
                            <PersonIcon />
                        </div>
                    </div>
                )}

                {/* Arrow: right CAPRICORN → left CAPRICORN */}
                {sceneIndex >= 17 && capricornArrow && (
                    <svg className={`tutorial-arrow tutorial-arrow-fade-in ${sceneIndex >= 22 ? 'tutorial-arrow-hide' : ''}`} viewBox={`0 0 ${stageDims.w} ${stageDims.h}`}>
                        {renderArrowPath(capricornArrow, 'arrow-capricorn')}
                    </svg>
                )}

                {/* Arrow: left DOG MOM → right DOG MOM */}
                {sceneIndex >= 20 && dogmomArrow && (
                    <svg className={`tutorial-arrow tutorial-arrow-fade-in ${sceneIndex >= 22 ? 'tutorial-arrow-hide' : ''}`} viewBox={`0 0 ${stageDims.w} ${stageDims.h}`}>
                        {renderArrowPath(dogmomArrow, 'arrow-dogmom')}
                    </svg>
                )}

                {/* ── Round 3 — Quick slide, no labels ── */}

                {/* Left person R3 */}
                {sceneIndex >= 26 && (
                    <div className={`tutorial-person tutorial-person-left-r3 ${sceneIndex >= 28 ? 'tutorial-person-corner-r3 tutorial-person-behind' : ''}`}>
                        <div className="tutorial-person-hop">
                            <PersonIcon />
                        </div>
                    </div>
                )}

                {/* Right person R3 */}
                {sceneIndex >= 26 && (
                    <div className={`tutorial-person tutorial-person-right-r3 ${sceneIndex >= 28 ? 'tutorial-person-corner-r3' : ''}`}>
                        <div className="tutorial-person-hop">
                            <PersonIcon />
                        </div>
                    </div>
                )}

                {/* ── Round 4 — Rapid fill from right to left ── */}

                {sceneIndex >= 29 && FILL_POSITIONS.map((pos, i) => {
                    const isHopper = FILL_HOPPERS.has(pos);
                    return (
                        <div
                            key={`fill-${pos}`}
                            className="tutorial-person tutorial-person-fill"
                            style={{
                                left: `${pos}%`,
                                animationDelay: `${i * 0.12}s`,
                            }}
                        >
                            <div
                                className={`tutorial-person-hop ${isHopper ? 'tutorial-fill-hopper' : ''}`}
                                style={isHopper ? { animationDelay: `${i * 0.12 + 0.5}s` } : undefined}
                            >
                                <PersonIcon />
                            </div>
                        </div>
                    );
                })}

                {/* ── Conversation blurbs (pop up during fill) ── */}

                {sceneIndex >= 29 && CHAT_BLURBS.map((blurb, i) => (
                    <div
                        key={`blurb-${i}`}
                        className="tutorial-chat-blurb"
                        style={{
                            left: `${blurb.left}%`,
                            top: `${blurb.top}%`,
                            animationDelay: `${blurb.delay}s`,
                        }}
                    >
                        <span className="tutorial-blurb-text">{blurb.text}</span>
                        <div className="tm-confetti-burst">
                            {[1,2,3,4,5,6,7,8].map(n => (
                                <span key={n} className={`tm-conf tm-c${n}`} />
                            ))}
                        </div>
                    </div>
                ))}
                </div>
            </div>
            <button className="tm-skip" onClick={finishTutorial}>
                skip <span className="tm-skip-arrow">{'\u2192'}</span>
            </button>
        </div>
    );
};

export default TutorialMatching;
