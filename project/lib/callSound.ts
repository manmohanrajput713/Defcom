import { Audio } from 'expo-av';
import { Platform } from 'react-native';

let callingSound: Audio.Sound | null = null;
let ringtoneSound: Audio.Sound | null = null;

// Initialize audio mode for calls
export async function initializeAudioMode() {
    try {
        await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: false,
        });
    } catch (error) {
        console.error('[CallSound] Failed to set audio mode:', error);
    }
}

// Play calling sound (outgoing call)
export async function playCallingSound() {
    try {
        await stopCallingSound(); // Stop any existing sound

        // Use a built-in tone pattern by playing a simple beep sequence
        const { sound } = await Audio.Sound.createAsync(
            // This creates a simple calling tone using an online resource
            { uri: 'https://cdn.freesound.org/previews/135/135936_2512241-lq.mp3' },
            { isLooping: true, volume: 0.7 }
        );

        callingSound = sound;
        await callingSound.playAsync();
        console.log('[CallSound] Calling sound started');
    } catch (error) {
        console.error('[CallSound] Failed to play calling sound:', error);
    }
}

// Stop calling sound
export async function stopCallingSound() {
    try {
        if (callingSound) {
            await callingSound.stopAsync();
            await callingSound.unloadAsync();
            callingSound = null;
            console.log('[CallSound] Calling sound stopped');
        }
    } catch (error) {
        console.error('[CallSound] Failed to stop calling sound:', error);
    }
}

// Play ringtone (incoming call)
export async function playRingtone() {
    try {
        await stopRingtone(); // Stop any existing ringtone

        const { sound } = await Audio.Sound.createAsync(
            { uri: 'https://cdn.freesound.org/previews/220/220206_3966706-lq.mp3' },
            { isLooping: true, volume: 1.0 }
        );

        ringtoneSound = sound;
        await ringtoneSound.playAsync();
        console.log('[CallSound] Ringtone started');
    } catch (error) {
        console.error('[CallSound] Failed to play ringtone:', error);
    }
}

// Stop ringtone
export async function stopRingtone() {
    try {
        if (ringtoneSound) {
            await ringtoneSound.stopAsync();
            await ringtoneSound.unloadAsync();
            ringtoneSound = null;
            console.log('[CallSound] Ringtone stopped');
        }
    } catch (error) {
        console.error('[CallSound] Failed to stop ringtone:', error);
    }
}

// Stop all call sounds
export async function stopAllCallSounds() {
    await stopCallingSound();
    await stopRingtone();
}
