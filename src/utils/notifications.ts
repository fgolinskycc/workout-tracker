import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Show alerts even when the app is foregrounded (needed during workouts)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** Call once at app startup. Silently no-ops if already granted or on Android < 13. */
export async function requestNotifPermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    // Android 12 and below don't require runtime permission for local notifications
    await Notifications.setNotificationChannelAsync('rest-timer', {
      name: 'Rest Timer',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
    });
    return true;
  }
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return true;
  const { status: next } = await Notifications.requestPermissionsAsync();
  return next === 'granted';
}

/** Schedule a "rest complete" local notification. Returns the notification ID. */
export async function scheduleRestNotif(seconds: number): Promise<string | null> {
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Rest Complete! 💪',
        body: 'Time to crush your next set',
        sound: true,
        ...(Platform.OS === 'android' && { channelId: 'rest-timer' }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds,
        repeats: false,
      },
    });
    return id;
  } catch {
    return null;
  }
}

/** Cancel a previously scheduled notification. */
export async function cancelNotif(id: string | null): Promise<void> {
  if (!id) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // ignore — notification may have already fired
  }
}
