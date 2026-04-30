/**
 * Detects whether the current browser is a social-media in-app browser (IAB).
 * Instagram, Facebook, TikTok, Snapchat, Twitter/X, and LinkedIn all embed
 * stripped-down WebViews that lack support for blob-URL file downloads.
 */
export function isInAppBrowser() {
  const ua = navigator.userAgent || '';
  return (
    /Instagram/i.test(ua) ||
    /FBAN|FBAV|FB_IAB/i.test(ua) ||
    /\bFB\b/i.test(ua) ||
    /TikTok/i.test(ua) ||
    /Snapchat/i.test(ua) ||
    /Twitter/i.test(ua) ||
    /LinkedInApp/i.test(ua) ||
    /Line\//i.test(ua)
  );
}

/**
 * Returns true when the Web Share API supports sharing files.
 * Available on iOS Safari 15+, Android Chrome 86+, etc.
 */
export function canShareFiles(files) {
  return (
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files })
  );
}

/**
 * Downloads a blob as a file using an anchor tag.
 * Works on desktop and real mobile browsers; does NOT work in social IABs.
 *
 * @param {Blob} blob
 * @param {string} filename - e.g. 'reuneo-qr.png'
 */
export function downloadBlobAsFile(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Attempts to share an image blob via the native OS share sheet.
 * Returns true if the share was initiated, false if not supported.
 *
 * @param {Blob} blob  - PNG/JPEG image blob
 * @param {string} filename - suggested filename (e.g. 'reuneo-qr.png')
 * @param {string} title - share sheet title
 */
export async function shareImageBlob(blob, filename, title = 'Reuneo QR Code') {
  const file = new File([blob], filename, { type: blob.type || 'image/png' });
  if (!canShareFiles([file])) return false;
  try {
    await navigator.share({ files: [file], title });
    return true;
  } catch (err) {
    // User dismissed or share was cancelled — not an error we need to surface
    if (err.name !== 'AbortError') console.warn('Share failed:', err);
    return false;
  }
}
