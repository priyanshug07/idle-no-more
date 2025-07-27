#!/bin/bash

echo "🚀 Building DMG file for Idle No More Desktop App..."

# Navigate to desktop app directory
cd dekstop-app

# Install dependencies if needed
echo "📦 Installing dependencies..."
npm install

# Build DMG file
echo "🔨 Building DMG file..."
npm run build:dmg

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ DMG file built successfully!"
    
    # Copy DMG file to backend media directory
    echo "📁 Copying DMG file to backend media directory..."
    cp "dist/Idle No More-0.1.0-arm64.dmg" "../backend/media/dmg_files/"
    
    if [ $? -eq 0 ]; then
        echo "✅ DMG file copied successfully!"
        echo "📱 DMG file is now available for download at: /api/employees/download-dmg/"
        echo "📊 File size: $(ls -lh "../backend/media/dmg_files/Idle No More-0.1.0-arm64.dmg" | awk '{print $5}')"
        echo ""
        echo "⚠️  macOS Security Note:"
        echo "   Users may see a security warning when installing the app."
        echo "   This is normal for unsigned apps. Users can:"
        echo "   1. Right-click the app and select 'Open'"
        echo "   2. Go to System Preferences → Security & Privacy → 'Open Anyway'"
        echo "   3. See MACOS_INSTALLATION_GUIDE.md for detailed instructions"
        echo ""
        echo "📖 Installation guide available at: MACOS_INSTALLATION_GUIDE.md"
    else
        echo "❌ Failed to copy DMG file to backend media directory"
        exit 1
    fi
else
    echo "❌ Failed to build DMG file"
    exit 1
fi

echo "🎉 Build process completed successfully!" 