import React from 'react';
import {StyleSheet, Text, View, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Snackbar from 'react-native-snackbar';

const Profile = () => {
  const navigation = useNavigation();

  const handleLogout = async () => {
    try {
      // Clear the token and isRegistered flag from AsyncStorage
      await AsyncStorage.removeItem('token');

      // Show a logout success message
      Snackbar.show({
        text: 'Logged out successfully!',
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: '#B08968',
        textColor: '#FFFFFF',
      });

      // Navigate to the login screen and reset the navigation stack
      navigation.navigate('Login');
      navigation.reset({
        index: 0,
        routes: [{name: 'Login'}],
      });
    } catch (error) {
      console.error('Error logging out:', error);
      Snackbar.show({
        text: 'Failed to log out. Please try again.',
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: '#FF6347',
        textColor: '#FFFFFF',
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff', // Adjust based on your theme
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    fontFamily: 'Poppins-SemiBold', // Customize the font if needed
  },
  logoutButton: {
    padding: 10,
    backgroundColor: '#ff6347', // Customize the button color
    borderRadius: 5,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
  },
});
