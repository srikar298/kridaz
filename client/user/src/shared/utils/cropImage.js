export const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous"); // avoid CORS issues when drawing external images
    image.src = url;
  });

/**
 * Returns the cropped image as a Blob.
 * @param {string} imageSrc - Image source URL (data URL or external URL)
 * @param {Object} pixelCrop - pixelCrop object provided by react-easy-crop
 * @returns {Promise<Blob>} - Promise resolving to the cropped image Blob
 */
export async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Could not get 2d context from canvas");
  }

  // set canvas size to match the crop size
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // draw cropped image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  // As a blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((file) => {
      if (file) {
        resolve(file);
      } else {
        reject(new Error("Canvas is empty"));
      }
    }, "image/jpeg", 0.95);
  });
}
