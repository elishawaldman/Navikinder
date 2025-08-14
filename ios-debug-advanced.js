import webpush from 'web-push';

const VAPID_PUBLIC_KEY = 'BER5uYKWt84G2TCuOeRUsddNVlDuwqt4etVdOXAqj_lvXTPeCgV0CVSPx4XllySHFotbSVBCi1fSQQXf1uVYrrs';
const VAPID_PRIVATE_KEY = 'I9XZruaJncDxDL01-HPfQh4nV4hvRRTP1bUEnDPlk24';

const subscription = {
  endpoint: 'https://web.push.apple.com/QAh6PzDG4y4vhLZ6YX7AblzEykYX2K6YYhsVb_x9WrDbC83yd1wsbSnx-m4iqTFWmspjfKUifUphGMNw45g79nfQb2pPlOq7ik-SAv-yejp6p7EyPzjYg1aWbnYi2ZQ8qBGGKV79BSxb9rQ0sXtcgEjx7eBsIAuZ1HXRCNfv_EA',
  keys: {
    p256dh: 'BJ9eZX/SkZAborCX4kEZDK0ViFiR5GnJuqkHWIsqx+fid03yINQ6oyjAQ+Ut9R/lWGVCosSBGpVv/tiu12pCD2s=',
    auth: 'GhPv4MoKPq2h8Fd4EKZsFw=='
  }
};

webpush.setVapidDetails(
  'mailto:support@navikinder.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

// Test with different TTL and urgency settings
const testOptions = [
  { name: 'High Priority', options: { TTL: 3600, urgency: 'high' } },
  { name: 'Normal Priority', options: { TTL: 86400, urgency: 'normal' } },
  { name: 'Low Priority', options: { TTL: 604800, urgency: 'low' } },
  { name: 'No Options', options: {} }
];

const payload = JSON.stringify({
  notification: {
    title: '🔔 Advanced Test',
    body: 'Testing with different delivery options',
    icon: '/navikinder-logo-256.png',
    vibrate: [200, 100, 200],
    requireInteraction: true
  }
});

async function testWithOptions(options, name) {
  console.log(`\n🧪 Testing ${name}...`);
  console.log('Options:', options);
  
  try {
    const result = await webpush.sendNotification(subscription, payload, options.options);
    console.log(`✅ ${name} sent successfully`);
    console.log('Response headers:', result.headers);
    console.log('Status code:', result.statusCode);
  } catch (error) {
    console.error(`❌ ${name} failed:`, error.message);
    if (error.statusCode) {
      console.error('Status Code:', error.statusCode);
      console.error('Body:', error.body);
    }
  }
}

console.log('🚀 Testing with different delivery options...');

for (const test of testOptions) {
  await testWithOptions(test, test.name);
  await new Promise(resolve => setTimeout(resolve, 3000)); // 3 second delay between tests
}

console.log('\n📱 Check your iPhone for notifications with different priorities...');
console.log('\n🔍 iOS Debugging Tips:');
console.log('1. Make sure app is opened from HOME SCREEN (not Safari)');
console.log('2. Check Settings > Notifications > Navikinder');
console.log('3. Try locking/unlocking your phone');
console.log('4. Check if Do Not Disturb is enabled');
console.log('5. Make sure iOS version is 16.4 or higher');
