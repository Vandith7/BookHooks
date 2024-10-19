import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useContext} from 'react';
import {ThemeContext} from '../context/ThemeContext';
import axios from 'axios';
import {ipv4} from '../assets/others/constants';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import TextSize from '../TextScaling';
import Snackbar from 'react-native-snackbar';

const UnHookRequestDetails = ({route, navigation}) => {
  const {theme} = useContext(ThemeContext);
  const {title, request, owner, ownerName, status} = route.params;

  const deleteRequest = async () => {
    try {
      const response = await axios.post(`${ipv4}/delete-unhook-request`, {
        requestId: request,
      });
      if (response.status === 200) {
        Snackbar.show({
          text: `Unhook request deleted!`,
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
      <View style={styles.headContainer}>
        <Text
          style={[
            styles.message,
            {fontSize: TextSize.Small, color: theme.text},
          ]}>
          Your UnHook request for
          <Text style={{fontFamily: 'Poppins-SemiBold'}}> {title}</Text> hooked
          by <Text style={{fontFamily: 'Poppins-SemiBold'}}>{ownerName}</Text>{' '}
          is <Text style={{fontFamily: 'Poppins-SemiBold'}}>{status}</Text>.
        </Text>

        {status !== 'accepted' ? (
          <>
            <Text style={[styles.message, {fontSize: TextSize.Small}]}>
              <Text style={{fontFamily: 'Poppins-Regular', color: theme.text}}>
                Do you want to delete the request?
              </Text>
            </Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.buyButton,
                  {backgroundColor: theme.primary, width: '100%'},
                ]}
                onPress={deleteRequest}>
                <Text style={[styles.buyButtonText, {color: theme.text}]}>
                  Delete Request
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : null}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.buyButton,
              {backgroundColor: theme.primary, width: '100%'},
            ]}>
            <Text style={[styles.buyButtonText, {color: theme.text}]}>
              Chat with {ownerName}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export default UnHookRequestDetails;

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
