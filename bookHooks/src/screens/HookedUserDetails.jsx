import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {ThemeContext} from '../context/ThemeContext';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import TextSize from '../TextScaling';
import axios from 'axios';
import Snackbar from 'react-native-snackbar';
import {ipv4} from '../assets/others/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HookedUserDetails = ({route, navigation}) => {
  const {
    userName,
    userID,
    profileImage,
    bookName,
    requestId,
    bookId,
    returnStatus,
    book,
  } = route.params;
  const [chatId, setChatId] = useState('');
  const {theme} = React.useContext(ThemeContext);
  const user = {userName: userName, profileImage: profileImage};
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

  const askToReturnBook = async () => {
    try {
      const response = await axios.post(`${ipv4}/update-return-status`, {
        bookId: bookId, // Use the correct book ID here
        returnStatus: 'requested',
      });
      if (response.status === 200) {
        Snackbar.show({
          text: `You have requested ${userName} to return ${bookName}.`,
          duration: Snackbar.LENGTH_LONG,
          backgroundColor: '#B08968',
          textColor: '#FFFFFF',
        });
        navigation.navigate('Home');
      }
    } catch (error) {
      console.error('Error requesting return:', error);
    }
  };

  const confirmReturnBook = async () => {
    try {
      // Send the request to update the return status and requester confirmation
      const response = await axios.post(
        `${ipv4}/confirm-receive-return-status`,
        {
          bookId: book._id, // Use the correct book ID here
          returnStatus: 'confirmed', // Update the status to 'confirmed'
          ownerConfirmed: true, // Set the requesterConfirmed to true
          requestId: requestId,
        },
      );

      if (response.status === 200) {
        Snackbar.show({
          text: `You have confirmed the that you received ${bookName}.`,
          duration: Snackbar.LENGTH_INDEFINITE, // Snackbar will stay until dismissed
          backgroundColor: '#B08968',
          textColor: '#FFFFFF',
          action: {
            text: 'GOT IT!',
            textColor: '#FFFFFF',
            onPress: () => Snackbar.dismiss(),
          },
        });
        navigation.navigate('Home');
      }
    } catch (error) {
      console.error('Error confirming return:', error);
    }
  };

  useEffect(() => {
    const fetchChat = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const chatIdResponse = await axios.get(
          `${ipv4}/chat-api/get-chats/${userID}`,
          {
            headers: {Authorization: `Bearer ${token}`},
          },
        );
        setChatId(chatIdResponse.data.chatId);
      } catch (error) {
        console.error('Error fetching chat:', error);
      }
    };

    if (userID) {
      fetchChat();
    }
  }, [userID]);
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={[styles.container, {backgroundColor: theme.background}]}>
      <View style={[styles.headContainer]}>
        {book.returnConfirmation.requesterConfirmed == true ? (
          <>
            <Text
              style={[
                styles.message,
                {fontSize: TextSize.Small, color: theme.text},
              ]}>
              <Text style={{fontFamily: 'Poppins-SemiBold'}}>{userName}</Text>{' '}
              has returned {bookName}. Kindly acknowledge.
            </Text>
            <View style={[styles.buttonContainer]}>
              <TouchableOpacity
                onPress={confirmReturnBook}
                style={[
                  styles.buyButton,
                  {backgroundColor: theme.primary, width: '100%'},
                ]}>
                <Text style={[styles.buyButtonText, {color: theme.text}]}>
                  I've received the book
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <Text
            style={[
              styles.message,
              {fontSize: TextSize.Small, color: theme.text},
            ]}>
            <Text style={{fontFamily: 'Poppins-SemiBold'}}>{userName}</Text> has
            unHooked{' '}
            <Text style={{fontFamily: 'Poppins-SemiBold'}}>{bookName}</Text>{' '}
            hooked by you.
          </Text>
        )}

        <View style={[styles.buttonContainer]}>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('ChatScreen', {
                chatId: chatId,
                user: user,
              })
            }
            style={[
              styles.buyButton,
              {backgroundColor: theme.primary, width: '100%'},
            ]}>
            <Text style={[styles.buyButtonText, {color: theme.text}]}>
              Chat with {userName}
            </Text>
          </TouchableOpacity>
        </View>

        {returnStatus == 'none' ? (
          <View style={[styles.buttonContainer]}>
            <TouchableOpacity
              onPress={askToReturnBook}
              style={[
                styles.buyButton,
                {backgroundColor: theme.primary, width: '100%'},
              ]}>
              <Text style={[styles.buyButtonText, {color: theme.text}]}>
                Ask {userName} to return the Book
              </Text>
            </TouchableOpacity>
          </View>
        ) : returnStatus == 'requested' ? (
          <View style={[styles.buttonContainer]}>
            <TouchableOpacity
              onPress={askToReturnBook}
              disabled
              style={[
                styles.buyButton,
                {backgroundColor: theme.primary, width: '100%'},
              ]}>
              <Text style={[styles.buyButtonText, {color: theme.text}]}>
                Requested {userName} to return the Book
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
};

export default HookedUserDetails;

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
