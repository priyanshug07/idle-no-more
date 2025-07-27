# macOS Installation Guide for Idle No More Desktop App

## Overview

Due to macOS security features, you may encounter a warning when trying to install the Idle No More desktop app. This guide will help you safely install the application.

## Installation Steps

### Method 1: Standard Installation (Recommended)

1. **Download the DMG file** from the activation page
2. **Double-click the DMG file** to mount it
3. **Drag the app to Applications folder**
4. **Eject the DMG** from Finder

### Method 2: Handle "Damaged" App Warning

If you see a message saying "The application is damaged and should be moved to the Trash":

1. **Right-click (or Control+click) on the app** in the Applications folder
2. **Select "Open"** from the context menu
3. **Click "Open"** in the security dialog that appears
4. **The app will now open normally**

### Method 3: System Preferences (If Method 2 doesn't work)

1. **Go to System Preferences** → **Security & Privacy**
2. **Click the "General" tab**
3. **Look for a message about the blocked app**
4. **Click "Open Anyway"** next to the Idle No More app
5. **Confirm by clicking "Open"**

### Method 4: Terminal Command (Advanced Users)

If the above methods don't work, you can remove the quarantine attribute:

1. **Open Terminal**
2. **Run this command:**
   ```bash
   sudo xattr -rd com.apple.quarantine /Applications/Idle\ No\ More.app
   ```
3. **Enter your password when prompted**
4. **Try opening the app again**

## Why This Happens

- **Gatekeeper**: macOS includes a security feature called Gatekeeper that blocks unsigned apps
- **No Code Signing**: The app is not code-signed with an Apple Developer certificate
- **Security Protection**: This is a security feature to protect users from malicious software

## Is It Safe?

**Yes, the app is safe to install.** The warning appears because:
- The app is not code-signed (which requires an Apple Developer account)
- It's a legitimate Electron application for productivity tracking
- The source code is available and transparent

## Troubleshooting

### App Won't Open After Installation
1. Try Method 2 or 3 above
2. Check if the app is in the Applications folder
3. Restart your Mac and try again

### Still Getting Security Warnings
1. Make sure you're using the latest version
2. Try downloading the DMG file again
3. Check your macOS version (requires macOS 10.12+)

### Performance Issues
1. The app is designed to be lightweight
2. Check Activity Monitor if the app seems slow
3. Restart the app if needed

## Support

If you continue to have issues:
1. Check the app logs in Console.app
2. Contact support with your macOS version
3. Try running the app from Terminal to see error messages

## Technical Details

- **App Name**: Idle No More
- **Version**: 0.1.0
- **Architecture**: ARM64 (Apple Silicon) / x64 (Intel)
- **Minimum macOS**: 10.12 (Sierra)
- **Framework**: Electron 29.0.0 