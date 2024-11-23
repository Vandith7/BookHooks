import { Platform } from 'react-native';

const isEmulator = Platform.OS === 'android' && (
    Platform.constants.Model.includes('sdk') ||
    Platform.constants.Model.includes('Emulator')
);

export const platformConstants = {
    android: {
        emulator: 'http://192.168.1.104:5001', // Standard Android emulator IP address
        device: 'http://localhost:5001', // Localhost for physical Android device
    },
};

export const ipv4 =
    Platform.OS === 'android'
        ? isEmulator
            ? platformConstants.android.emulator // Use emulator URL
            : platformConstants.android.device // Use device URL
        : platformConstants.android.device; // Default to device URL for other platforms
