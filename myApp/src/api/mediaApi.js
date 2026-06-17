/**
 * mediaApi.js — File/image uploads (multipart/form-data).
 *
 * `asset` is an expo-image-picker asset ({ uri, fileName, mimeType }).
 * React Native's FormData accepts the { uri, name, type } shape directly.
 */
import { api } from './client';
import { endpoints } from './endpoints';

export const mediaApi = {
  upload: (asset) => {
    const uri = asset.uri;
    let name = asset.fileName || uri.split('/').pop() || `upload-${Date.now()}.jpg`;
    let type = asset.mimeType || guessType(name);

    // Phone cameras (especially iPhones) save photos as HEIC/HEIF, which most
    // backends reject. expo-image-picker re-encodes to JPEG when `quality` is
    // set, so we relabel HEIC/HEIF as JPEG to ensure any captured photo is
    // accepted on upload.
    if (/hei[cf]/i.test(type) || /\.(heic|heif)$/i.test(name)) {
      type = 'image/jpeg';
      const stem = name.replace(/\.[^./\\]+$/, '');
      name = `${stem || `upload-${Date.now()}`}.jpg`;
    }

    const form = new FormData();
    form.append('file', { uri, name, type });

    return api.post(endpoints.media.upload, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      transformRequest: (d) => d, // let RN serialize FormData; don't JSON-stringify
    });
  },

  remove: (mediaId) => api.delete(endpoints.media.byId(mediaId)),
};

function guessType(name) {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'pdf') return 'application/pdf';
  return 'image/jpeg';
}
