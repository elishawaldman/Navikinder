import webpush from 'web-push';
import fs from 'fs/promises';

const VAPID_PUBLIC_KEY = 'BMR5B3wJdY5jJiGvZaMey2LmuvEsBSsZUCAs70_FnNvvXcZxRcOBH-_QW2xe7Iufah5wNvgY85LyHmrFasTNgHs';
const VAPID_PRIVATE_KEY = 'HG7aM_Im2MpSJyGaq-i1EaTCz26RFflt0u1bBgmZDmw';


webpush.setVapidDetails(
    'mailto:alex@wiredgeese.com',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
);

const subscription = JSON.parse(await fs.readFile('./send/sub-apple.json', 'utf8'));

const payload = JSON.stringify({
    notification: {
        title: '🔔 Hello iOS',
        body: 'This is a test push for iOS Web Push',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        sound: 'default'
    },
    data: {
        tag: 'test-' + Date.now()
    }
});

try {
    await webpush.sendNotification(subscription, payload);
    console.log('✅ Push notification sent');
} catch (err) {
    console.error('❌ Failed to send push notification:', err);
}
