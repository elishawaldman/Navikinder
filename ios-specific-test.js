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

// Test 1: Minimal payload (iOS sometimes prefers this)
const minimalPayload = JSON.stringify({
  title: '🍎 Minimal Test',
  body: 'iOS minimal format test'
});

// Test 2: Apple-specific format
const applePayload = JSON.stringify({
  aps: {
    alert: {
      title: '🍎 Apple Format',
      body: 'Using Apple-specific format'
    },
    sound: 'default'
  }
});

// Test 3: Standard format but simplified
const standardPayload = JSON.stringify({
  notification: {
    title: '🍎 Standard Test',
    body: 'Standard format for iOS',
    tag: 'test-' + Date.now()
  }
});

// Test 4: Very basic text only
const basicPayload = 'Simple text notification';

async function testPayload(payload, name) {
  console.log(`\n🧪 Testing ${name}...`);
  try {
    await webpush.sendNotification(subscription, payload);
    console.log(`✅ ${name} sent successfully`);
  } catch (error) {
    console.error(`❌ ${name} failed:`, error.message);
  }
}

console.log('🚀 Testing different payload formats for iOS...');

await testPayload(minimalPayload, 'Minimal');
await new Promise(resolve => setTimeout(resolve, 2000));

await testPayload(applePayload, 'Apple Format');
await new Promise(resolve => setTimeout(resolve, 2000));

await testPayload(standardPayload, 'Standard');
await new Promise(resolve => setTimeout(resolve, 2000));

await testPayload(basicPayload, 'Basic Text');

console.log('\n📱 Check your iPhone for any of these test notifications...');
console.log('💡 If none appear, the issue is likely iOS settings or PWA installation');
