# Push Notification Setup Guide

## Overview
This guide covers the complete setup process for push notifications in the Navikinder app, including PWA configuration, VAPID keys, and testing procedures.

## 🔧 Prerequisites

### 1. Generate VAPID Keys
You need to generate VAPID keys for Web Push API:

```bash
npx web-push generate-vapid-keys
```

This will output:
```
=======================================
Public Key:
BM...your-public-key-here...
Private Key:
privateKey...your-private-key-here...
=======================================
```

### 2. Environment Variables

#### Frontend (.env)
Create or update your `.env` file with:
```env
VITE_SUPABASE_URL=https://nqrtkgxqgenflhpijpxa.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_VAPID_PUBLIC_KEY=BM...your-public-key-here...
```

#### Backend (Supabase Edge Functions)
In your Supabase project settings, add these environment variables:
```env
VAPID_PUBLIC_KEY=BM...your-public-key-here...
VAPID_PRIVATE_KEY=privateKey...your-private-key-here...
VAPID_EMAIL=mailto:support@navikinder.com
```

## 🚀 Setup Steps

### 1. Deploy Edge Functions
Deploy the push notification functions to Supabase:

```bash
supabase functions deploy send-push-notification
supabase functions deploy send-medication-reminder
```

### 2. Test Push Notification Support
1. Open the app in a browser that supports push notifications
2. Go to Settings page
3. Look for "Push Notifications" section
4. Enable push notifications (should prompt for permission)

### 3. Verify Subscription Storage
Check if subscriptions are stored in the database:
```sql
SELECT COUNT(*) FROM push_subscriptions;
SELECT * FROM push_subscriptions LIMIT 5;
```

### 4. Manual Testing (Development Only)
Use the test component in Settings (only visible in development):
1. Enter your email address
2. Click "Send Test Notification"
3. Check browser notifications

## 🔍 Troubleshooting

### Common Issues

#### 1. "VAPID public key not configured"
- Ensure `VITE_VAPID_PUBLIC_KEY` is set in your frontend environment
- Restart your development server after adding environment variables

#### 2. "User not found" when sending notifications
- Make sure the email exists in the `profiles` table
- Verify the user has a valid profile with the correct email

#### 3. No subscriptions found
- User must enable push notifications first
- Check browser console for subscription errors
- Verify service worker is registered properly

#### 4. Notifications not appearing
- Check browser notification permissions
- Verify VAPID keys match between frontend and backend
- Check browser console for push event errors

### Debug Commands

#### Check Service Worker Registration
```javascript
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Service Workers:', registrations);
});
```

#### Check Push Manager Support
```javascript
navigator.serviceWorker.ready.then(registration => {
  console.log('Push Manager supported:', 'pushManager' in registration);
});
```

#### Test Push Subscription
```javascript
navigator.serviceWorker.ready.then(registration => {
  return registration.pushManager.getSubscription();
}).then(subscription => {
  console.log('Current subscription:', subscription);
});
```

## 📱 Device-Specific Notes

### iOS 16.4+
- App must be installed to home screen for push notifications to work
- Users need to explicitly enable notifications in iOS settings
- Test on actual iOS device, not simulator

### Android Chrome
- Works in browser and when installed as PWA
- Push notifications work immediately after permission grant

### Desktop Chrome/Edge
- Works in browser tab
- Notifications appear even when tab is closed

## 🔄 Integration Flow

The complete flow works as follows:

1. **User enables notifications**: Frontend subscribes to push notifications and stores subscription in database
2. **Medication reminder triggers**: Database function calls both email and push notification services
3. **Push notification sent**: Edge function looks up user subscriptions and sends notifications
4. **User interacts**: Service worker handles notification clicks and actions

## 🧪 Testing Checklist

- [ ] VAPID keys generated and configured
- [ ] Environment variables set in both frontend and backend
- [ ] Edge functions deployed
- [ ] Service worker registered successfully
- [ ] Push notification permission granted
- [ ] Subscription stored in database
- [ ] Test notification sends successfully
- [ ] Notification appears in browser
- [ ] Notification actions work (click to open app)
- [ ] Integration with medication reminders works

## 🚨 Security Notes

- Never commit VAPID private keys to version control
- Use environment variables for all sensitive configuration
- VAPID email should be a valid contact email for your service
- Test thoroughly before production deployment

## 📚 Next Steps

After setup is complete:
1. Test with real medication reminders
2. Add notification preferences to user settings
3. Implement notification scheduling optimization
4. Add analytics for notification delivery rates
5. Consider notification batching for multiple medications