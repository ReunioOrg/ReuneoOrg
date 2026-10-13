const LOGO_MIME_PREFIXES = [
  ['iVBOR', 'image/png'],
  ['/9j/', 'image/jpeg'],
  ['R0lG', 'image/gif'],
  ['UklG', 'image/webp'],
];

export function logoMimeType(value) {
  if (!value) return 'image/jpeg';
  const payload = String(value).replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');
  for (const [prefix, mime] of LOGO_MIME_PREFIXES) {
    if (payload.startsWith(prefix)) return mime;
  }
  return 'image/jpeg';
}

export function logoDataUrl(value) {
  if (!value) return '';
  if (String(value).startsWith('data:')) return value;
  return `data:${logoMimeType(value)};base64,${value}`;
}

export function canvasHasTransparentPixel(canvas) {
  const { data } = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 255) return true;
  }
  return false;
}

export function imageSourceHasTransparentPixel(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(image, 0, 0);
      resolve(canvasHasTransparentPixel(canvas));
    };
    image.onerror = () => reject(new Error('Image load error'));
    image.src = src;
  });
}
