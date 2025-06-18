// firebase-service.js
// Firebase service for managing VIP data

class FirebaseService {
  constructor() {
    this.db = null;
    this.initialized = false;
    this.sharedCollectionId = null;
  }

  async initialize() {
    try {
      // Check if Firebase config exists
      if (!window.firebaseConfig) {
        throw new Error('Firebase configuration not found. Please set up firebase-config.js');
      }

      // Initialize Firebase
      firebase.initializeApp(window.firebaseConfig);
      this.db = firebase.firestore();
      
      // Use a shared collection for all users
      this.sharedCollectionId = 'shared-vips';
      
      this.initialized = true;
      console.log('Firebase initialized successfully with shared VIP collection');
      return true;
    } catch (error) {
      console.error('Firebase initialization failed:', error);
      return false;
    }
  }

  // No longer needed - we use a shared collection

  async addVIP(vipName) {
    if (!this.initialized) {
      throw new Error('Firebase not initialized');
    }

    try {
      // Check if VIP already exists to avoid duplicates
      const existingVIPs = await this.getVIPs();
      if (existingVIPs.includes(vipName)) {
        console.log('VIP already exists:', vipName);
        return true;
      }

      const vipRef = this.db.collection(this.sharedCollectionId).doc();
      await vipRef.set({
        name: vipName,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('VIP added to shared Firebase collection:', vipName);
      return true;
    } catch (error) {
      console.error('Error adding VIP to Firebase:', error);
      throw error;
    }
  }

  async removeVIP(vipName) {
    if (!this.initialized) {
      throw new Error('Firebase not initialized');
    }

    try {
      const vipsRef = this.db.collection(this.sharedCollectionId);
      const querySnapshot = await vipsRef.where('name', '==', vipName).get();
      
      const deletePromises = [];
      querySnapshot.forEach((doc) => {
        deletePromises.push(doc.ref.delete());
      });
      
      await Promise.all(deletePromises);
      console.log('VIP removed from shared Firebase collection:', vipName);
      return true;
    } catch (error) {
      console.error('Error removing VIP from Firebase:', error);
      throw error;
    }
  }

  async getVIPs() {
    if (!this.initialized) {
      throw new Error('Firebase not initialized');
    }

    try {
      const vipsRef = this.db.collection(this.sharedCollectionId);
      const querySnapshot = await vipsRef.orderBy('createdAt', 'asc').get();
      
      const vips = [];
      querySnapshot.forEach((doc) => {
        vips.push(doc.data().name);
      });
      
      return vips;
    } catch (error) {
      console.error('Error getting VIPs from Firebase:', error);
      throw error;
    }
  }

  async syncWithLocalStorage() {
    try {
      // Get VIPs from Firebase
      const firebaseVIPs = await this.getVIPs();
      
      // Update Chrome storage
      chrome.storage.sync.set({ 'vips': firebaseVIPs }, () => {
        console.log('VIPs synced from Firebase to local storage');
      });
      
      return firebaseVIPs;
    } catch (error) {
      console.error('Error syncing with local storage:', error);
      // Fall back to local storage if Firebase fails
      return new Promise((resolve) => {
        chrome.storage.sync.get('vips', (data) => {
          resolve(data.vips || []);
        });
      });
    }
  }

  // Migration function to move existing local VIPs to Firebase
  async migrateLocalVIPs() {
    if (!this.initialized) {
      return false;
    }

    return new Promise((resolve) => {
      chrome.storage.sync.get('vips', async (data) => {
        const localVIPs = data.vips || [];
        
        if (localVIPs.length > 0) {
          try {
            // Add each local VIP to Firebase
            for (const vip of localVIPs) {
              await this.addVIP(vip);
            }
            console.log('Local VIPs migrated to Firebase');
            resolve(true);
          } catch (error) {
            console.error('Error migrating local VIPs:', error);
            resolve(false);
          }
        } else {
          resolve(true);
        }
      });
    });
  }
}

// Create global instance
window.firebaseService = new FirebaseService(); 