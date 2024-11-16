import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity, // Import TouchableOpacity
} from 'react-native';
import React, {useState, useEffect, useCallback} from 'react';
import {ThemeContext} from '../context/ThemeContext';
import TextSize from '../TextScaling';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import axios from 'axios';
import {ipv4} from '../assets/others/constants';
import {useNavigation} from '@react-navigation/native'; // Import useNavigation
import AsyncStorage from '@react-native-async-storage/async-storage';
import Snackbar from 'react-native-snackbar';

const SearchedBuddyDetails = ({route}) => {
  const {buddy} = route.params;
  const [loading, setLoading] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [hookedBooks, setHookedBooks] = useState([]);
  const [buddyTrackBooks, setBuddyTrackBooks] = useState([]);
  const [connections, setConnections] = useState('');
  const [buddyRequestStatus, setBuddyRequestStatus] = useState('none');
  const {theme} = React.useContext(ThemeContext);
  const [userData, setUserData] = useState(null);
  const navigation = useNavigation(); // Access navigation

  // Function to fetch hooked books
  const fetchHookedBooks = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${ipv4}/buddy-hooked-books`, {
        userId: buddy._id,
      });
      setHookedBooks(response.data.data);
    } catch (error) {
      console.error('Error fetching hooked books:', error);
    } finally {
      setLoading(false);
    }
  }, [buddy._id]);

  const checkBuddyRequestStatus = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(
        `${ipv4}/check-buddy-request-status`,
        {userId: buddy._id},
        {headers: {Authorization: `Bearer ${token}`}},
      );

      const status = response.data.status;
      const buddiesLength = response.data.buddiesLength;
      setBuddyRequestStatus(status); // Update buddyRequestStatus state
      setConnections(buddiesLength);
      if (status === 'friend') {
        // Proceed with getting trackbooks if status is 'friend'
        const trackBooksResponse = await axios.post(
          `${ipv4}/get-buddy-trackbooks`,
          {userId: buddy._id},
        );

        if (trackBooksResponse.status === 200) {
          setBuddyTrackBooks(trackBooksResponse.data.data);
        }
      }
    } catch (error) {
      console.error('Error checking buddy request status:', error);
      alert(
        error.response?.data?.message ||
          'Failed to check request status. Please try again.',
      );
    }
  }, [buddy._id]);

  const sendBuddyRequest = async () => {
    setRequestLoading(true);
    try {
      const token = await AsyncStorage.getItem('token'); // Fetch the token from storage
      const response = await axios.post(
        `${ipv4}/send-buddy-request`,
        {recipientId: buddy._id}, // Send only the recipientId in the body
        {
          headers: {
            Authorization: `Bearer ${token}`, // Attach the token in the headers
          },
        },
      );
      // alert(response.data.message); // Show success message
      Snackbar.show({
        text: 'Buddy request sent successfully!',
        duration: Snackbar.LENGTH_LONG,
        backgroundColor: '#B08968',
        textColor: '#FFFFFF',
      });
      checkBuddyRequestStatus();
    } catch (error) {
      console.error('Error sending buddy request:', error);

      Snackbar.show({
        text: `${
          error.response?.data?.message ||
          'Failed to send buddy request. Please try again.'
        }!`,
        duration: Snackbar.LENGTH_LONG,
        backgroundColor: '#B08968',
        textColor: '#FFFFFF',
      });
    } finally {
      setRequestLoading(false);
    }
  };

  const deleteBuddyRequest = async () => {
    setRequestLoading(true);
    try {
      const token = await AsyncStorage.getItem('token'); // Fetch the token from storage
      const response = await axios.delete(`${ipv4}/delete-buddy-request`, {
        headers: {
          Authorization: `Bearer ${token}`, // Attach the token in the headers
        },
        data: {recipientId: buddy._id}, // Include recipientId in the body
      });
      Snackbar.show({
        text: `${
          buddyRequestStatus == 'sent'
            ? 'Buddy request unsent!'
            : 'Buddy request deleted!'
        }`,
        duration: Snackbar.LENGTH_LONG,
        backgroundColor: '#B08968',
        textColor: '#FFFFFF',
      });
      checkBuddyRequestStatus(); // Refresh buddy request status
    } catch (error) {
      console.error('Error deleting buddy request:', error);
      Snackbar.show({
        text: `${
          error.response?.data?.message ||
          'Failed to delete buddy request. Please try again.'
        }!`,
        duration: Snackbar.LENGTH_LONG,
        backgroundColor: '#B08968',
        textColor: '#FFFFFF',
      });
    } finally {
      setRequestLoading(false);
    }
  };

  const acceptBuddyRequest = async () => {
    setRequestLoading(true);
    try {
      const token = await AsyncStorage.getItem('token'); // Fetch the token from storage
      const response = await axios.post(
        `${ipv4}/accept-buddy-request`,
        {userId: buddy._id}, // Send only the recipientId in the body
        {
          headers: {
            Authorization: `Bearer ${token}`, // Attach the token in the headers
          },
        },
      );
      // alert(response.data.message); // Show success message
      Snackbar.show({
        text: 'Buddy request accepted!',
        duration: Snackbar.LENGTH_LONG,
        backgroundColor: '#B08968',
        textColor: '#FFFFFF',
      });
      checkBuddyRequestStatus();
    } catch (error) {
      console.error('Error accepting buddy request:', error);

      Snackbar.show({
        text: `${
          error.response?.data?.message ||
          'Failed to accept buddy request. Please try again.'
        }!`,
        duration: Snackbar.LENGTH_LONG,
        backgroundColor: '#B08968',
        textColor: '#FFFFFF',
      });
    } finally {
      setRequestLoading(false);
    }
  };

  const getUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        showSessionExpiredMessage();
        navigateToLogin();
        return;
      }

      // Validate the token or fetch user data
      const response = await axios.post(`${ipv4}/user-data`, {token});

      // Set user data if token is valid
      setUserData(response.data.data._id);
    } catch (error) {
      console.error('Error fetching user data:', error);

      // Handle token-related errors specifically
      if (
        error.response?.status === 401 ||
        error.response?.data?.error === 'TokenExpiredError'
      ) {
        showSessionExpiredMessage();
      } else {
        Snackbar.show({
          text: 'An error occurred while fetching user data. Please try again.',
          duration: Snackbar.LENGTH_LONG,
          backgroundColor: '#B08968',
          textColor: '#FFFFFF',
        });
      }
      navigateToLogin();
    }
  };

  // Fetch hooked books when the component mounts
  useEffect(() => {
    getUserData();
    fetchHookedBooks();
    checkBuddyRequestStatus();
  }, [connections, buddyRequestStatus]);

  return (
    <ScrollView style={[styles.container, {backgroundColor: theme.background}]}>
      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} />
      ) : (
        <>
          <View style={styles.titleContainer}>
            <Image
              source={
                buddy.profileImage
                  ? {uri: buddy.profileImage}
                  : require('../assets/images/default.jpg')
              }
              resizeMode="contain"
              style={styles.profileImage}
            />
            <View style={{width: '68%', alignItems: 'center'}}>
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
                {connections}
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
            </View>
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
              {buddy.firstName} {buddy.lastName}
            </Text>
            <Text
              style={[
                {
                  color: theme.text,
                  fontFamily: 'Poppins-Regular',
                  fontSize: TextSize.XSmall,
                },
              ]}>
              {buddy.bio}
            </Text>
          </View>
          <View
            style={[styles.hookDetailsContainer, {borderTopColor: theme.text}]}>
            <View style={{alignItems: 'center', width: '44%'}}>
              <Text
                style={[
                  {
                    color: theme.text,
                    textAlign: 'center',
                    fontSize: TextSize.Small,
                    fontFamily: 'Poppins-SemiBold',
                  },
                ]}>
                {hookedBooks.totalHookedBooks}
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
                Total Books Hooked
              </Text>
            </View>
            <View style={{alignItems: 'center', width: '44%'}}>
              <Text
                style={[
                  {
                    color: theme.text,
                    textAlign: 'center',
                    fontSize: TextSize.Small,
                    fontFamily: 'Poppins-SemiBold',
                  },
                ]}>
                {hookedBooks.totalAcceptedUnhooks}
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
                Total Books UnHooked
              </Text>
            </View>
          </View>
          <View style={styles.hookedBooks}>
            <Text
              style={{
                fontSize: TextSize.Tiny,
                fontFamily: 'Poppins-SemiBold',
                color: theme.text,
                // backgroundColor: 'red',
                paddingHorizontal: wp(2),
              }}>
              Hooked Books of {buddy.userName} you can UnHook :
            </Text>
            <FlatList
              data={hookedBooks.booksWithRequestCounts}
              keyExtractor={item => item._id}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{width: '100%'}}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={[styles.bookItem, {backgroundColor: theme.card}]}
                  onPress={() =>
                    navigation.navigate('BookDetails', {
                      book: item,
                      currentUserId: userData, // Assuming buddy._id as the current user id
                    })
                  }>
                  <Image
                    source={
                      item.bookThumbnail
                        ? {uri: item.bookThumbnail}
                        : item.images.length > 0
                        ? {uri: item.images[0]}
                        : require('../assets/images/book-stack.png')
                    }
                    resizeMode="contain"
                    style={styles.bookImage}
                  />
                  <Text
                    style={{
                      color: theme.text,
                      fontSize: TextSize.Tiny,
                      fontFamily: 'Poppins-SemiBold',
                      textAlign: 'center',
                      marginTop: 10,
                    }}
                    numberOfLines={2} // Limit the title to 4 lines
                    ellipsizeMode="tail" // Add "..." at the end if the text overflows
                  >
                    {item.title}
                  </Text>

                  <Text
                    style={{
                      color: theme.text,
                      fontSize: TextSize.Tiny,
                      fontFamily: 'Poppins-SemiBold',
                      textAlign: 'center',
                    }}
                    numberOfLines={1} // Limit the title to 4 lines
                    ellipsizeMode="tail" // Add "..." at the end if the text overflows
                  >
                    by {item.author}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
          <View
            style={{
              width: wp(90),
              marginTop: 10,
              borderTopWidth: 1,
              borderTopColor: theme.text,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            {buddyRequestStatus === 'friend' && buddyTrackBooks.length > 0 ? (
              <View
                style={{
                  width: wp(90),
                  marginTop: hp(1),
                  paddingVertical: hp(2),
                }}>
                <Text
                  style={{
                    fontSize: TextSize.Tiny,
                    fontFamily: 'Poppins-SemiBold',
                    color: theme.text,
                    // backgroundColor: 'red',
                    paddingHorizontal: wp(2),
                  }}>
                  Books {buddy.userName} is interested in :
                </Text>
                <FlatList
                  data={buddyTrackBooks}
                  keyExtractor={item => item._id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{
                    width: '100%',
                    marginBottom: hp(2),
                  }}
                  renderItem={({item}) => (
                    <TouchableOpacity
                      style={[styles.bookItem, {backgroundColor: theme.card}]}
                      onPress={() =>
                        navigation.navigate('BuddyTrackBook', {
                          book: item,
                          buddy: buddy, // Assuming buddy._id as the current user id
                        })
                      }>
                      <Image
                        source={
                          item.bookThumbnail
                            ? {uri: item.bookThumbnail}
                            : item.images.length > 0
                            ? {uri: item.images[0]}
                            : require('../assets/images/book-stack.png')
                        }
                        resizeMode="contain"
                        style={styles.bookImage}
                      />
                      <Text
                        style={{
                          color: theme.text,
                          fontSize: TextSize.Tiny,
                          fontFamily: 'Poppins-SemiBold',
                          textAlign: 'center',
                          marginTop: 10,
                        }}
                        numberOfLines={2} // Limit the title to 4 lines
                        ellipsizeMode="tail" // Add "..." at the end if the text overflows
                      >
                        {item.title}
                      </Text>

                      <Text
                        style={{
                          color: theme.text,
                          fontSize: TextSize.Tiny,
                          fontFamily: 'Poppins-SemiBold',
                          textAlign: 'center',
                        }}
                        numberOfLines={1} // Limit the title to 4 lines
                        ellipsizeMode="tail" // Add "..." at the end if the text overflows
                      >
                        by {item.author}
                      </Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            ) : buddyRequestStatus == 'friend' &&
              buddyTrackBooks.length == 0 ? (
              <View
                style={{
                  width: wp(90),
                  marginTop: 10,
                  // borderTopWidth: 1,
                  paddingTop: 10,
                  // borderTopColor: theme.text,
                }}>
                <Text
                  style={{
                    fontSize: TextSize.Tiny,
                    fontFamily: 'Poppins-SemiBold',
                    textAlign: 'center',
                    color: theme.text,
                    // backgroundColor: 'red',
                    paddingHorizontal: wp(2),
                  }}>
                  {buddy.userName} has not tracked any books
                </Text>
              </View>
            ) : buddyRequestStatus === 'received' ? (
              <View>
                <Text
                  style={{
                    fontSize: TextSize.Small,
                    fontFamily: 'Poppins-SemiBold',
                    color: theme.text,
                    textAlign: 'center',
                    marginTop: hp(2),
                    paddingHorizontal: wp(2),
                  }}>
                  {buddy.userName} has sent you a Buddy request :
                </Text>
                <View style={styles.requestActions}>
                  <TouchableOpacity
                    onPress={acceptBuddyRequest}
                    style={[
                      styles.buddyRequestActionButtons,
                      {
                        backgroundColor: theme.accent1,
                        elevation: 4,
                      },
                    ]}>
                    <Text
                      style={{
                        fontSize: TextSize.H6,
                        color: theme.text,
                        fontFamily: 'Poppins-Bold',
                      }}>
                      Accept
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={deleteBuddyRequest}
                    style={[
                      styles.buddyRequestActionButtons,
                      {
                        backgroundColor: theme.accent2,
                        elevation: 4,
                      },
                    ]}>
                    <Text
                      style={{
                        fontSize: TextSize.H6,
                        color: theme.text,
                        fontFamily: 'Poppins-Bold',
                      }}>
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View
                style={{
                  width: wp(100),
                  padding: hp(2),
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <TouchableOpacity
                  onPress={
                    buddyRequestStatus === 'sent'
                      ? deleteBuddyRequest
                      : sendBuddyRequest
                  }
                  disabled={requestLoading}
                  style={[
                    styles.buddyRequestButton,
                    {
                      backgroundColor:
                        buddyRequestStatus === 'sent'
                          ? theme.accent1
                          : theme.primary,
                      elevation: 4,
                    },
                  ]}>
                  {requestLoading ? (
                    <ActivityIndicator size="large" color={theme.accent2} />
                  ) : (
                    <Text
                      style={{
                        fontSize: TextSize.H6,
                        color: theme.text,
                        fontFamily: 'Poppins-Bold',
                      }}>
                      {buddyRequestStatus === 'sent'
                        ? 'Buddy Request Sent'
                        : 'Send a Buddy Request'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
};

export default SearchedBuddyDetails;

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
  hookDetailsContainer: {
    width: wp(90),
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginTop: 10,
    borderTopWidth: 1,
    paddingTop: 10,
  },
  hookedBooks: {
    width: wp(90),
    marginTop: hp(2),
  },
  bookItem: {
    padding: 10,
    borderRadius: 10,
    elevation: 5,
    height: 'auto',
    width: wp('30%'), // Adjust this value for desired item width
    margin: wp('2%'),
  },
  buddyRequestButton: {
    width: wp(88),
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: '8%',
  },
  bookImage: {
    width: '100%',
    height: 110,
    borderRadius: 5,
  },
  requestActions: {
    flexDirection: 'row',
    width: wp(82),
    padding: hp(2),
    alignItems: 'center',
    justifyContent: 'space-evenly',
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
