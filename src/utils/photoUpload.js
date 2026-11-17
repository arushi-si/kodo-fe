import api from "./api";
import { PHOTO_MAX_DIMENSION } from "./constant";

// Downscale images larger than PHOTO_MAX_DIMENSION on either side (canvas, JPEG).
// Formats the browser can't decode (e.g. HEIC outside Safari) are uploaded as they are.
export async function downscaleImage(file, maxDimension = PHOTO_MAX_DIMENSION) {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  let bitmap;
  try {
    bitmap = await createImageBitmap(file); // applies EXIF orientation
  } catch {
    return file;
  }
  const { width, height } = bitmap;
  const scale = Math.min(1, maxDimension / Math.max(width, height));
  if (scale === 1) {
    bitmap.close();
    return file;
  }
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
}

// Step 2 of the upload flow: straight to Cloudinary with XMLHttpRequest for progress.
// Deliberately not the axios `api` instance: no cookies and no /api prefix.
export function uploadToCloudinary(uploadUrl, params, file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", uploadUrl);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded / e.total);
    };
    xhr.onload = () => {
      let body = null;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        // not JSON
      }
      if (xhr.status >= 200 && xhr.status < 300 && body?.public_id) resolve(body);
      else reject(new Error(body?.error?.message || `Upload failed (${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    const form = new FormData();
    Object.entries(params).forEach(([k, v]) => form.append(k, v));
    form.append("file", file);
    xhr.send(form);
  });
}

// Attaching photos one at a time keeps concurrent uploads from racing on the profile document.
let attachQueue = Promise.resolve();
const attachPhoto = (publicId) => {
  const run = attachQueue.then(() => api.post("/profile/photos", { publicId }));
  attachQueue = run.catch(() => {});
  return run;
};

// The full 3-step flow (FRONTEND_HANDOFF.md §7). Resolves to { photos, photoUrl }.
export async function uploadPhoto(file, { maxBytes, onProgress } = {}) {
  const prepared = await downscaleImage(file);
  if (maxBytes && prepared.size > maxBytes)
    throw new Error(`Photo must be under ${Math.round(maxBytes / 1024 / 1024)} MB`);
  const {
    data: { uploadUrl, params },
  } = await api.post("/profile/photos/upload-signature");
  const uploaded = await uploadToCloudinary(uploadUrl, params, prepared, onProgress);
  const { data } = await attachPhoto(uploaded.public_id);
  return data;
}
