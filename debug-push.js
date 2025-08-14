import webpush from 'web-push';

// Your exact VAPID keys
const VAPID_PUBLIC_KEY = 'BER5uYKWt84G2TCuOeRUsddNVlDuwqt4etVdOXAqj_lvXTPeCgV0CVSPx4XllySHFotbSVBCi1fSQQXf1uVYrrs';
const VAPID_PRIVATE_KEY = 'I9XZruaJncDxDL01-HPfQh4nV4hvRRTP1bUEnDPlk24';

// Your subscription details
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

const payload = JSON.stringify({
  notification: {
    title: '🔥 Direct Test',
    body: 'Testing with your exact VAPID keys and subscription',
    icon: '/navikinder-logo-256.png',
    badge: '/navikinder-logo-256.png',
    sound: 'default'
  },
  data: {
    test: 'direct',
    timestamp: Date.now()
  }
});

console.log('🚀 Sending with exact VAPID keys...');
console.log('📱 Endpoint:', subscription.endpoint.substring(0, 50) + '...');

try {
  await webpush.sendNotification(subscription, payload);
  console.log('✅ Direct push notification sent successfully!');
} catch (error) {
  console.error('❌ Direct push failed:', error);
  if (error.statusCode) {
    console.error('Status Code:', error.statusCode);
    console.error('Headers:', error.headers);
    console.error('Body:', error.body);
  }
}
