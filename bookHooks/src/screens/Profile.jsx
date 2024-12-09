import React, {useCallback, useEffect, useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Snackbar from 'react-native-snackbar';
import axios from 'axios';
import {ipv4} from '../assets/others/constants';
import {ThemeContext} from '../context/ThemeContext';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import TextSize from '../TextScaling';
import {th} from 'date-fns/locale';
import ThemeSelector from '../components/ThemeSelector';

const Profile = () => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const {theme} = React.useContext(ThemeContext);
  const getUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');

      // Make the API request with the token in the Authorization header
      const response = await axios.post(
        `${ipv4}/user-data`,
        {}, // Empty body, assuming the endpoint does not need a payload
        {
          headers: {Authorization: `Bearer ${token}`},
        },
      );

      // If the response is successful, set the user data
      setUserData(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user data:', error);
      Snackbar.show({
        text: 'An error occurred while fetching user data. Please try again.',
        duration: Snackbar.LENGTH_LONG,
        backgroundColor: '#B08968',
        textColor: '#FFFFFF',
      });
      setLoading(false);
    }
  };
  useFocusEffect(
    useCallback(() => {
      getUserData();
    }, []),
  );
  useEffect(() => {
    getUserData();
  }, []);
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
    <View style={[styles.container, {backgroundColor: theme.background}]}>
      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} />
      ) : (
        <ScrollView>
          <View style={styles.titleContainer}>
            <Image
              source={
                userData.profileImage
                  ? {uri: userData.profileImage}
                  : require('../assets/images/default.jpg')
              }
              resizeMode="contain"
              style={styles.profileImage}
            />
            <TouchableOpacity
              onPress={() => {
                navigation.navigate('MyBuddies', {user: userData});
              }}
              style={{width: '68%', alignItems: 'center'}}>
              <Text
                style={[
                  styles.title,
                  {
                    color: theme.text,
                    textAlign: 'center',
                    fontSize: TextSize.Small,
                    fontFamily: 'Poppins-SemiBold',
                  },
                ]}>
                {userData.buddies.length}
              </Text>
              <Text
                style={[
                  {
                    color: theme.text,
                    textAlign: 'center',
                    fontSize: TextSize.Tiny,
                    fontFamily: 'Poppins-SemiBold',
                  },
                ]}>
                Buddy connections
              </Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.bioContainer]}>
            <Text
              style={[
                {
                  color: theme.text,
                  fontFamily: 'Poppins-SemiBold',
                  fontSize: TextSize.XSmall,
                },
              ]}>
              {userData.firstName} {userData.lastName}
            </Text>
            <Text
              style={[
                {
                  color: theme.text,
                  fontFamily: 'Poppins-Regular',
                  fontSize: TextSize.XSmall,
                },
              ]}>
              {userData.bio}
            </Text>
          </View>
          <View style={[styles.requestActions, {borderTopColor: theme.text}]}>
            <TouchableOpacity
              onPress={() => {
                navigation.navigate('EditProfile', {user: userData});
              }}
              style={[
                styles.buddyRequestActionButtons,
                {
                  backgroundColor: theme.primary,
                  elevation: 4,
                },
              ]}>
              <Text
                style={{
                  fontSize: TextSize.H6,
                  color: theme.text,
                  fontFamily: 'Poppins-Bold',
                }}>
                Edit Profile
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleLogout}
              style={[
                styles.buddyRequestActionButtons,
                {
                  backgroundColor: '#FF4C4C',
                  elevation: 4,
                },
              ]}>
              <Text
                style={{
                  fontSize: TextSize.H6,
                  color: theme.text,
                  fontFamily: 'Poppins-Bold',
                }}>
                Logout
              </Text>
            </TouchableOpacity>
          </View>
          <ThemeSelector></ThemeSelector>
        </ScrollView>
      )}
    </View>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  titleContainer: {
    width: '100%',
    flexDirection: 'row',
    marginBottom: 10,
  },
  profileImage: {
    width: wp('20%'),
    height: wp('20%'),
    borderRadius: wp(28),
    marginRight: wp(2),
    marginLeft: wp(2),
  },
  title: {
    fontSize: TextSize.Medium,
    height: 'auto',
    width: wp(48),
    margin: hp(1),
    top: hp(1),
    flexShrink: 1,
  },
  bioContainer: {
    width: wp(86),
    height: 'auto',
    justifyContent: 'center',
    marginLeft: wp(2),
  },
  requestActions: {
    flexDirection: 'row',
    marginTop: hp(2),
    width: wp(90),
    paddingVertical: hp(2),
    alignItems: 'center',
    justifyContent: 'space-evenly',
    borderTopWidth: 1,
  },
  buddyRequestActionButtons: {
    width: wp(32),
    textAlign: 'center',
    textAlignVertical: 'center',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 10,
  },
});
