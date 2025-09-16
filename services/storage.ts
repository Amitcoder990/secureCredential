import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  query,
  orderBy,
  onSnapshot,
  where, limit
} from 'firebase/firestore';

import { db } from './firebase';
import { encryptData, decryptData } from '@/utils/encryption';
import NetInfo from '@react-native-community/netinfo';
import { Alert } from 'react-native';

export interface Credential {
  id: string;
  title: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

const CREDENTIALS_KEY = 'stored_credentials';
const COLLECTION_NAME = 'credentials';

/* ------------------------------------------------------------------ *
 *  Add just below the other KEY/CONST declarations in StorageService
 * ------------------------------------------------------------------ */
const PIN_CACHE_KEY = 'stored_pin';          // AsyncStorage key
const PIN_DOC_ID = 'pin';                 // Firestore document that holds the PIN
const PPIN_DOC_ID = 'ppin';                 // Firestore document that holds the PIN
/* ------------------------------------------------------------------ */


class StorageService {
  private isOnline = true;

  constructor() {
    this.initNetworkListener();
  }

  private initNetworkListener() {
    NetInfo.addEventListener(state => {
      this.isOnline = state.isConnected ?? false;
    });
  }

  private async syncOfflineData() {
    try {
      const offlineData = await AsyncStorage.getItem(`${CREDENTIALS_KEY}_offline`);
      if (offlineData) {
        const credentials = JSON.parse(offlineData);
        for (const credential of credentials) {
          await this.saveToFirestore(credential);
        }
        await AsyncStorage.removeItem(`${CREDENTIALS_KEY}_offline`);
      }
    } catch (error) {
      console.error('Sync error:', error);
    }
  }

  private async saveToFirestore(credential: Omit<Credential, 'id'>): Promise<string> {
    const encryptedCredential = {
      ...credential,
      password: encryptData(credential.password),
      username: encryptData(credential.username),
      email: credential.email ? encryptData(credential.email) : '',
      phone: credential.phone ? encryptData(credential.phone) : '',
      description: credential.description ? encryptData(credential.description) : '',
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), encryptedCredential);
    return docRef.id;
  }

