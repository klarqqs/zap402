/** Soroban profile `image_url` max length — see `contracts/zap402/src/types.rs` */
export const MAX_PROFILE_IMAGE_URL_LENGTH = 256;

export function validateProfileImageUrlField(url: string): string | undefined {
  const t = url.trim();
  if (!t) return undefined;
  if (t.length > MAX_PROFILE_IMAGE_URL_LENGTH) {
    return `Image link must be ${MAX_PROFILE_IMAGE_URL_LENGTH} characters or fewer (contract limit).`;
  }
  try {
    const u = new URL(t);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      return "Use an http(s) image URL.";
    }
  } catch {
    return "Please enter a valid image URL.";
  }
  return undefined;
}

/** Resize to fit inside maxEdge (JPEG) for smaller uploads. */
export function resizeImageFileToJpegBlob(
  file: File,
  maxEdge = 1024,
  quality = 0.88,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > maxEdge || height > maxEdge) {
        if (width >= height) {
          height = Math.round((height * maxEdge) / width);
          width = maxEdge;
        } else {
          width = Math.round((width * maxEdge) / height);
          height = maxEdge;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not prepare image."));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Could not encode image."));
        },
        "image/jpeg",
        quality,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read image file."));
    };
    img.src = objectUrl;
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error("Read failed"));
    r.readAsDataURL(blob);
  });
}

/**
 * ImgBB returns a short https URL suitable for on-chain storage.
 * @see https://api.imgbb.com/
 */
export async function uploadProfileImageToImgbb(
  blob: Blob,
  apiKey: string,
): Promise<string> {
  const dataUrl = await blobToDataUrl(blob);
  const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1]! : dataUrl;
  const body = new URLSearchParams();
  body.append("key", apiKey);
  body.append("image", base64);

  const res = await fetch("https://api.imgbb.com/1/upload", {
    method: "POST",
    body,
    headers: { Accept: "application/json" },
  });

  const json = (await res.json()) as {
    success?: boolean;
    data?: { url?: string; display_url?: string };
    error?: { message?: string };
  };

  if (!json.success) {
    throw new Error(json.error?.message || "Image upload failed.");
  }
  const url = json.data?.url ?? json.data?.display_url;
  if (!url) throw new Error("Upload did not return a URL.");
  if (url.length > MAX_PROFILE_IMAGE_URL_LENGTH) {
    throw new Error(
      `Image URL is too long for the contract (${MAX_PROFILE_IMAGE_URL_LENGTH} characters max).`,
    );
  }
  return url;
}
