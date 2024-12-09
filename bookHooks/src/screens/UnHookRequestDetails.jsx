import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useContext, useEffect, useState} from 'react';
import {ThemeContext} from '../context/ThemeContext';
import axios from 'axios';
import {ipv4} from '../assets/others/constants';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import TextSize from '../TextScaling';
import Snackbar from 'react-native-snackbar';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UnHookRequestDetails = ({route, navigation}) => {
  const {theme} = useContext(ThemeContext);
  const {title, request, owner, ownerName, profileImage, status, book} =
    route.params;
  const [chatId, setChatId] = useState('');
  const user = {userName: ownerName, profileImage: profileImage};
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

  const acceptReturnBook = async () => {
    try {
      const response = await axios.post(`${ipv4}/update-return-status`, {
        bookId: book._id, // Use the correct book ID here
        returnStatus: 'accepted',
      });
      if (response.status === 200) {
        Snackbar.show({
          text: `You have agreed to return ${title} to ${ownerName}..`,
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
      console.error('Error requesting return:', error);
    }
  };

  const confirmReturnBook = async () => {
    try {
      // Send the request to update the return status and requester confirmation
      const response = await axios.post(`${ipv4}/confirm-return-status`, {
        bookId: book._id, // Use the correct book ID here
        returnStatus: 'accepted', // Update the status to 'confirmed'
        requesterConfirmed: true, // Set the requesterConfirmed to true
      });

      if (response.status === 200) {
        Snackbar.show({
          text: `You have confirmed the return of ${title} to ${ownerName}.`,
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
          `${ipv4}/chat-api/get-chats/${owner}`, // Adjusted API endpoint
          {
            headers: {Authorization: `Bearer ${token}`},
          },
        );
        setChatId(chatIdResponse.data.chatId);
      } catch (error) {
        console.error('Error fetching chat:', error);
      }
    };

    if (owner) {
      fetchChat();
    }
  }, [owner]);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={[styles.container, {backgroundColor: theme.background}]}>
      <View style={styles.headContainer}>
        {}
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

        {status === 'pending' ? (
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
        {book.returnConfirmation.ownerConfirmed == true ? (
          <>
            <Text style={[styles.buyButtonText, {color: theme.text}]}>
              You've returned {title} to {ownerName}.
            </Text>
            <Text style={[styles.buyButtonText, {color: theme.text}]}>
              {ownerName} has confirmed the book has been received.
            </Text>
          </>
        ) : book.returnConfirmation.requesterConfirmed == true ? (
          <>
            <Text style={[styles.buyButtonText, {color: theme.text}]}>
              You've returned {title} to {ownerName}.
            </Text>
            <Text style={[styles.buyButtonText, {color: theme.text}]}>
              Kindly wait for {ownerName} to confirm once the book has been
              received.
            </Text>
          </>
        ) : book.returnStatus == 'requested' ? (
          <>
            <Text style={[styles.buyButtonText, {color: theme.text}]}>
              {ownerName} has requested to return the book
            </Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={acceptReturnBook}
                style={[
                  styles.buyButton,
                  {backgroundColor: theme.primary, width: '100%'},
                ]}>
                <Text style={[styles.buyButtonText, {color: theme.text}]}>
                  Return the book
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : book.returnStatus == 'accepted' ? (
          <>
            <Text style={[styles.buyButtonText, {color: theme.text}]}>
              You have agreed to return {title} to {ownerName}. Kindly return it
              at your earliest convenience.
            </Text>
            <Text style={[styles.buyButtonText, {color: theme.text}]}>
              Once you return the book, please confirm the return, and then{' '}
              {ownerName} will verify once the book is received.
            </Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={confirmReturnBook}
                style={[
                  styles.buyButton,
                  {backgroundColor: theme.primary, width: '100%'},
                ]}>
                <Text style={[styles.buyButtonText, {color: theme.text}]}>
                  I've returned the book
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          ''
        )}
        <View style={styles.buttonContainer}>
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
