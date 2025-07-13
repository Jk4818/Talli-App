
/**
 * Normalizes an image file for AI processing.
 * This function resizes the image to a maximum dimension and converts it to a JPEG format.
 * This is crucial for handling large mobile photos and ensuring a consistent,
 * optimized format is sent to the AI service.
 *
 * @param file The image file to process.
 * @returns A Promise that resolves with a base64-encoded JPEG data URI.
 */
export function normalizeImageForAI(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const MAX_DIMENSION = 1200; // Max width or height
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > height) {
          if (width > MAX_DIMENSION) {
            height *= MAX_DIMENSION / width;
            width = MAX_DIMENSION;
          }
        } else {
          if (height > MAX_DIMENSION) {
            width *= MAX_DIMENSION / height;
            height = MAX_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Could not get canvas context.'));
        }
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to JPEG data URI with a quality of 0.9
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        resolve(dataUrl);
      };

      img.onerror = (error) => {
        reject(new Error('Failed to load image.'));
      };
      
      if (typeof event.target?.result === 'string') {
        img.src = event.target.result;
      } else {
        reject(new Error('Failed to read file as data URL.'));
      }
    };
    
    reader.onerror = (error) => {
        reject(new Error('Failed to read the file.'));
    };

    reader.readAsDataURL(file);
  });
}
