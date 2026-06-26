// Image helper — downscale + compress a captured/picked photo before sending it
// to the vision Edge Function. Keeps requests well under Claude's per-image size
// limit and cuts upload time. Returns base64 (no data-URL prefix) + mime type.

import * as ImageManipulator from 'expo-image-manipulator';

/** Target longest-edge width for upload. Food photos rarely need more. */
const MAX_WIDTH = 1024;

export interface PreparedImage {
  data: string; // base64, no prefix
  mediaType: string;
}

/**
 * Resize to ~{@link MAX_WIDTH}px wide and JPEG-compress, returning base64.
 * Throws if the image can't be read/manipulated (caller maps to a vision error).
 */
export async function prepareImageForUpload(uri: string): Promise<PreparedImage> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MAX_WIDTH } }],
    { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG, base64: true },
  );
  if (!result.base64) throw new Error('image_encode_failed');
  return { data: result.base64, mediaType: 'image/jpeg' };
}
