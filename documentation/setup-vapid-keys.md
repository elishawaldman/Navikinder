# VAPID Keys Setup Guide

## The Problem
Your app is missing the **VAPID public key** in the frontend environment. This is why push notifications aren't working.

## Quick Fix

### Step 1: Get VAPID Keys from Supabase
1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Edge Functions** → **Environment Variables**
3. Copy the values for:
   - `VAPID_PUBLIC_KEY` 
   - `VAPID_PRIVATE_KEY`

### Step 2: Create Frontend Environment File
Create a `.env` file in your project root (next to `package.json`) with:

```env
VITE_VAPID_PUBLIC_KEY=YOUR_PUBLIC_KEY_HERE
```

**Important:** Replace `YOUR_PUBLIC_KEY_HERE` with the actual public key from Supabase.

### Step 3: Restart Your Development Server
```bash
npm run dev
```

## Testing

1. Open your app in the browser
2. Go to Settings page
3. Click "Run Debug Check" (only visible in development)
4. Check the browser console for detailed results
5. Look for "VAPID Key Configured: true"

## Expected Results After Fix

When you run the debug check, you should see:
- ✅ VAPID Key Configured: true
- ✅ VAPID Key Length: 87 (approximately)
- ✅ Service Worker Registered: true
- ✅ Push Manager Support: true

## For iOS Testing

Make sure to:
1. Add the app to your iPhone home screen first
2. Open the app from the home screen (not Safari)
3. Try enabling notifications from Settings
4. Send a test notification

The debug tool will tell you if you're properly running as a PWA on iOS.