// Utility functions for managing current lobby in localStorage

const LOBBY_CODE_KEY = 'currentLobbyCode';
const LOBBY_TIMESTAMP_KEY = 'currentLobbyTimestamp';
const LOBBY_LAST_VALIDATED_KEY = 'currentLobbyLastValidated';

// Expiry times
const LOBBY_EXPIRY_TIME = 30 * 60 * 1000; // 30 minutes
const VALIDATION_CACHE_TIME = 3 * 60 * 1000; // 3 minutes

/**
 * Store lobby code with current timestamp
 */
export const storeLobbyCode = (lobbyCode) => {
  localStorage.setItem(LOBBY_CODE_KEY, lobbyCode);
  localStorage.setItem(LOBBY_TIMESTAMP_KEY, Date.now().toString());
  console.log(`Stored lobby code: ${lobbyCode}`);
};

/**
 * Get stored lobby code if not expired
 */
export const getStoredLobbyCode = () => {
  const lobbyCode = localStorage.getItem(LOBBY_CODE_KEY);
  const timestamp = localStorage.getItem(LOBBY_TIMESTAMP_KEY);
  
  if (!lobbyCode || !timestamp) {
    return null;
  }
  
  // Check if expired (30 minutes)
  const timeSinceStored = Date.now() - parseInt(timestamp);
  if (timeSinceStored > LOBBY_EXPIRY_TIME) {
    clearLobbyStorage();
    console.log('Lobby code expired, cleared from storage');
    return null;
  }
  
  return lobbyCode;
};

/**
 * Check if we need to validate lobby with server (cache check)
 */
export const shouldValidateLobby = () => {
  const lastValidated = localStorage.getItem(LOBBY_LAST_VALIDATED_KEY);
  
  if (!lastValidated) {
    return true;
  }
  
  const timeSinceValidation = Date.now() - parseInt(lastValidated);
  return timeSinceValidation > VALIDATION_CACHE_TIME;
};

/**
 * Mark lobby as validated (update cache timestamp)
 */
export const markLobbyValidated = () => {
  localStorage.setItem(LOBBY_LAST_VALIDATED_KEY, Date.now().toString());
};

/**
 * Clear all lobby-related localStorage
 */
export const clearLobbyStorage = () => {
  localStorage.removeItem(LOBBY_CODE_KEY);
  localStorage.removeItem(LOBBY_TIMESTAMP_KEY);
  localStorage.removeItem(LOBBY_LAST_VALIDATED_KEY);
  console.log('Cleared lobby storage');
};

/**
 * Update lobby timestamp (refresh the 30-minute timer)
 */
export const refreshLobbyTimestamp = () => {
  const lobbyCode = localStorage.getItem(LOBBY_CODE_KEY);
  if (lobbyCode) {
    localStorage.setItem(LOBBY_TIMESTAMP_KEY, Date.now().toString());
  }
};

// ─── QR animation "played once" flag ──────────────────────────────────────────
// Tracks whether the checkin tutorial animation has already played for a given
// lobby so subsequent QR taps skip straight to the download.
const QR_ANIM_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days safety-net TTL

const qrAnimKey = (lobbyCode) => `qr_anim_played_${lobbyCode}`;

/**
 * Returns true if the QR animation has already been played for this lobby
 * and the stored flag is within the 30-day TTL.
 */
export const hasPlayedQrAnimation = (lobbyCode) => {
  if (!lobbyCode) return false;
  try {
    const raw = localStorage.getItem(qrAnimKey(lobbyCode));
    if (!raw) return false;
    const { ts } = JSON.parse(raw);
    if (Date.now() - ts > QR_ANIM_TTL) {
      localStorage.removeItem(qrAnimKey(lobbyCode));
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

/**
 * Marks the QR animation as played for this lobby (sets timestamp).
 */
export const markQrAnimationPlayed = (lobbyCode) => {
  if (!lobbyCode) return;
  localStorage.setItem(qrAnimKey(lobbyCode), JSON.stringify({ ts: Date.now() }));
};

/**
 * Clears the QR animation flag for this lobby (call when lobby is ended).
 */
export const clearQrAnimation = (lobbyCode) => {
  if (!lobbyCode) return;
  localStorage.removeItem(qrAnimKey(lobbyCode));
};

// ─── Start animation "played once" flag ───────────────────────────────────────
// Tracks whether the Start tutorial animation has already played for a given
// lobby so subsequent Start taps skip straight to the modal.
const START_ANIM_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days safety-net TTL

const startAnimKey = (lobbyCode) => `start_anim_played_${lobbyCode}`;

/**
 * Returns true if the Start animation has already been played for this lobby
 * and the stored flag is within the 30-day TTL.
 */
export const hasPlayedStartAnimation = (lobbyCode) => {
  if (!lobbyCode) return false;
  try {
    const raw = localStorage.getItem(startAnimKey(lobbyCode));
    if (!raw) return false;
    const { ts } = JSON.parse(raw);
    if (Date.now() - ts > START_ANIM_TTL) {
      localStorage.removeItem(startAnimKey(lobbyCode));
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

/**
 * Marks the Start animation as played for this lobby (sets timestamp).
 */
export const markStartAnimationPlayed = (lobbyCode) => {
  if (!lobbyCode) return;
  localStorage.setItem(startAnimKey(lobbyCode), JSON.stringify({ ts: Date.now() }));
};

/**
 * Clears the Start animation flag for this lobby (call when lobby is ended).
 */
export const clearStartAnimation = (lobbyCode) => {
  if (!lobbyCode) return;
  localStorage.removeItem(startAnimKey(lobbyCode));
};
