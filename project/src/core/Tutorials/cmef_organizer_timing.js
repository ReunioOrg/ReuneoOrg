import {
    ORGANIZER_TAG_MATCH_SCENES,
    ORGANIZER_TAG_MATCH_DURATION_SCALE,
} from './matching_tag_round';

/** New-organizer playback — 15% faster twice (≈32% faster than base). */
export const ORGANIZER_SPEED = 1.3225;

/** Exit fade before onComplete in organizer variant. */
export const ORGANIZER_EXIT_FADE_MS = 400;

export const orgMs = (ms) => Math.round(ms / ORGANIZER_SPEED);

const ORGANIZER_INTRO_SCENES = [
    { id: 'pair-hop', duration: 1875 },
    { id: 'pair-phones', duration: 313 },
    { id: 'pair-greet', duration: 1400 },
];

/** pair-fade + SCENES.slice(16, 24) + final-fade */
const ORGANIZER_OUTRO_SCENES = [
    { id: 'pair-fade', duration: 700 },
    { id: 'first-arrive', duration: 900 },
    { id: 'crowd-fill', duration: 800 },
    { id: 'settle-pairs', duration: 1000 },
    { id: 'phones-reveal', duration: 900 },
    { id: 'convo-overlay', duration: 2000 },
    { id: 'convo-clear', duration: 800 },
    { id: 'reshuffle-1', duration: 1200 },
    { id: 'show-round2', duration: 2200 },
    { id: 'final-fade', duration: 800 },
];

export const ORGANIZER_INTRO_COUNT = ORGANIZER_INTRO_SCENES.length;
export const ORGANIZER_TAG_MATCH_COUNT = ORGANIZER_TAG_MATCH_SCENES.length;

export const buildOrganizerScenes = (hasTagMatch) => [
    ...ORGANIZER_INTRO_SCENES,
    ...(hasTagMatch ? ORGANIZER_TAG_MATCH_SCENES : []),
    ...ORGANIZER_OUTRO_SCENES,
];

export function getOrganizerSceneDurationMs(scene, index, hasTagMatch) {
    const baseDuration = scene.duration;
    const isTagMatchScene = hasTagMatch
        && index >= ORGANIZER_INTRO_COUNT
        && index < ORGANIZER_INTRO_COUNT + ORGANIZER_TAG_MATCH_COUNT;
    let duration = isTagMatchScene
        ? baseDuration * ORGANIZER_TAG_MATCH_DURATION_SCALE
        : baseDuration;
    if (hasTagMatch && scene.id === 'pair-fade') {
        duration = baseDuration * 1.25;
    }
    return orgMs(duration);
}

export function getOrganizerPlaybackDurationMs(hasTagMatch, { includeExitFade = true } = {}) {
    const scenes = buildOrganizerScenes(hasTagMatch);
    const sceneTotal = scenes.reduce(
        (sum, scene, index) => sum + getOrganizerSceneDurationMs(scene, index, hasTagMatch),
        0
    );
    return includeExitFade ? sceneTotal + orgMs(ORGANIZER_EXIT_FADE_MS) : sceneTotal;
}
