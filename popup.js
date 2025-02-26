
// popup.js
document.addEventListener('DOMContentLoaded', function() {
    // Load existing VIPs
    loadVIPList();
    
    // Add event listener for the add button
    document.getElementById('add-vip').addEventListener('click', addVIP);
    
    // Add event listener for pressing Enter in the input field
    document.getElementById('vip-name').addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        addVIP();
      }
    });
  });
  
  function addVIP() {
    const vipInput = document.getElementById('vip-name');
    const vipName = vipInput.value.trim();
    
    if (vipName) {
      chrome.storage.sync.get('vips', function(data) {
        const vips = data.vips || [];
        
        // Check if VIP already exists
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
  }
  
  function removeVIP(vipName) {
    chrome.storage.sync.get('vips', function(data) {
      const vips = data.vips || [];
      const updatedVips = vips.filter(vip => vip !== vipName);
      
      chrome.storage.sync.set({ 'vips': updatedVips }, function() {
        loadVIPList();
      });
    });
  }
  
  function loadVIPList() {
    const vipList = document.getElementById('vip-list');
    vipList.innerHTML = '';
    
    chrome.storage.sync.get('vips', function(data) {
      const vips = data.vips || [];
      
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
    });
  }