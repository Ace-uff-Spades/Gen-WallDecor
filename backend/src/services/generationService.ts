import { getDb } from '../config/firebase';
import { DescriptionService } from './descriptionService';
import { ImageService, GeneratedImage } from './imageService';
import { StorageService } from './storageService';
import { PieceDescription, UserPreferences } from '../types';

export interface GenerationResult {
  generationId: string;
  pieceUrls: string[];
  wallRenderUrl: string;
}

export class GenerationService {
  private descriptionService: DescriptionService;
  private imageService: ImageService;
  private storageService: StorageService;

  constructor() {
    this.descriptionService = new DescriptionService();
    this.imageService = new ImageService();
    this.storageService = new StorageService();
  }

  async generateDescriptions(preferences: UserPreferences, feedback?: string, previousDescriptions?: PieceDescription[], userId?: string): Promise<PieceDescription[]> {
    return this.descriptionService.generateDescriptions(preferences, feedback, previousDescriptions, userId);
  }

  async generateImages(
    userId: string,
    preferences: UserPreferences,
    descriptions: PieceDescription[],
  ): Promise<GenerationResult> {
    // Generate individual piece images
    const pieceImages: GeneratedImage[] = [];
    for (const desc of descriptions) {
      const image = await this.imageService.generatePieceImage(desc, preferences.style, userId);
      pieceImages.push(image);
    }

    // Generate wall render
    const wallRender = await this.imageService.generateWallRender(
      descriptions,
      preferences.style,
      preferences.roomType,
      userId,
    );

    // Create Firestore document
    const db = getDb();
    const generationRef = await db.collection('generations').add({
      userId,
      style: preferences.style,
      preferences,
      descriptions,
      pieceVersions: [] as string[][],
      wallRenderVersions: [] as string[],
      finalizedAt: null,
      pieceRegenerationCount: 0,
      createdAt: new Date().toISOString(),
    });

    const genId = generationRef.id;

    // Upload pieces to GCS — versioned paths
    const pieceRefs: string[] = [];
    const pieceUrls: string[] = [];
    for (let i = 0; i < pieceImages.length; i++) {
      const path = `generations/${genId}/piece-${i}-v0.png`;
      const buffer = Buffer.from(pieceImages[i].data, 'base64');
      await this.storageService.uploadBuffer(buffer, path, pieceImages[i].mimeType);
      pieceRefs.push(path);
      const url = await this.storageService.getSignedUrl(path);
      pieceUrls.push(url);
    }

    // Upload wall render — versioned path
    const wallPath = `generations/${genId}/wall-render-v0.png`;
    const wallBuffer = Buffer.from(wallRender.data, 'base64');
    await this.storageService.uploadBuffer(wallBuffer, wallPath, wallRender.mimeType);
    const wallUrl = await this.storageService.getSignedUrl(wallPath);

    // Update Firestore with versioned storage refs
    await db.collection('generations').doc(genId).set(
      {
        pieceVersions: pieceRefs.map(ref => [ref]),
        wallRenderVersions: [wallPath],
        finalizedAt: null,
        pieceRegenerationCount: 0,
      },
      { merge: true }
    );

    return { generationId: genId, pieceUrls, wallRenderUrl: wallUrl };
  }

  async getGeneration(genId: string) {
    const doc = await getDb().collection('generations').doc(genId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  async getUserGenerations(userId: string) {
    const snapshot = await getDb()
      .collection('generations')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async enforceHistoryLimit(userId: string): Promise<void> {
    const generations = await this.getUserGenerations(userId);
    const finalized = (generations as any[]).filter(g => g.finalizedAt != null);
    const maxFinalized = parseInt(process.env.MAX_FINALIZED_GENERATIONS ?? '3');
    if (finalized.length <= maxFinalized) return;

    const toDelete = finalized.slice(maxFinalized);
    for (const gen of toDelete) {
      const data = gen as any;
      if (data.pieceVersions) {
        for (const versions of data.pieceVersions as string[][]) {
          for (const ref of versions) {
            await this.storageService.deleteFile(ref);
          }
        }
      }
      if (data.wallRenderVersions) {
        for (const ref of data.wallRenderVersions as string[]) {
          await this.storageService.deleteFile(ref);
        }
      }
      await getDb().collection('generations').doc(gen.id).delete();
    }
  }
}
