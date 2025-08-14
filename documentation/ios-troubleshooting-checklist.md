# iOS Push Notification Troubleshooting Checklist

## 🔧 Technical Status
- ✅ VAPID keys configured correctly
- ✅ Push subscription created successfully  
- ✅ Apple Push Service accepts notifications
- ✅ No errors in sending process
- ❌ Notifications not appearing on device

## 📱 iOS Device Checks

### Critical PWA Installation
- [ ] App added to home screen via Safari "Add to Home Screen"
- [ ] App opened from **home screen icon** (not Safari bookmark)
- [ ] App displays in **standalone mode** (no Safari address bar/UI)
- [ ] App appears as "Navikinder" in Settings > Notifications (not Safari)

### iOS Settings Verification
- [ ] Settings > Notifications > Navikinder
  - [ ] Allow Notifications: **ON**
  - [ ] Show Previews: **Always** or **When Unlocked**
  - [ ] Sounds: **ON**  
  - [ ] Banners: **ON**
  - [ ] Badges: **ON**
- [ ] Settings > Focus > Do Not Disturb: **OFF**
- [ ] Settings > Screen Time > App Limits: No restrictions on Navikinder
- [ ] Settings > General > About > iOS Version: **16.4 or higher**

### Safari/Web Settings  
- [ ] Settings > Safari > Advanced > Experimental Features > Web Push: **ON**
- [ ] Settings > Safari > Notifications: **Allow**

## 🧪 Testing Steps

### Run These Tests (in order):
```bash
# Basic test
node debug-push.js

# Different payload formats
node ios-specific-test.js  

# Advanced delivery options
node ios-debug-advanced.js
```

### After Each Test:
1. Wait 30 seconds
2. Lock/unlock iPhone
3. Check notification center
4. Check lock screen
5. Try opening the app

## 🔍 Common iOS Issues

### Issue 1: Not Truly in PWA Mode
**Symptoms**: App works but notifications don't appear
**Solution**: 
- Delete app from home screen
- Re-add via Safari "Add to Home Screen"
- Always open from home screen icon

### Issue 2: Notification Permission Not Granted
**Symptoms**: Subscription created but no permission prompt
**Solution**:
- Check Settings > Notifications > Safari
- Clear Safari data and re-subscribe

### Issue 3: Focus/DND Blocking
**Symptoms**: Notifications work sometimes but not always  
**Solution**:
- Disable all Focus modes
- Check notification scheduling settings

### Issue 4: iOS Version Compatibility
**Symptoms**: Everything looks correct but no notifications
**Solution**:
- Verify iOS 16.4+ 
- Update iOS if needed

## 📋 Information to Collect

Please provide:
- [ ] iOS version: `Settings > General > About`
- [ ] How you access the app: Home screen icon vs Safari
- [ ] Whether you see notification permission prompt
- [ ] Whether "Navikinder" appears in Settings > Notifications
- [ ] Current Focus/DND status
- [ ] Results of running the debug scripts

## 🎯 Next Steps

1. Run through this checklist systematically
2. Run the debug scripts and note results
3. Take screenshots of Settings > Notifications > Navikinder
4. Report findings for further troubleshooting
