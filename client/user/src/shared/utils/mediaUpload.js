/**
 * Uploads a file directly to R2 using a pre-signed URL
 * @param {string} uploadUrl - The pre-signed URL from the backend
 * @param {File} file - The file object to upload
 * @param {Function} [onProgress] - Callback for upload progress (simulated with fetch)
 * @returns {Promise<void>}
 */
export const uploadFileToR2 = (uploadUrl, file, onProgress = undefined) => {
  return new Promise((resolve, reject) => {
    console.log("[R2_UPLOAD] Starting XHR to:", uploadUrl);
    if (!uploadUrl) return reject(new Error("Upload URL is missing"));

    const xhr = new XMLHttpRequest();

    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        console.log(`[R2_UPLOAD] Progress: ${percentComplete}%`);
        if (onProgress) onProgress(percentComplete);
      }
    };

    xhr.onload = () => {
      console.log("[R2_UPLOAD] XHR onload status:", xhr.status);
      if (xhr.status >= 200 && xhr.status < 300) {
        if (onProgress) onProgress(100);
        resolve();
      } else {
        console.error("[R2_UPLOAD_ERROR_RESPONSE]", xhr.responseText);
        reject(new Error(`Upload failed with status: ${xhr.status}`));
      }
    };

    xhr.onerror = (error) => {
      console.error("[R2_UPLOAD_ERROR]", error);
      reject(
        new Error(
          "Direct cloud upload failed. Check your connection and CORS settings."
        )
      );
    };

    xhr.send(file);
  });
};
