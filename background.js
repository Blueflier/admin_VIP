
  // background.js
  chrome.runtime.onInstalled.addListener(() => {
    console.log('VIP Email Notifier installed');
  });
  
  // Listen for messages from content scripts
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'vip-detected') {
      // Show notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'images/icon128.png',
        title: 'VIP Email Detected!',
        message: `An email containing VIP "${message.vipName}" has been detected.`,
        priority: 2
      });
    }
  });