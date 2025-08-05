# Push Notification Testing Checklist

## ✅ Pre-Testing Setup

### 1. VAPID Keys Generated
```bash
npx web-push generate-vapid-keys
```
- [ ] Public key copied to `VITE_VAPID_PUBLIC_KEY`
- [ ] Private key set in Supabase environment variables
- [ ] Email configured as `VAPID_EMAIL`

### 2. Environment Variables
- [ ] Frontend `.env` file contains `VITE_VAPID_PUBLIC_KEY`
- [ ] Supabase project has `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL`
- [ ] Development server restarted after environment changes

### 3. Edge Functions Deployed
```bash
supabase functions deploy send-push-notification
supabase functions deploy send-medication-reminder
```
- [ ] Both functions deployed without errors
- [ ] Functions appear in Supabase dashboard

## 🧪 Testing Steps

### Phase 1: Basic Setup Verification
1. [ ] Open app in supported browser (Chrome, Firefox, Edge)
2. [ ] Check browser console for service worker registration
3. [ ] Navigate to Settings page
4. [ ] Verify "Push Notification Testing" section appears (dev mode only)

### Phase 2: Permission and Subscription
1. [ ] Click "Enable Notifications" in Push Notifications section
2. [ ] Browser prompts for notification permission
3. [ ] Grant permission
4. [ ] Verify subscription shows as enabled
5. [ ] Run "Check Subscriptions" in test component
6. [ ] Confirm subscription count > 0

### Phase 3: Manual Testing
1. [ ] Enter your email in test component
2. [ ] Click "Send Test Notification"
3. [ ] Check for success message
4. [ ] Verify push notification appears
5. [ ] Click notification to test app opening

### Phase 4: Integration Testing
1. [ ] Create a medication with immediate reminder
2. [ ] Wait for scheduled reminder time
3. [ ] Verify both email AND push notification received
4. [ ] Test notification actions (Mark as Given, Skip)

## 🔧 Debugging Commands

### Check Service Worker
```javascript
navigator.serviceWorker.getRegistrations()
  .then(regs => console.log('Service Workers:', regs));
```

### Check Push Subscription
```javascript
navigator.serviceWorker.ready
  .then(reg => reg.pushManager.getSubscription())
  .then(sub => console.log('Subscription:', sub));
```

### Database Queries
```sql
-- Check subscriptions
SELECT user_id, endpoint, created_at FROM push_subscriptions;

-- Check user profiles
SELECT id, email FROM profiles WHERE email = 'your-test-email@example.com';

-- Check notification settings
SELECT * FROM user_notification_settings;
```

## 🚨 Common Issues & Solutions

### Issue: "VAPID public key not configured"
**Solution:** 
- Check `.env` file has `VITE_VAPID_PUBLIC_KEY`
- Restart development server
- Verify key format (should start with 'B')

### Issue: "User not found" in push function
**Solution:**
- Ensure user exists in `profiles` table
- Check email matches exactly
- Create profile if missing

### Issue: No notification appears
**Solution:**
- Check browser notification permissions
- Verify VAPID keys match between frontend/backend
- Check browser console for errors
- Test in different browser

### Issue: Service worker not registered
**Solution:**
- Check `main.tsx` imports `registerServiceWorker`
- Verify `sw.js` file exists in public folder
- Check browser console for registration errors

## 📱 Device Testing Matrix

| Platform | Browser | PWA Install | Push Support | Status |
|----------|---------|-------------|--------------|--------|
| Desktop Chrome | ✅ | ✅ | ✅ | Ready |
| Desktop Firefox | ✅ | ❌ | ✅ | Ready |
| Desktop Edge | ✅ | ✅ | ✅ | Ready |
| iOS Safari | ✅ | ✅ | ✅ (16.4+) | Ready |
| Android Chrome | ✅ | ✅ | ✅ | Ready |

## 🎯 Success Criteria

- [ ] All 8 main todos completed
- [ ] Service worker registers without errors
- [ ] Push notifications can be enabled/disabled
- [ ] Test notifications send successfully
- [ ] Notifications integrate with medication reminders
- [ ] Notification actions work properly
- [ ] Multiple device types tested
- [ ] Database subscriptions managed correctly

## 📋 Final Verification

Before marking as complete:
1. [ ] Full medication reminder flow tested
2. [ ] Push notifications work on target devices
3. [ ] Error handling works for failed notifications
4. [ ] Subscription cleanup works for invalid endpoints
5. [ ] User preferences respected (email vs push)
6. [ ] Performance acceptable (no blocking operations)
7. [ ] Security verified (no sensitive data exposed)
8. [ ] Documentation complete and accurate