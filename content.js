// content.js
console.log('VIP Email Notifier activated');

// Track processed emails to prevent duplicates
const processedEmails = new Set();

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
  // Updated selectors to catch more Gmail email content variations
  const emailContents = document.querySelectorAll('.a3s.aiL, .ii.gt .a3s, [data-message-id] .a3s');
  
  // Also check email headers/subject lines and sender information
  const emailHeaders = document.querySelectorAll('.hP, .go .gD, .yf .yW span[email], .yf .yW span[name]');
  
  if (emailContents.length > 0 || emailHeaders.length > 0) {
    // Get the VIP list from storage
    chrome.storage.sync.get('vips', function(data) {
      const vips = data.vips || [];
      
      // Skip if no VIPs are defined
      if (vips.length === 0) return;
      
      let vipFoundInHeaders = false;
      
      // Check email headers for VIP names first
      emailHeaders.forEach((emailHeader) => {
        const headerResult = checkElementForVIPs(emailHeader, vips, 'header');
        if (headerResult) {
          vipFoundInHeaders = true;
        }
      });
      
      // Only check email content if no VIP was found in headers
      if (!vipFoundInHeaders) {
        emailContents.forEach((emailContent) => {
          checkElementForVIPs(emailContent, vips, 'content');
        });
      }
    });
  }
};

const checkElementForVIPs = (element, vips, type) => {
  // Create a unique identifier for this email element
  const elementId = element.textContent.trim().substring(0, 100) + element.className;
  
  // Avoid re-checking already processed elements
  if (processedEmails.has(elementId)) return false;
  
  // Mark as processed
  processedEmails.add(elementId);
  
  const elementText = element.textContent.toLowerCase();
  let vipFound = false;
  
  // Check for each VIP name
  vips.forEach((vip) => {
    const vipLower = vip.toLowerCase();
    
    if (elementText.includes(vipLower)) {
      // Found a VIP match!
      highlightVIP(element, vip, type);
      sendNotification(vip);
      vipFound = true;
    }
  });
  
  return vipFound;
};

const highlightVIP = (emailElement, vipName, type) => {
  // Find the email container to check for existing banners
  let emailContainer = emailElement;
  
  // Try to find the main email message container
  const messageContainer = emailElement.closest('.ii.gt, [data-message-id], .adn.ads, .h7');
  if (messageContainer) {
    emailContainer = messageContainer;
  }
  
  // Check if a VIP banner already exists in this email container
  const existingBanner = emailContainer.querySelector('.vip-notification-banner');
  if (existingBanner) return;
  
  // Create a large, prominent VIP notification banner
  const banner = document.createElement('div');
  banner.className = 'vip-notification-banner';
  banner.style.cssText = `
    background: linear-gradient(135deg, #ffffff, #808080, #dc3545, #000000);
    background-size: 300% 300%;
    animation: gradientShift 8s ease infinite;
    color: white;
    padding: 20px;
    margin: 15px 0;
    border-radius: 12px;
    font-weight: bold;
    font-size: 18px;
    text-align: center;
    box-shadow: 0 8px 25px rgba(0,0,0,0.3);
    border: 3px solid #808080;
    position: relative;
    overflow: hidden;
    z-index: 9999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
  
  // Add keyframe animation for the gradient
  if (!document.querySelector('#vip-notification-styles')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'vip-notification-styles';
    styleSheet.textContent = `
      @keyframes gradientShift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.02); }
        100% { transform: scale(1); }
      }
      .vip-notification-banner {
        animation: gradientShift 8s ease infinite, pulse 6s ease-in-out infinite;
      }
      .vip-notification-banner::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(128,128,128,0.3), transparent);
        animation: shine 5s infinite;
      }
      @keyframes shine {
        0% { left: -100%; }
        100% { left: 100%; }
      }
    `;
    document.head.appendChild(styleSheet);
  }
  
  // Create the notification content with emojis
  const notificationContent = document.createElement('div');
  notificationContent.innerHTML = `
    <div style="font-size: 24px; margin-bottom: 8px;">
      🌟 ⭐ 💎 VIP DETECTED 💎 ⭐ 🌟
    </div>
    <div style="font-size: 16px; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
      🔥 You're communicating with: <strong>${vipName}</strong> 🔥
    </div>
    <div style="font-size: 14px; margin-top: 8px; opacity: 0.9;">
      👑 Handle with special care! 👑
    </div>
  `;
  
  banner.appendChild(notificationContent);
  
  // Insert the banner at the top of the email container
  if (messageContainer) {
    messageContainer.insertBefore(banner, messageContainer.firstChild);
  } else {
    emailElement.insertBefore(banner, emailElement.firstChild);
  }
  
  // Add a click handler to dismiss the notification (only manual dismissal now)
  banner.addEventListener('click', () => {
    banner.style.animation = 'none';
    banner.style.transform = 'scale(0)';
    banner.style.opacity = '0';
    banner.style.transition = 'all 0.3s ease';
    setTimeout(() => banner.remove(), 300);
  });
  
  // No auto-dismiss - banner stays until manually clicked
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
    // Clear processed emails when navigating to prevent stale data
    processedEmails.clear();
    setTimeout(observeEmails, 1000); // Wait a bit for the page to load
  }
}).observe(document, { subtree: true, childList: true });

// Check immediately on script load as well
setTimeout(observeEmails, 2000);
  