import { createCanvas } from 'canvas';

export default async function getCroppedImg(imageSrc, crop, options) {
  console.log('Image source being cropped:', imageSrc); // Log the image source
  const background = options && options.background;
  const quality = options && options.quality;
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = crop.width;
      canvas.height = crop.height;

      if (background) {
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(
        image,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        crop.width,
        crop.height
      );

      try {
        const base64Image = quality == null
          ? canvas.toDataURL('image/jpeg') // Convert canvas to base64
          : canvas.toDataURL('image/jpeg', quality);
        resolve(base64Image);
      } catch (error) {
        reject(new Error('Error converting canvas to base64'));
      }
    };

    image.onerror = (error) => reject(new Error(`Image load error: ${error.message}`));
    image.src = imageSrc; // Load the image from the given source
  });
}


