import { createCanvas } from 'canvas';

export default async function getCroppedImg(imageSrc, crop) {
  console.log('Image source being cropped:', imageSrc); // Log the image source
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = crop.width;
      canvas.height = crop.height;

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
        const base64Image = canvas.toDataURL('image/jpeg'); // Convert canvas to base64
        resolve(base64Image);
      } catch (error) {
        reject(new Error('Error converting canvas to base64'));
      }
    };

    image.onerror = (error) => reject(new Error(`Image load error: ${error.message}`));
    image.src = imageSrc; // Load the image from the given source
  });
}


