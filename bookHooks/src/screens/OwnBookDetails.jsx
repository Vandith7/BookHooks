import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import axios from 'axios';
import {ipv4} from '../assets/others/constants';
import {ThemeContext} from '../context/ThemeContext';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import TextSize from '../TextScaling';
import Snackbar from 'react-native-snackbar';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {formatDistanceToNow} from 'date-fns';

const OwnBookDetails = ({route}) => {
  const {book, currentUserId} = route.params;
  const {theme} = React.useContext(ThemeContext);
  const [googleBookData, setGoogleBookData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requesters, setRequesters] = useState([]);
  const [requestAccepted, setRequestAccepted] = useState(null);
  const [userName, setUserName] = useState('');
  const [isRequestPending, setIsRequestPending] = useState(false);
  const navigation = useNavigation();

  // Function to fetch book details from Google Books API
  const fetchBookDetailsFromGoogle = async isbn => {
    try {
      const response = await axios.get(
        `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`,
      );
      if (response.data.items && response.data.items.length > 0) {
        setGoogleBookData(response.data.items[0].volumeInfo);
      }
    } catch (error) {
      console.error('Error fetching book details from Google:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user details
  const fetchUserDetails = async owner => {
    try {
      const response = await axios.get(`${ipv4}/user/${owner}`);
      if (response.data) {
        setUserName(response.data.data.userName);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  // Fetch users who have requested to hook the book
  const fetchRequesters = async () => {
    try {
      const response = await axios.get(`${ipv4}/book-requests`, {
        params: {bookId: book._id},
      });
      if (response.data && response.data.requesters) {
        setRequesters(response.data.requesters);
      }
    } catch (error) {
      console.error('Error fetching book requesters:', error);
    }
  };

  const fetchRequestAccepted = async () => {
    try {
      const response = await axios.get(`${ipv4}/book-requests-accepted`, {
        params: {bookId: book._id},
      });
      if (response.data && response.data.requesters) {
        setRequestAccepted(response.data.requesters[0]);
      }
    } catch (error) {
      console.error('Error fetching book requesters:', error);
    }
  };

  // Handle unhook request
  const handleUnhookRequest = async () => {
    try {
      const response = await axios.post(`${ipv4}/unhook-request`, {
        bookId: book._id,
        requesterId: currentUserId,
        ownerId: book.owner,
      });

      if (response.status === 201) {
        Snackbar.show({
          text: 'Unhook request sent!',
          duration: Snackbar.LENGTH_LONG,
          backgroundColor: '#B08968',
          textColor: '#FFFFFF',
        });
        navigation.reset({
          index: 0,
          routes: [{name: 'Home'}],
        });
      } else {
        Snackbar.show({
          text: 'Something went wrong, please try again.',
          duration: Snackbar.LENGTH_LONG,
          backgroundColor: '#B08968',
          textColor: '#FFFFFF',
        });
      }
    } catch (error) {
      console.error('Error sending unhook request:', error);
      Snackbar.show({
        text: 'Something went wrong, please try again.',
        duration: Snackbar.LENGTH_LONG,
        backgroundColor: '#B08968',
        textColor: '#FFFFFF',
      });
    }
  };

  useEffect(() => {
    const isbn = book.isbn13 ? book.isbn13 : book.isbn10;
    fetchBookDetailsFromGoogle(isbn);
    fetchUserDetails(book.owner);
    fetchRequesters();
    fetchRequestAccepted();
  }, [book]);

  useFocusEffect(
    useCallback(() => {
      fetchRequesters();
      fetchRequestAccepted();
    }, []),
  );

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={[styles.container, {backgroundColor: theme.background}]}>
      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} />
      ) : (
        <>
          <View style={styles.titleContainer}>
            <Image
              source={
                book.bookThumbnail
                  ? {uri: book.bookThumbnail}
                  : require('../assets/images/book-stack.png')
              }
              resizeMode="contain"
              style={styles.bookImage}
            />
            <View>
              <Text
                style={[
                  styles.title,
                  {color: theme.text, fontFamily: 'Poppins-SemiBold'},
                ]}>
                {book.title}
              </Text>
              {googleBookData && googleBookData.subtitle && (
                <Text
                  style={[
                    styles.subtitle,
                    {fontFamily: 'Poppins-SemiBold', color: theme.text},
                  ]}>
                  {googleBookData.subtitle}
                </Text>
              )}
              <Text style={[styles.author, {color: theme.text}]}>
                by {book.author}
              </Text>
            </View>
          </View>
          <View style={styles.detailsContainer}>
            {requestAccepted ? (
              <>
                <Text style={[styles.requestersTitle, {color: theme.text}]}>
                  Book currently unHooked by:
                </Text>
                <TouchableOpacity
                  style={styles.requesterItem}
                  onPress={() =>
                    navigation.navigate('HookedUserDetails', {
                      userName: requestAccepted.requester.userName,
                      userID: requestAccepted.requester._id,
                      bookName: book.title,
                      requestId: requestAccepted._id,
                    })
                  }>
                  <View style={styles.requesterDetails}>
                    <Image
                      source={
                        requestAccepted.requester.profileImage
                          ? {uri: requestAccepted.requester.profileImage}
                          : require('../assets/images/default.jpg')
                      }
                      style={styles.profileImage}
                    />
                    <View style={{flexDirection: 'column'}}>
                      <Text style={[styles.requesterText, {color: theme.text}]}>
                        {requestAccepted.requester.userName}
                      </Text>
                      <Text style={[styles.requesterTime, {color: theme.text}]}>
                        Unhooked{' '}
                        {formatDistanceToNow(
                          new Date(requestAccepted.unHookedAt),
                          {
                            addSuffix: true,
                          },
                        )}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </>
            ) : (
              <View
                style={[styles.buttonContainer, {justifyContent: 'center'}]}>
                <TouchableOpacity
                  style={[styles.buyButton, {backgroundColor: theme.primary}]}
                  onPress={handleUnhookRequest}>
                  <Text style={[styles.buyButtonText, {color: theme.text}]}>
                    Delete book
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {requesters.length > 0 && (
              <View style={styles.requestersContainer}>
                <Text style={[styles.requestersTitle, {color: theme.text}]}>
                  Users who have requested to unhook this book:
                </Text>
                <FlatList
                  data={requesters}
                  keyExtractor={item => item._id}
                  renderItem={({item}) => (
                    <TouchableOpacity
                      style={styles.requesterItem}
                      onPress={() =>
                        navigation.navigate('RequesterDetails', {
                          userName: item.requester.userName,
                          userID: item.requester._id,
                          bookName: book.title,
                          requestId: item._id,
                        })
                      }>
                      <View style={styles.requesterDetails}>
                        <Image
                          source={
                            item.requester.profileImage
                              ? {uri: item.requester.profileImage}
                              : require('../assets/images/default.jpg')
                          }
                          style={styles.profileImage}
                        />
                        <View style={{flexDirection: 'column'}}>
                          <Text
                            style={[styles.requesterText, {color: theme.text}]}>
                            {item.requester.userName}
                          </Text>
                          <Text
                            style={[styles.requesterTime, {color: theme.text}]}>
                            {formatDistanceToNow(new Date(item.createdAt), {
                              addSuffix: true,
                            })}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
};

export default OwnBookDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  titleContainer: {
    width: '100%',
    flexDirection: 'row',
    marginBottom: 20,
  },
  bookImage: {
    width: '38%',
    height: hp('28%'),
    borderRadius: 5,
    marginRight: 10,
  },
  title: {
    fontSize: TextSize.Medium,
    height: 'auto',
    width: wp(48),
    margin: hp(1),
    top: hp(1),
    flexShrink: 1,
  },
  subtitle: {
    fontSize: TextSize.Small,
    fontFamily: 'Poppins-Regular',
    marginHorizontal: hp(1),
    width: wp(48),
  },
  author: {
    fontSize: TextSize.Small,
    fontFamily: 'Poppins-Regular',
    marginHorizontal: hp(1),
    width: wp(48),
  },
  detailsContainer: {
    marginTop: 10,
  },
  buttonContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  buyButton: {
    width: '100%',
    marginVertical: 20,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buyButtonText: {
    fontSize: TextSize.Small,
    fontFamily: 'Poppins-Bold',
  },
  profileImage: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(10),
    marginRight: wp(3),
  },
  requesterDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  requestersContainer: {
    marginTop: 20,
  },
  requestersTitle: {
    fontSize: TextSize.Medium,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 10,
  },
  requesterItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  requesterText: {
    fontSize: TextSize.Small,
    fontFamily: 'Poppins-SemiBold',
    width: wp(74),
  },
  requesterTime: {
    fontSize: TextSize.Tiny,
    fontFamily: 'Poppins-Regular',
  },
});
