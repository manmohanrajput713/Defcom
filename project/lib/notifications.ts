import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

// Request notification permissions
export async function requestNotificationPermissions(): Promise<boolean> {
    try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('[notifications] Permission not granted');
            return false;
        }

        // Set up Android notification channel
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('messages', {
                name: 'Messages',
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#4A7C59',
                sound: 'default',
                enableVibrate: true,
                showBadge: true,
            });
        }

        console.log('[notifications] Permission granted');
        return true;
    } catch (error) {
        console.error('[notifications] Error requesting permissions:', error);
        return false;
    }
}

// Show a notification for incoming message
export async function showMessageNotification(
    senderName: string,
    messagePreview: string,
    conversationId?: string
): Promise<void> {
    try {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: senderName,
                body: messagePreview.length > 100
                    ? messagePreview.substring(0, 100) + '...'
                    : messagePreview,
                sound: 'default',
                priority: Notifications.AndroidNotificationPriority.HIGH,
                data: conversationId ? { conversationId } : {},
            },
            trigger: null, // Send immediately
        });
    } catch (error) {
        console.error('[notifications] Error showing notification:', error);
    }
}

// Check if notifications are enabled
export async function areNotificationsEnabled(): Promise<boolean> {
    try {
        const { status } = await Notifications.getPermissionsAsync();
        return status === 'granted';
    } catch (error) {
        console.error('[notifications] Error checking permissions:', error);
        return false;
    }
}

// Add notification response listener (for when user taps notification)
export function addNotificationResponseListener(
    callback: (conversationId: string | null) => void
): Notifications.EventSubscription {
    return Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        const conversationId = data?.conversationId as string | null;
        callback(conversationId);
    });
}
