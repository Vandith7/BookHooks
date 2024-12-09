import { Platform } from 'react-native';

const isEmulator = Platform.OS === 'android' && (
    Platform.constants.Model.includes('sdk') ||
    Platform.constants.Model.includes('Emulator')
);

export const platformConstants = {
    android: {
        emulator: 'https://buttered-snapdragon-mosquito.glitch.me', // Standard Android emulator IP address http://192.168.1.104:5001,https://buttered-snapdragon-mosquito.glitch.me
        device: 'https://buttered-snapdragon-mosquito.glitch.me', // Localhost for physical Android device http://localhost:5001
    },
};

export const ipv4 =
    Platform.OS === 'android'
        ? isEmulator
            ? platformConstants.android.emulator // Use emulator URL
            : platformConstants.android.device // Use device URL
        : platformConstants.android.device; // Default to device URL for other platforms
