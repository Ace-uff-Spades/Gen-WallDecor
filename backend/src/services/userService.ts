import { getDb } from '../config/firebase';

const DAILY_LIMIT = 10;

export interface UserData {
  email: string;
  dailyGenerationCount: number;
  lastResetDate: string;
  createdAt: string;
}

export class UserService {
  private get usersCollection() {
    return getDb().collection('users');
  }

  async getOrCreateUser(uid: string, email: string): Promise<UserData> {
    const docRef = this.usersCollection.doc(uid);
    const doc = await docRef.get();

    if (doc.exists) {
      return doc.data() as UserData;
    }

    const newUser: UserData = {
      email,
      dailyGenerationCount: 0,
      lastResetDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };

    await docRef.set(newUser);
    return newUser;
  }

  async canGenerate(uid: string): Promise<boolean> {
    const docRef = this.usersCollection.doc(uid);
    const doc = await docRef.get();

    if (!doc.exists) return true;

    const data = doc.data() as UserData;
    const today = new Date().toISOString().split('T')[0];

    if (data.lastResetDate !== today) {
      await docRef.update({ dailyGenerationCount: 0, lastResetDate: today });
      return true;
    }

    return data.dailyGenerationCount < DAILY_LIMIT;
  }

  async incrementGenerationCount(uid: string): Promise<void> {
    const docRef = this.usersCollection.doc(uid);
    const doc = await docRef.get();
    const today = new Date().toISOString().split('T')[0];

    if (!doc.exists) {
      await docRef.set({ dailyGenerationCount: 1, lastResetDate: today }, { merge: true });
      return;
    }

    const data = doc.data() as UserData;
    await docRef.update({
      dailyGenerationCount: data.lastResetDate === today
        ? data.dailyGenerationCount + 1
        : 1,
      lastResetDate: today,
    });
  }

  async getProfile(uid: string): Promise<UserData | null> {
    const doc = await this.usersCollection.doc(uid).get();
    return doc.exists ? (doc.data() as UserData) : null;
  }
}
