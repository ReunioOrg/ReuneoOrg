import React, { useEffect, useState } from 'react';
import './tutorial-matching.css';

/** Slow tag-match beat by 25% relative to base scene durations. */
export const ORGANIZER_TAG_MATCH_DURATION_SCALE = 1.25;

/** Organizer-only tag-match beat (TutorialMatching round 1 through both arrows). */
export const ORGANIZER_TAG_MATCH_SCENES = [
    { id: 'pair-tags-start', duration: 1200 },
    { id: 'pair-tags-labels-meet', duration: 1200 },
    { id: 'pair-tags-hl-founder-origin', duration: 800 },
    { id: 'pair-tags-arrow-founder', duration: 300 },
    { id: 'pair-tags-hl-founder-dest', duration: 1400 },
    { id: 'pair-tags-hl-investor-origin', duration: 800 },
    { id: 'pair-tags-arrow-investor', duration: 300 },
    { id: 'pair-tags-hold', duration: 500 },
    { id: 'pair-tags-fade-out', duration: 700 },
];

export const ORGANIZER_TAG_MATCH_HEADER =
    'Pairing everyone by matching interests';

/** Map organizer tag-scene index (0-based) to TutorialMatching scene thresholds. */
export const organizerTagMatchScene = (tagSceneIndex) => tagSceneIndex + 1;

export function renderMatchingArrowPath(arrow, markerId) {
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
}

export function useMatchingTagArrows(stageRef, tagRefs, active, sceneTrigger = 0) {
    const [founderArrow, setFounderArrow] = useState(null);
    const [investorArrow, setInvestorArrow] = useState(null);

    useEffect(() => {
        if (!active) {
            setFounderArrow(null);
            setInvestorArrow(null);
            return undefined;
        }

        const stage = stageRef.current;
        if (!stage) return undefined;

        const compute = () => {
            const sr = stage.getBoundingClientRect();

            const fl = tagRefs.founderTagLeftRef.current;
            const fr = tagRefs.founderTagRightRef.current;
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

            const il = tagRefs.investorTagLeftRef.current;
            const ir = tagRefs.investorTagRightRef.current;
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
        };

        const timer = setTimeout(compute, 60);
        return () => clearTimeout(timer);
    }, [active, stageRef, tagRefs, sceneTrigger]);

    return { founderArrow, investorArrow };
}

export function MatchingTagPersonLabels({ side, matchScene, tag1, tag2, tagRefs, labelsFading = false }) {
    if (side === 'left') {
        return (
            <div className={`tutorial-labels${labelsFading ? ' tutorial-labels-fade' : ''}`}>
                {matchScene >= 1 && (
                    <div className="tutorial-label-group tutorial-label-slide">
                        <span className="tutorial-label-text">I&apos;m a:</span>
                        <span
                            ref={tagRefs.founderTagLeftRef}
                            className={`tutorial-label-tag ${matchScene >= 5 ? 'tutorial-tag-highlight' : ''}`}
                        >
                            {tag1}
                        </span>
                    </div>
                )}
                {matchScene >= 2 && (
                    <div className="tutorial-label-group tutorial-label-slide">
                        <span className="tutorial-label-text">I want to meet:</span>
                        <span
                            ref={tagRefs.investorTagLeftRef}
                            className={`tutorial-label-tag ${matchScene >= 6 ? 'tutorial-tag-highlight-alt' : ''}`}
                        >
                            {tag2}
                        </span>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={`tutorial-labels${labelsFading ? ' tutorial-labels-fade' : ''}`}>
            {matchScene >= 1 && (
                <div className="tutorial-label-group tutorial-label-slide">
                    <span className="tutorial-label-text">I&apos;m a:</span>
                    <span
                        ref={tagRefs.investorTagRightRef}
                        className={`tutorial-label-tag ${matchScene >= 8 ? 'tutorial-tag-highlight-alt' : ''}`}
                    >
                        {tag2}
                    </span>
                </div>
            )}
            {matchScene >= 2 && (
                <div className="tutorial-label-group tutorial-label-slide">
                    <span className="tutorial-label-text">I want to meet:</span>
                    <span
                        ref={tagRefs.founderTagRightRef}
                        className={`tutorial-label-tag ${matchScene >= 3 ? 'tutorial-tag-highlight' : ''}`}
                    >
                        {tag1}
                    </span>
                </div>
            )}
        </div>
    );
}

export function MatchingTagArrows({ matchScene, founderArrow, investorArrow, stageDims, arrowsHidden = false }) {
    const arrowHideClass = arrowsHidden ? ' tutorial-arrow-hide' : '';

    return (
        <>
            {matchScene >= 4 && founderArrow && (
                <svg
                    className={`tutorial-arrow tutorial-arrow-fade-in${arrowHideClass}`}
                    viewBox={`0 0 ${stageDims.w} ${stageDims.h}`}
                >
                    {renderMatchingArrowPath(founderArrow, 'cmef-arrow-founder')}
                </svg>
            )}
            {matchScene >= 7 && investorArrow && (
                <svg
                    className={`tutorial-arrow tutorial-arrow-fade-in${arrowHideClass}`}
                    viewBox={`0 0 ${stageDims.w} ${stageDims.h}`}
                >
                    {renderMatchingArrowPath(investorArrow, 'cmef-arrow-investor')}
                </svg>
            )}
        </>
    );
}
