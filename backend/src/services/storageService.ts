import { getBucket } from '../config/firebase';

export class StorageService {
  async uploadBuffer(buffer: Buffer, destinationPath: string, contentType: string): Promise<void> {
    const file = getBucket().file(destinationPath);
    await file.save(buffer, {
      metadata: { contentType },
    });
  }

  async getSignedUrl(storagePath: string, expiresInMs = 60 * 60 * 1000): Promise<string> {
    const [url] = await getBucket().file(storagePath).getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + expiresInMs,
    });
    return url;
  }

  async deleteFile(storagePath: string): Promise<void> {
    await getBucket().file(storagePath).delete();
  }
}
