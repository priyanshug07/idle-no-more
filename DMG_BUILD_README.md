# DMG File Build and Download Process

This document explains how to build and distribute the DMG file for the Idle No More Desktop App.

## Overview

The DMG file is automatically offered for download when a user activates their account through the `/api/employees/activate-account/` endpoint.

## Building the DMG File

### Prerequisites
- Node.js and npm installed
- macOS (required for DMG building)
- Electron Builder installed

### Quick Build
Run the build script from the project root:
```bash
./build-dmg.sh
```

### Manual Build
1. Navigate to the desktop app directory:
   ```bash
   cd dekstop-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the DMG file:
   ```bash
   npm run build:dmg
   ```

4. Copy the DMG file to the backend media directory:
   ```bash
   cp "dist/Idle No More-0.1.0-arm64.dmg" "../backend/media/dmg_files/"
   ```

## File Locations

- **Source**: `dekstop-app/dist/Idle No More-0.1.0-arm64.dmg`
- **Backend**: `backend/media/dmg_files/Idle No More-0.1.0-arm64.dmg`
- **Download URL**: `http://127.0.0.1:8000/api/employees/download-dmg/`

## API Endpoints

### Account Activation
- **URL**: `/api/employees/activate-account/`
- **Method**: POST
- **Response**: Includes download information
```json
{
  "detail": "Account activated successfully.",
  "download_url": "/api/employees/download-dmg/",
  "download_filename": "Idle No More-0.1.0-arm64.dmg"
}
```

### DMG Download
- **URL**: `/api/employees/download-dmg/`
- **Method**: GET
- **Authentication**: Required (JWT token)
- **Response**: DMG file download

## Frontend Integration

The dashboard automatically shows a download button after successful account activation. The download link is styled and prominently displayed to encourage users to install the desktop app.

## Configuration

The DMG build configuration is in `dekstop-app/package.json` under the `build` section. Key settings:

- **App ID**: `com.idlenomore.desktop`
- **Product Name**: `Idle No More`
- **Target**: DMG for both x64 and arm64 architectures
- **Output Directory**: `dist/`

## Troubleshooting

### Build Issues
1. Ensure you're on macOS (DMG building is macOS-only)
2. Check that all dependencies are installed
3. Verify the logo file exists at `renderer/idle-no-more-logo.png`

### Download Issues
1. Verify the DMG file exists in `backend/media/dmg_files/`
2. Check that the Django server is running
3. Ensure media files are being served correctly

### File Size
The DMG file is approximately 93MB. Make sure your server can handle large file downloads.

## Security Notes

- The download endpoint requires authentication
- Only activated users can download the DMG file
- The file is served with proper headers for secure download 