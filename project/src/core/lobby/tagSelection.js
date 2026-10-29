// Shared tag-selection rules for the lobby tag modal.
// The poll returns player_tags.desiring_tags_work. The save POST sends tags_desiring_work.

export const MAX_TAGS_ALLOWED = 5;

export const TAG_LIMIT_MESSAGE = 'Reached tag limit for this section';

export function readPollWorkTags(playerTags) {
    if (playerTags == null) {
        return { self: null, desiring: null };
    }
    return {
        self: playerTags.tags_work != null ? playerTags.tags_work : null,
        desiring: playerTags.desiring_tags_work != null ? playerTags.desiring_tags_work : null,
    };
}

export function profileTagsToRequest(selfTags, desiringTags) {
    return {
        tags_work: selfTags,
        tags_desiring_work: desiringTags,
    };
}

// localTags null means "not edited yet" and must fall back to the server list
// before the max-5 check. Checking null first lets a 6th tag through.
export function toggleTagSelection({ localTags, serverTags, tag, max = MAX_TAGS_ALLOWED }) {
    const current = Array.isArray(localTags)
        ? localTags
        : (Array.isArray(serverTags) ? serverTags : []);
    const alreadySelected = current.includes(tag);
    if (!alreadySelected && current.length >= max) {
        return { tags: current, blocked: true };
    }
    const tags = alreadySelected
        ? current.filter((item) => item !== tag)
        : [...current, tag];
    return { tags, blocked: false };
}

export function trustPollFields(requestSeq, lastSaveResolvedSeq, saving) {
    return requestSeq > lastSaveResolvedSeq && !saving;
}

// 200 with an `error` key is a failure. 401 is an expired session.
export function interpretProfileSave(status, data) {
    if (status === 401) {
        return {
            ok: false,
            unauthorized: true,
            error: (data && data.detail) || 'Your session expired. Sign in again.',
        };
    }
    if (status < 200 || status >= 300 || (data && typeof data === 'object' && 'error' in data)) {
        const message = (data && (data.error || data.detail)) || 'Could not save your tags. Try again.';
        return { ok: false, error: message };
    }
    return { ok: true, data };
}

export function canSaveTags(selfTags, desiringTags, max = MAX_TAGS_ALLOWED) {
    const self = Array.isArray(selfTags) ? selfTags : [];
    const desiring = Array.isArray(desiringTags) ? desiringTags : [];
    return self.length >= 1
        && desiring.length >= 1
        && self.length <= max
        && desiring.length <= max;
}
