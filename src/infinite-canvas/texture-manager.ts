import * as THREE from "three";
import type { MediaItem } from "./types";

const textureCache = new Map<string, THREE.Texture>();
const loadCallbacks = new Map<string, Set<(tex: THREE.Texture) => void>>();
const loader = new THREE.TextureLoader();

const isTextureLoaded = (tex: THREE.Texture): boolean => {
  const img = tex.image as HTMLImageElement | undefined;
  return img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0;
};

const getIsTouchDevice = (): boolean => {
  const hasTouchEvent = "ontouchstart" in window;
  const hasTouchPoints = navigator.maxTouchPoints > 0;
  const hasCoarsePointer = window.matchMedia?.("(pointer: coarse)").matches ?? false;
  return hasTouchEvent || hasTouchPoints || hasCoarsePointer;
};

const resizeImageForMobile = (image: HTMLImageElement, maxDimension: number): Promise<HTMLImageElement> => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    
    if (!ctx) {
      resolve(image);
      return;
    }

    const { width, height } = image;
    const aspectRatio = width / height;
    
    let newWidth = width;
    let newHeight = height;
    
    if (width > maxDimension || height > maxDimension) {
      if (width > height) {
        newWidth = maxDimension;
        newHeight = Math.round(maxDimension / aspectRatio);
      } else {
        newHeight = maxDimension;
        newWidth = Math.round(maxDimension * aspectRatio);
      }
    }
    
    canvas.width = newWidth;
    canvas.height = newHeight;
    
    ctx.drawImage(image, 0, 0, newWidth, newHeight);
    
    const resizedImage = new Image();
    resizedImage.onload = () => resolve(resizedImage);
    resizedImage.onerror = () => resolve(image);
    resizedImage.src = canvas.toDataURL("image/jpeg", 0.9);
  });
};

export const getTexture = (item: MediaItem, onLoad?: (texture: THREE.Texture) => void): THREE.Texture => {
  const key = item.url;
  const existing = textureCache.get(key);

  if (existing) {
    if (onLoad) {
      if (isTextureLoaded(existing)) {
        onLoad(existing);
      } else {
        loadCallbacks.get(key)?.add(onLoad);
      }
    }
    return existing;
  }

  const callbacks = new Set<(tex: THREE.Texture) => void>();
  if (onLoad) callbacks.add(onLoad);
  loadCallbacks.set(key, callbacks);

  const isMobile = getIsTouchDevice();
  const maxDimension = isMobile ? 1080 : Infinity;

  // If mobile and image dimensions exceed max, we need to resize
  const needsResize = isMobile && item.width && item.height && (item.width > maxDimension || item.height > maxDimension);

  if (needsResize) {
    // Load image first, then resize for mobile
    const texture = new THREE.Texture();
    textureCache.set(key, texture);
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = async () => {
      try {
        const resizedImage = await resizeImageForMobile(img, maxDimension);
        
        texture.image = resizedImage;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = true;
        texture.anisotropy = 4;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.needsUpdate = true;

        loadCallbacks.get(key)?.forEach((cb) => {
          try {
            cb(texture);
          } catch (err) {
            console.error(`Callback failed: ${JSON.stringify(err)}`);
          }
        });
        loadCallbacks.delete(key);
      } catch (err) {
        console.error("Failed to resize image:", err);
        // Fallback to regular loading
        loader.load(
          key,
          (tex) => {
            texture.image = tex.image;
            texture.minFilter = THREE.LinearMipmapLinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.generateMipmaps = true;
            texture.anisotropy = 4;
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.needsUpdate = true;

            loadCallbacks.get(key)?.forEach((cb) => {
              try {
                cb(texture);
              } catch (callbackErr) {
                console.error(`Callback failed: ${JSON.stringify(callbackErr)}`);
              }
            });
            loadCallbacks.delete(key);
          },
          undefined,
          (loadErr) => console.error("Texture load failed:", key, loadErr)
        );
      }
    };

    img.onerror = () => {
      // Fallback to regular loader if image load fails
      loader.load(
        key,
        (tex) => {
          texture.image = tex.image;
          texture.minFilter = THREE.LinearMipmapLinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.generateMipmaps = true;
          texture.anisotropy = 4;
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.needsUpdate = true;

          loadCallbacks.get(key)?.forEach((cb) => {
            try {
              cb(texture);
            } catch (err) {
              console.error(`Callback failed: ${JSON.stringify(err)}`);
            }
          });
          loadCallbacks.delete(key);
        },
        undefined,
        (err) => console.error("Texture load failed:", key, err)
      );
    };

    img.src = key;
    
    return texture;
  } else {
    // Regular loading for desktop or images that don't need resizing
    const texture = loader.load(
      key,
      (tex) => {
        tex.minFilter = THREE.LinearMipmapLinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = true;
        tex.anisotropy = 4;
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.needsUpdate = true;

        textureCache.set(key, tex);

        loadCallbacks.get(key)?.forEach((cb) => {
          try {
            cb(tex);
          } catch (err) {
            console.error(`Callback failed: ${JSON.stringify(err)}`);
          }
        });
        loadCallbacks.delete(key);
      },
      undefined,
      (err) => console.error("Texture load failed:", key, err)
    );

    textureCache.set(key, texture);
    return texture;
  }
};
