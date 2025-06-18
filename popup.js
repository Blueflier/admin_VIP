
// popup.js
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize Firebase
    await initializeFirebase();
    
    // Load existing VIPs
    await loadVIPList();
    
    // Add event listener for the add button
    document.getElementById('add-vip').addEventListener('click', addVIP);
    
    // Add event listener for pressing Enter in the input field
    document.getElementById('vip-name').addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        addVIP();
      }
    });
  });

  async function initializeFirebase() {
    const statusDiv = document.getElementById('firebase-status');
    
    try {
      const initialized = await window.firebaseService.initialize();
      
      if (initialized) {
        statusDiv.textContent = '✅ Firebase connected';
        statusDiv.style.backgroundColor = '#d4edda';
        statusDiv.style.color = '#155724';
        
        // Migrate existing local VIPs to Firebase (one-time operation)
        await window.firebaseService.migrateLocalVIPs();
      } else {
        throw new Error('Failed to initialize Firebase');
      }
    } catch (error) {
      console.error('Firebase initialization error:', error);
      statusDiv.textContent = '⚠️ Using local storage (Firebase not configured)';
      statusDiv.style.backgroundColor = '#fff3cd';
      statusDiv.style.color = '#856404';
    }
  }
  
  async function addVIP() {
    const vipInput = document.getElementById('vip-name');
    const vipName = vipInput.value.trim();
    
    if (vipName) {
      try {
        // Try Firebase first
        if (window.firebaseService.initialized) {
          await window.firebaseService.addVIP(vipName);
          await window.firebaseService.syncWithLocalStorage();
          await loadVIPList();
          vipInput.value = '';
        } else {
          // Fall back to local storage
          chrome.storage.sync.get('vips', function(data) {
            const vips = data.vips || [];
            
            if (!vips.includes(vipName)) {
              vips.push(vipName);
              chrome.storage.sync.set({ 'vips': vips }, function() {
                loadVIPList();
                vipInput.value = '';
              });
            } else {
              alert('This VIP is already in your list!');
            }
          });
        }
      } catch (error) {
        console.error('❌ Error adding VIP:', error);
        console.error('❌ Full error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        alert(`Error adding VIP: ${error.message}\n\nCheck console for details.`);
      }
    }
  }
  
  async function removeVIP(vipName) {
    try {
      // Try Firebase first
      if (window.firebaseService.initialized) {
        await window.firebaseService.removeVIP(vipName);
        await window.firebaseService.syncWithLocalStorage();
        await loadVIPList();
      } else {
        // Fall back to local storage
        chrome.storage.sync.get('vips', function(data) {
          const vips = data.vips || [];
          const updatedVips = vips.filter(vip => vip !== vipName);
          
          chrome.storage.sync.set({ 'vips': updatedVips }, function() {
            loadVIPList();
          });
        });
      }
    } catch (error) {
      console.error('❌ Error removing VIP:', error);
      console.error('❌ Full error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      alert(`Error removing VIP: ${error.message}\n\nCheck console for details.`);
    }
  }
  
  async function loadVIPList() {
    const vipList = document.getElementById('vip-list');
    vipList.innerHTML = '';
    
    try {
      let vips = [];
      
      // Try Firebase first
      if (window.firebaseService.initialized) {
        vips = await window.firebaseService.syncWithLocalStorage();
      } else {
        // Fall back to local storage
        vips = await new Promise((resolve) => {
          chrome.storage.sync.get('vips', function(data) {
            resolve(data.vips || []);
          });
        });
      }
      
      if (vips.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'No VIPs added yet';
        vipList.appendChild(li);
      } else {
        vips.forEach(function(vip) {
          const li = document.createElement('li');
          
          const vipText = document.createElement('span');
          vipText.textContent = vip;
          li.appendChild(vipText);
          
          const removeButton = document.createElement('button');
          removeButton.textContent = 'Remove';
          removeButton.className = 'remove-btn';
          removeButton.addEventListener('click', function() {
            removeVIP(vip);
          });
          li.appendChild(removeButton);
          
          vipList.appendChild(li);
        });
      }
    } catch (error) {
      console.error('❌ Error loading VIP list:', error);
      console.error('❌ Full error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      const li = document.createElement('li');
      li.textContent = `Error loading VIPs: ${error.message}`;
      li.style.color = 'red';
      li.style.fontSize = '11px';
      vipList.appendChild(li);
    }
  }