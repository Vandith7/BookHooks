import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React from 'react';
import {ThemeContext} from '../context/ThemeContext';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import TextSize from '../TextScaling';
import axios from 'axios';
import Snackbar from 'react-native-snackbar';
import {ipv4} from '../assets/others/constants';

const RequesterDetails = ({route, navigation}) => {
  const {userName, userID, bookName, requestId} = route.params;
  const {theme} = React.useContext(ThemeContext);

  const acceptRequest = async () => {
    try {
      const response = await axios.post(`${ipv4}/accept-unhook-request`, {
        requestId: requestId,
      });
      if (response.status === 200) {
        Snackbar.show({
          text: `${bookName} has been unHooked by ${userName}!`,
          duration: Snackbar.LENGTH_LONG,
          backgroundColor: '#B08968',
          textColor: '#FFFFFF',
        });
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error deleting unhook request:', error);
    }
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={[styles.container, {backgroundColor: theme.background}]}>
      <View style={[styles.headContainer]}>
        <Text
          style={[
            styles.message,
            {fontSize: TextSize.Small, color: theme.text},
          ]}>
          <Text style={{fontFamily: 'Poppins-SemiBold'}}>{userName}</Text> has
          requested to unHook{' '}
          <Text style={{fontFamily: 'Poppins-SemiBold'}}>{bookName}</Text>{' '}
          hooked by you.
        </Text>
        <Text style={[styles.message, {fontSize: TextSize.Small}]}>
          <Text style={{fontFamily: 'Poppins-Regular', color: theme.text}}>
            Do you want to accept the request?
          </Text>
        </Text>
        <View style={[styles.buttonContainer]}>
          <TouchableOpacity
            style={[
              styles.buyButton,
              {
                backgroundColor: theme.primary,
                width: '48%',
              },
            ]}
            onPress={acceptRequest}>
            <Text style={[styles.buyButtonText, {color: theme.text}]}>
              Accept Request
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.buyButton,
              {backgroundColor: theme.primary, width: '48%'},
            ]}>
            <Text style={[styles.buyButtonText, {color: theme.text}]}>
              Decline Request
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export default RequesterDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  headContainer: {
    height: 'auto',
    width: wp(90),
  },
  message: {
    fontFamily: 'Poppins-Regular',
  },
  buttonContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  buyButton: {
    width: '48%',
    marginVertical: 20,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buyButtonText: {
    fontSize: TextSize.Small,
    fontFamily: 'Poppins-Bold',
  },
});
