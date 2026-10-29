import { sha256Hex } from './crypto';

export interface FileHashResult {
  fileName: string;
  fileSize: number;
  fileType: string;
  lastModified: number;
  sha256: string;
}

export function readFileAsArrayBuffer(file: Blob): Promise<ArrayBuffer> {
  if (typeof file.arrayBuffer === 'function') {
    return file.arrayBuffer();
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as ArrayBuffer'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Reads a user-selected file in memory to calculate its SHA-256 hash.
 * Immediately dereferences and discards the file buffer.
 *
 * IMPORTANT: Strictly warn users NEVER to upload or select intimate photos or videos.
 * Only non-intimate screenshots of public posts or messages should be hashed.
 */
export async function hashFileLocally(file: File): Promise<FileHashResult> {
  const buffer = await readFileAsArrayBuffer(file);
  const sha256 = await sha256Hex(buffer);

  // Buffer is discarded after this scope
  return {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type || 'application/octet-stream',
    lastModified: file.lastModified,
    sha256,
  };
}

export { hashFileLocally as hashFileInBrowser };