  private async updateInFirestore(id: string, updates: Partial<Credential>): Promise<void> {
    const encryptedUpdates = {
      ...updates,
      password: updates.password ? encryptData(updates.password) : "",
      username: updates.username ? encryptData(updates.username) : "",
      email: updates.email ? encryptData(updates.email) : "",
      phone: updates.phone ? encryptData(updates.phone) : "",
      description: updates.description ? encryptData(updates.description) : '',
      updatedAt: new Date().toISOString(),
    };

    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, encryptedUpdates);
  }

  private decryptCredential(credential: any): Credential {
    return {
      ...credential,
      password: decryptData(credential?.password),
      username: decryptData(credential?.username),
      email: credential?.email ? decryptData(credential?.email) : '',
      phone: credential?.phone ? decryptData(credential?.phone) : '',
      description: credential?.description ? decryptData(credential?.description) : '',
    };
  }

  async getAllCredentials(): Promise<Credential[]> {
    try {
      if (this.isOnline) {
        await this.syncOfflineData();

        const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);

        const credentials = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return this.decryptCredential({
            id: doc.id,
            ...data
          });
        });
        debugger
        // Cache for offline use
        await AsyncStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
        return credentials;
      } else {
        // Offline mode - get from AsyncStorage
        const data = await AsyncStorage.getItem(CREDENTIALS_KEY);
        return data ? JSON.parse(data) : [];
      }
    } catch (error) {
      console.error('Error loading credentials:', error);
      // Fallback to offline storage
      const data = await AsyncStorage.getItem(CREDENTIALS_KEY);
      return data ? JSON.parse(data) : [];
    }
  }

  async saveCredential(credential: Omit<Credential, 'id' | 'createdAt' | 'updatedAt'>): Promise<Credential> {
    try {
      const newCredential: Omit<Credential, 'id'> = {
        ...credential,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (this.isOnline) {
        const id = await this.saveToFirestore(newCredential);
        const savedCredential = { id, ...newCredential };

        // Update local cache
        const existingCredentials = await this.getAllCredentials();
        const updatedCredentials = [savedCredential, ...existingCredentials];
        await AsyncStorage.setItem(CREDENTIALS_KEY, JSON.stringify(updatedCredentials));

        return savedCredential;
      } else {
        // Offline mode - save locally and mark for sync
        const id = Date.now().toString();
        const savedCredential = { id, ...newCredential };

        // Save to offline queue
        const offlineData = await AsyncStorage.getItem(`${CREDENTIALS_KEY}_offline`);
        const offlineCredentials = offlineData ? JSON.parse(offlineData) : [];
        offlineCredentials.push(savedCredential);
        await AsyncStorage.setItem(`${CREDENTIALS_KEY}_offline`, JSON.stringify(offlineCredentials));

        // Update local cache
        const existingCredentials = await this.getAllCredentials();
        const updatedCredentials = [savedCredential, ...existingCredentials];
        await AsyncStorage.setItem(CREDENTIALS_KEY, JSON.stringify(updatedCredentials));

        return savedCredential;
      }
    } catch (error) {
      console.error('Error saving credential:', error);
      throw error;
    }
  }

  async updateCredential(id: string, updates: Partial<Credential>): Promise<void> {
    try {
      if (this.isOnline) {
        await this.updateInFirestore(id, updates);
      }

      // Update local cache
      const credentials = await this.getAllCredentials();
      const index = credentials.findIndex(c => c.id === id);

      if (index !== -1) {
        credentials[index] = {
          ...credentials[index],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        await AsyncStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
      }
    } catch (error) {
      console.error('Error updating credential:', error);
      throw error;
    }
  }

  async deleteCredential(id: string): Promise<void> {
    try {
      if (this.isOnline) {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
      }

      // Update local cache
      const credentials = await this.getAllCredentials();
      const filtered = credentials.filter(c => c.id !== id);
      await AsyncStorage.setItem(CREDENTIALS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting credential:', error);
      throw error;
    }
  }

  async getCredentialById(id: string): Promise<Credential | null> {
    try {
      if (this.isOnline) {
        const docRef = doc(db, COLLECTION_NAME, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          return this.decryptCredential({
            id: docSnap.id,
            ...data
          });
        }
      }

      // Fallback to local cache
      const credentials = await this.getAllCredentials();
      return credentials.find(c => c.id === id) || null;
    } catch (error) {
      console.error('Error getting credential:', error);
      const credentials = await this.getAllCredentials();
      return credentials.find(c => c.id === id) || null;
    }
  }

  async getPin(): Promise<{ pin: string; isDisable: boolean } | null> {
    try {
      // 🔍 Query for the one doc in "credentials" that has a non-empty "pin" field
      const q = query(
        collection(db, PIN_DOC_ID),
        where('pin', '!=', ''),  // only docs with a pin
        limit(1)                  // we expect exactly one
      );

      const snap = await getDocs(q);
      if (snap.empty) {
        // no PIN document found
        return null;
      }

      // pull the data out
      const { pin, isDisable } = snap.docs[0].data() as {
        pin: string;
        isDisable?: boolean;
      };

      // decrypt if you encrypted it on write
      const pinPlain = decryptData(pin);

      return {
        pin: pinPlain,
        isDisable: !!isDisable
      };
    } catch (err) {
      console.error('Error fetching PIN from Firestore:', err);
      return null;
    }
  }
  async getPPin(): Promise<{ pin: string; isDisable: boolean } | null> {
    try {
      // 🔍 Query for the one doc in "credentials" that has a non-empty "pin" field
      const q = query(
        collection(db, PPIN_DOC_ID),
        where('pin', '!=', ''),  // only docs with a pin
        limit(1)                  // we expect exactly one
      );

      const snap = await getDocs(q);
      if (snap.empty) {
        // no PIN document found
        return null;
      }

      // pull the data out
      const { pin, isDisable } = snap.docs[0].data() as {
        pin: string;
        isDisable?: boolean;
      };

      // decrypt if you encrypted it on write
      const pinPlain = decryptData(pin);
      // const pinPlain = pin

      return {
        pin: pinPlain,
        isDisable: !!isDisable
      };
    } catch (err) {
      console.error('Error fetching PIN from Firestore:', err);
      return null;
    }
  }

  /**
 * Save a new PIN to Firestore
 */
  async saveToPinFirebase(pin: string, isDisable: boolean = false, isCreate = false): Promise<string | null> {
    try {
      // If you want to encrypt before storing
      const encryptedPin = encryptData(pin);
      // const encryptedPin = pin;

      const docRef = await addDoc(collection(db, isCreate ? PPIN_DOC_ID : PIN_DOC_ID), {
        pin: encryptedPin,
        isDisable,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      return docRef.id;
    } catch (err) {
      console.error("Error saving PIN:", err);
      return null;
    }
  }

  /**
   * Update PIN by matching the old PIN
   */
  async updateToPinByOldPin(
    oldPin: string,
    newPin: string,
    isDisable: boolean = false,
    oprationType: String
  ): Promise<boolean> {
    try {
      const encryptedOldPin = encryptData(oldPin);
      const encryptedNewPin = encryptData(newPin);

      // Find doc where pin == oldPin
      debugger
      let q;
      if (oprationType == "1") {
        q = query(
          collection(db, PIN_DOC_ID),
          where(PIN_DOC_ID, "==", encryptedOldPin),
          limit(1)
        );
      } else {
        q = query(
          collection(db, PPIN_DOC_ID),
          where(PIN_DOC_ID, "==", encryptedOldPin),
          limit(1)
        );
      }


      const snap = await getDocs(q);
      if (snap.empty) {
        console.warn("Old PIN not found in Firestore");
        return false;
      }

      const docRef = snap.docs[0].ref;

      await updateDoc(docRef, {
        pin: encryptedNewPin,
        isDisable,
        updatedAt: new Date().toISOString(),
      });

      return true;
    } catch (err) {
      console.error("Error updating PIN:", err);
      return false;
    }
  }
}

export const storageService = new StorageService();