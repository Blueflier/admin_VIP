# VIP Email Notifier Chrome Extension

A Chrome extension that monitors Gmail for emails containing VIP names/keywords and shows desktop notifications when found. VIP names are stored in Firebase Firestore for cloud synchronization across devices.

## Features

- 🔍 **Real-time Gmail monitoring** - Automatically detects emails containing VIP names
- 📱 **Desktop notifications** - Get notified immediately when VIP emails arrive
- ☁️ **Cloud storage** - VIP names stored in Firebase for sync across devices
- 🎯 **Visual highlighting** - VIP emails are highlighted with a banner in Gmail
- 💾 **Offline fallback** - Works with local storage if Firebase is not configured

## Setup Instructions

### Step 1: Firebase Setup

1. Go to [Firebase Console](https://firebase.google.com/)
2. Create a new project or select an existing one
3. In your project dashboard:
   - Click on "Project Settings" (gear icon)
   - Go to the "General" tab
   - Scroll down to "Your apps" section
   - Click "Add app" and select the Web icon (`</>`)
   - Register your app with a name (e.g., "VIP Email Notifier")
   - Copy the Firebase configuration object

4. Enable Firestore Database:
   - In the Firebase console, go to "Firestore Database"
   - Click "Create database"
   - Choose "Start in test mode" for now
   - Select a location close to your users

### Step 2: Configure the Extension

1. **Copy the configuration file:**
   ```bash
   cp firebase-config.example.js firebase-config.js
   ```

2. **Edit `firebase-config.js`** and replace the placeholder values with your actual Firebase configuration:
   ```javascript
   const firebaseConfig = {
     apiKey: "your_actual_api_key_here",
     authDomain: "your-project-id.firebaseapp.com",
     projectId: "your-actual-project-id",
     storageBucket: "your-project-id.appspot.com",
     messagingSenderId: "your_actual_sender_id",
     appId: "your_actual_app_id"
   };
   ```

### Step 3: Install the Extension

1. **Load the extension in Chrome:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the folder containing this extension

2. **Grant permissions:**
   - The extension will request permissions for Gmail access and notifications
   - Click "Allow" for all permissions

### Step 4: Add VIP Names

1. **Click the extension icon** in Chrome's toolbar
2. **Add VIP names** in the popup:
   - Enter names, email addresses, or keywords
   - Click "Add VIP" or press Enter
   - VIP names will be stored in Firebase and synced across devices

## How It Works

### Email Detection
- The extension monitors Gmail using content scripts
- When emails are loaded, it checks the content against your VIP list
- Matches are case-insensitive and work with partial matches

### Notifications
- When a VIP email is detected:
  - A desktop notification appears
  - The email is highlighted with a golden banner in Gmail
  - The banner shows which VIP was detected

### Data Storage
- **Primary**: Firebase Firestore (cloud storage)
- **Fallback**: Chrome local storage (if Firebase fails)
- **Migration**: Existing local VIPs are automatically migrated to Firebase

## Troubleshooting

### Firebase Not Working
If you see "⚠️ Using local storage (Firebase not configured)":

1. **Check your `firebase-config.js` file:**
   - Ensure all values are replaced with actual Firebase config
   - Make sure the file exists in the extension directory

2. **Check Firebase project settings:**
   - Verify Firestore is enabled
   - Check that your domain is authorized (if applicable)

3. **Check browser console:**
   - Open the extension popup
   - Right-click and select "Inspect"
   - Look for error messages in the Console tab

### Extension Not Working
1. **Check permissions:**
   - Go to `chrome://extensions/`
   - Make sure the extension has access to `mail.google.com`

2. **Reload the extension:**
   - Go to `chrome://extensions/`
   - Click the refresh button on the VIP Email Notifier extension

3. **Check Gmail:**
   - Make sure you're using Gmail in a supported browser tab
   - Try refreshing the Gmail page

## File Structure

```
├── manifest.json              # Extension configuration
├── popup.html                # Extension popup UI
├── popup.js                  # Popup functionality with Firebase integration
├── content.js                # Gmail content script for email detection
├── background.js             # Background service worker for notifications
├── firebase-service.js       # Firebase service for VIP data management
├── firebase-config.example.js # Firebase configuration template
├── firebase-config.js        # Your Firebase configuration (create this)
└── readme.md                 # This file
```

## Security Notes

- Your Firebase configuration contains sensitive information
- Never commit `firebase-config.js` to public repositories
- Consider setting up Firebase security rules for production use
- The extension only reads email content, it cannot send emails or access other data

## Privacy

- VIP names are stored in your personal Firebase project
- No data is sent to third parties
- Email content is only processed locally in your browser
- The extension only monitors Gmail tabs you have open

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify your Firebase configuration
3. Check browser console for error messages
4. Ensure all permissions are granted to the extension