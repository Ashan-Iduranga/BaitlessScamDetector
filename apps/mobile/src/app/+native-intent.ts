import { getShareExtensionKey } from 'expo-share-intent';

/** Messages shared into the app open the Scan tab, which reads them from the share intent. */
export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  try {
    if (path.includes(`dataUrl=${getShareExtensionKey()}`)) return '/';
    return path;
  } catch {
    return '/';
  }
}
