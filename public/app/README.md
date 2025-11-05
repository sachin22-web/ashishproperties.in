# App Directory

This directory contains the mobile application files for download.

## Files

- `AashishProperty.apk` - The Android APK file for the Aashish Property mobile app

## Instructions

1. Place the generated APK file named `AashishProperty.apk` in this directory
2. The app will be available for download via the "Get the App" button on the website
3. Users can download the APK directly to their mobile devices

## API Endpoints

- `GET /api/app/info` - Get information about available app downloads
- `GET /api/app/download` - Download the APK file
- `POST /api/admin/app/upload` - Upload new APK file (admin only)
- `GET /api/admin/app/stats` - Get download statistics (admin only)

## Notes

- Make sure the APK file is properly signed and tested before placement
- The file size and last modified date are automatically detected
- Download statistics are tracked for analytics
