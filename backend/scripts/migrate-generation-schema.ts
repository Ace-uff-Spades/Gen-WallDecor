import dotenv from 'dotenv';
dotenv.config();

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

const db = getFirestore();

async function migrate() {
  const snapshot = await db.collection('generations').get();
  let migrated = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();

    if (data.pieceVersions !== undefined) {
      console.log(`Skipping already-migrated doc: ${doc.id}`);
      continue;
    }

    const update: Record<string, any> = {
      pieceVersions: (data.imageRefs ?? []).map((ref: string) => [ref]),
      wallRenderVersions: data.wallRenderRef ? [data.wallRenderRef] : [],
      finalizedAt: null,
      pieceRegenerationCount: 0,
      imageRefs: FieldValue.delete(),
      wallRenderRef: FieldValue.delete(),
    };

    await doc.ref.update(update);
    console.log(`Migrated: ${doc.id}`);
    migrated++;
  }

  console.log(`Done. ${migrated} documents migrated.`);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
