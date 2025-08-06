// generate-vapid.js
// Run this with: node generate-vapid.js

const webpush = require('web-push');

// Generate VAPID keys
const vapidKeys = webpush.generateVAPIDKeys();

console.log('\n🔑 NEW VAPID KEYS GENERATED:\n');
console.log('=====================================');
console.log('VAPID_PUBLIC_KEY:');
console.log(vapidKeys.publicKey);
console.log('\nVAPID_PRIVATE_KEY:');
console.log(vapidKeys.privateKey);
console.log('=====================================\n');

console.log('📋 Add these to your .env file:');
console.log(`VITE_VAPID_PUBLIC_KEY="${vapidKeys.publicKey}"`);
console.log(`VAPID_PUBLIC_KEY="${vapidKeys.publicKey}"`);
console.log(`VAPID_PRIVATE_KEY="${vapidKeys.privateKey}"`);
console.log(`VAPID_EMAIL="support@navikinder.com"`);

console.log('\n⚠️  IMPORTANT: After updating keys:');
console.log('1. Update your .env file with the new keys');
console.log('2. Update Supabase Edge Function environment variables');
console.log('3. Clear all existing subscriptions from database');
console.log('4. Have users re-subscribe with new keys');