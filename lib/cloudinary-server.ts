import { v2 as cloudinary } from 'cloudinary';

function readEnv(name: string) {
  const value = process.env[name];
  return typeof value === 'string' ? value.trim() : '';
}

export function getCloudinaryConfig() {
  const cloudName = readEnv('CLOUDINARY_CLOUD_NAME');
  const apiKey = readEnv('CLOUDINARY_API_KEY');
  const apiSecret = readEnv('CLOUDINARY_API_SECRET');
  const cloudinaryUrl = readEnv('CLOUDINARY_URL');

  if (cloudName && apiKey && apiSecret) {
    return { cloudName, apiKey, apiSecret };
  }

  // Railway/Cloudinary integrations sometimes provide a single CLOUDINARY_URL.
  if (cloudinaryUrl) {
    try {
      const url = new URL(cloudinaryUrl);
      if (url.protocol === 'cloudinary:') {
        const apiSecretFromUrl = decodeURIComponent(url.password);
        const apiKeyFromUrl = decodeURIComponent(url.username);
        const cloudNameFromUrl = url.hostname;
        if (cloudNameFromUrl && apiKeyFromUrl && apiSecretFromUrl) {
          return { cloudName: cloudNameFromUrl, apiKey: apiKeyFromUrl, apiSecret: apiSecretFromUrl };
        }
      }
    } catch {
      // Ignore malformed CLOUDINARY_URL and report a useful configuration error below.
    }
  }

  return null;
}

export function configureCloudinary() {
  const config = getCloudinaryConfig();
  if (!config) return null;
  cloudinary.config({
    cloud_name: config.cloudName,
    api_key: config.apiKey,
    api_secret: config.apiSecret,
    secure: true,
  });
  return config;
}

export { cloudinary };
