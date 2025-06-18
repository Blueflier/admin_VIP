// firebase-service-rest.js
// Firebase service using REST API (no SDK needed)

class FirebaseServiceRest {
  constructor() {
    this.projectId = null;
    this.apiKey = null;
    this.initialized = false;
    this.sharedCollectionId = 'shared-vips';
  }

  async initialize() {
    try {
      console.log('🔧 Starting Firebase REST service initialization...');
      
      // Check if Firebase config exists
      if (!window.firebaseConfig) {
        console.error('❌ Firebase configuration not found');
        throw new Error('Firebase configuration not found. Please set up firebase-config.js');
      }
      console.log('✅ Firebase config found');

      this.projectId = window.firebaseConfig.projectId;
      this.apiKey = window.firebaseConfig.apiKey;
      
      console.log('🔍 Project ID:', this.projectId);
      console.log('🔍 API Key exists:', !!this.apiKey);
      
      if (!this.projectId || !this.apiKey) {
        console.error('❌ Missing projectId or apiKey in Firebase config');
        throw new Error('Missing projectId or apiKey in Firebase config');
      }
      
      this.initialized = true;
      console.log('✅ Firebase REST service initialized successfully with shared VIP collection');
      return true;
    } catch (error) {
      console.error('❌ Firebase REST initialization failed:', error);
      return false;
    }
  }

  getFirestoreUrl(path = '') {
    return `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents/${path}`;
  }

  async addVIP(vipName) {
    console.log('📝 Adding VIP:', vipName);
    
    if (!this.initialized) {
      console.error('❌ Firebase not initialized');
      throw new Error('Firebase not initialized');
    }

    try {
      console.log('🔍 Checking for existing VIPs...');
      // Check if VIP already exists to avoid duplicates
      const existingVIPs = await this.getVIPs();
      console.log('📋 Current VIPs:', existingVIPs);
      
      if (existingVIPs.includes(vipName)) {
        console.log('⚠️ VIP already exists:', vipName);
        return true;
      }

      const url = this.getFirestoreUrl(this.sharedCollectionId);
      console.log('🌐 Making request to:', url);
      
      const requestBody = {
        fields: {
          name: { stringValue: vipName },
          createdAt: { timestampValue: new Date().toISOString() },
          updatedAt: { timestampValue: new Date().toISOString() }
        }
      };
      console.log('📦 Request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(`${url}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const responseData = await response.json();
      console.log('✅ Response data:', responseData);

      console.log('✅ VIP added to shared Firebase collection:', vipName);
      return true;
    } catch (error) {
      console.error('❌ Error adding VIP to Firebase:', error);
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  async removeVIP(vipName) {
    if (!this.initialized) {
      throw new Error('Firebase not initialized');
    }

    try {
      // Get all documents to find the one to delete
      const url = this.getFirestoreUrl(this.sharedCollectionId);
      const response = await fetch(`${url}?key=${this.apiKey}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const documents = data.documents || [];

      // Find documents with matching name
      const toDelete = documents.filter(doc => 
        doc.fields.name && doc.fields.name.stringValue === vipName
      );

      // Delete each matching document
      for (const doc of toDelete) {
        const docId = doc.name.split('/').pop();
        const deleteUrl = this.getFirestoreUrl(`${this.sharedCollectionId}/${docId}`);
        await fetch(`${deleteUrl}?key=${this.apiKey}`, {
          method: 'DELETE'
        });
      }

      console.log('VIP removed from shared Firebase collection:', vipName);
      return true;
    } catch (error) {
      console.error('Error removing VIP from Firebase:', error);
      throw error;
    }
  }

  async getVIPs() {
    console.log('📋 Getting VIPs from Firebase...');
    
    if (!this.initialized) {
      console.error('❌ Firebase not initialized for getVIPs');
      throw new Error('Firebase not initialized');
    }

    try {
      const url = this.getFirestoreUrl(this.sharedCollectionId);
      console.log('🌐 GET request to:', url);
      
      const response = await fetch(`${url}?key=${this.apiKey}`);
      console.log('📡 GET response status:', response.status);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('📋 Collection doesn\'t exist yet, returning empty array');
          // Collection doesn't exist yet, return empty array
          return [];
        }
        const errorText = await response.text();
        console.error('❌ GET HTTP error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const data = await response.json();
      console.log('📋 Raw Firebase data:', data);
      
      const documents = data.documents || [];
      console.log('📋 Documents found:', documents.length);

      const vips = documents
        .map(doc => {
          const name = doc.fields.name?.stringValue;
          console.log('📋 Processing document:', doc.name, 'name:', name);
          return name;
        })
        .filter(name => name) // Remove any undefined names
        .sort(); // Sort alphabetically

      console.log('✅ Final VIPs list:', vips);
      return vips;
    } catch (error) {
      console.error('❌ Error getting VIPs from Firebase:', error);
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
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
window.firebaseService = new FirebaseServiceRest(); 