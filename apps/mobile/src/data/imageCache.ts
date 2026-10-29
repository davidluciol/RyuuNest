import { Image } from "expo-image";

/** Adaptador de caché de imágenes de F20; web responde sin efecto según Expo. */
export async function clearImageCache(): Promise<void> {
  await Promise.all([Image.clearMemoryCache(), Image.clearDiskCache()]);
}
