import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Profile, GameHistory } from './types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Ensure unique alphabetic ids for simple rules matching
function makeSafeId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 20; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Fetch profiles owned by the logged-in user
 */
export async function fetchUserProfiles(userId: string): Promise<Profile[]> {
  const path = 'profiles';
  try {
    const q = query(
      collection(db, path), 
      where('ownerId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    const list: Profile[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        id: docSnap.id,
        name: data.name,
        maxLvl: data.maxLvl,
        ownerId: data.ownerId,
        createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate?.() || new Date(data.updatedAt)
      });
    });
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

/**
 * Create a new user profile
 */
export async function createProfile(name: string, userId: string): Promise<Profile> {
  const path = 'profiles';
  const newId = makeSafeId();
  const docRef = doc(db, path, newId);
  const payload: Omit<Profile, 'id'> = {
    name,
    maxLvl: 1,
    ownerId: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  
  try {
    await setDoc(docRef, payload);
    return {
      id: newId,
      name,
      maxLvl: 1,
      ownerId: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `${path}/${newId}`);
  }
}

/**
 * Update maximum achieved level on a profile
 */
export async function updateProfileLevel(profileId: string, currentLevel: number): Promise<void> {
  const path = `profiles`;
  const docRef = doc(db, path, profileId);
  
  try {
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      throw new Error("Profile does not exist");
    }
    const data = snap.data();
    // Only update if currentLevel exceeds historical level
    if (currentLevel > data.maxLvl) {
      const payload = {
        name: data.name, // Rules require all fields to pass validation
        maxLvl: currentLevel,
        ownerId: data.ownerId,
        createdAt: data.createdAt,
        updatedAt: serverTimestamp()
      };
      await setDoc(docRef, payload);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${path}/${profileId}`);
  }
}

/**
 * Log game session history report
 */
export async function saveGameHistory(
  profileId: string, 
  level: number, 
  score: number, 
  livesRemaining: number, 
  clicks: string[], 
  userId: string
): Promise<void> {
  const path = 'game_history';
  const newId = makeSafeId();
  const docRef = doc(db, path, newId);
  
  const payload = {
    profileId,
    level,
    score,
    livesRemaining,
    clicks,
    timestamp: serverTimestamp(),
    ownerId: userId
  };
  
  try {
    await setDoc(docRef, payload);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `${path}/${newId}`);
  }
}

/**
 * Fetch top game history scores for the active profile
 */
export async function fetchProfileHistory(profileId: string, userId: string): Promise<GameHistory[]> {
  const path = 'game_history';
  try {
    const q = query(
      collection(db, path),
      where('profileId', '==', profileId),
      where('ownerId', '==', userId),
      orderBy('timestamp', 'desc')
    );
    const snap = await getDocs(q);
    const list: GameHistory[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        id: docSnap.id,
        profileId: data.profileId,
        level: data.level,
        score: data.score,
        livesRemaining: data.livesRemaining,
        clicks: data.clicks || [],
        timestamp: data.timestamp?.toDate?.() || new Date(data.timestamp),
        ownerId: data.ownerId
      });
    });
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}
