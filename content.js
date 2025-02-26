
  
  // content.js
  console.log('VIP Email Notifier activated');
  
  // Poll for changes in Gmail's DOM since Gmail is a SPA
  const observeEmails = () => {
    // Check if we're in Gmail
    if (window.location.hostname !== 'mail.google.com') return;
  
    // Create a MutationObserver to watch for emails being loaded
    const observer = new MutationObserver(checkForVIPs);
    
    // Target the main email container
    const targetNode = document.body;
    
    // Configuration of the observer
    const config = { childList: true, subtree: true };
    
    // Start observing
    observer.observe(targetNode, config);
  };
  
  const checkForVIPs = (mutations) => {
    // Get all email content elements that are currently visible
    const emailContents = document.querySelectorAll('.a3s.aiL');
    
    if (emailContents.length > 0) {
      // Get the VIP list from storage
      chrome.storage.sync.get('vips', function(data) {
        const vips = data.vips || [];
        
        // Skip if no VIPs are defined
        if (vips.length === 0) return;
        
        // Check each email for VIP names
        emailContents.forEach((emailContent) => {
          // Avoid re-checking already processed emails
          if (emailContent.dataset.vipChecked === 'true') return;
          
          // Mark as checked
          emailContent.dataset.vipChecked = 'true';
          
          const emailText = emailContent.textContent.toLowerCase();
          
          // Check for each VIP name
          vips.forEach((vip) => {
            const vipLower = vip.toLowerCase();
            
            if (emailText.includes(vipLower)) {
              // Found a VIP match!
              highlightVIP(emailContent, vip);
              sendNotification(vip);
            }
          });
        });
      });
    }
  };
  
  const highlightVIP = (emailElement, vipName) => {
    // Create a banner at the top of the email
    const banner = document.createElement('div');
    banner.style.backgroundColor = '#fce8b2';
    banner.style.padding = '10px';
    banner.style.marginBottom = '10px';
    banner.style.borderRadius = '4px';
    banner.style.fontWeight = 'bold';
    banner.style.color = '#d93025';
    banner.textContent = `⭐ VIP DETECTED: ${vipName} ⭐`;
    
    // Insert the banner at the top of the email
    emailElement.insertBefore(banner, emailElement.firstChild);
  };
  
  const sendNotification = (vipName) => {
    // Send a Chrome notification
    chrome.runtime.sendMessage({
      type: 'vip-detected',
      vipName: vipName
    });
  };
  
  // Start observing when the page loads
  window.addEventListener('load', observeEmails);
  
  // Also check when the URL changes (Gmail is a SPA)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      setTimeout(observeEmails, 1000); // Wait a bit for the page to load
    }
  }).observe(document, { subtree: true, childList: true });
  