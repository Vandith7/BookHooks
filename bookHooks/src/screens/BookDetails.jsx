import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Linking,
  ScrollView,
  Modal,
} from 'react-native';
import ImageViewing from 'react-native-image-viewing';
import axios from 'axios';
import {ipv4} from '../assets/others/constants';
import {ThemeContext} from '../context/ThemeContext';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import TextSize from '../TextScaling';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Snackbar from 'react-native-snackbar';
import {useNavigation} from '@react-navigation/native';

const BookDetails = ({route}) => {
  const {book, currentUserId} = route.params;
  const {theme} = React.useContext(ThemeContext);
  const [googleBookData, setGoogleBookData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [isImageViewerVisible, setIsImageViewerVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isRequestPending, setIsRequestPending] = useState(false);
  const [reqLoading, setReqLoading] = useState(false);

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

  const handleBuyEbook = () => {
    const buyLink =
      googleBookData?.saleInfo?.buyLink || googleBookData?.infoLink;
    if (buyLink) {
      Linking.openURL(buyLink);
    } else {
      alert('Sorry, no eBook link is available.');
    }
  };

  const checkRequestStatus = async () => {
    try {
      const response = await axios.get(`${ipv4}/request-status`, {
        params: {
          bookId: book._id,
          userId: currentUserId,
        },
      });

      if (response.data.isPending == true) {
        setIsRequestPending(true);
      } else {
        setIsRequestPending(false);
      }
    } catch (error) {
      console.error('Error checking request status:', error);
    }
  };

  const handleUnhookRequest = async () => {
    setReqLoading(true); // Show loader
    try {
      const response = await axios.post(`${ipv4}/unhook-request`, {
        bookId: book._id,
        requesterId: currentUserId,
        ownerId: book.owner,
      });

      if (response.status === 201) {
        Snackbar.show({
          text: `Unhook request sent!`,
          duration: Snackbar.LENGTH_LONG,
          backgroundColor: '#B08968',
          textColor: '#FFFFFF',
        });
        setReqLoading(false);
        navigation.reset({
          index: 0,
          routes: [{name: 'Home'}],
        });
      } else {
        setReqLoading(false);
        Snackbar.show({
          text: `Something went wrong please try again`,
          duration: Snackbar.LENGTH_LONG,
          backgroundColor: '#B08968',
          textColor: '#FFFFFF',
        });
      }
    } catch (error) {
      setReqLoading(false);
      console.error('Error sending unhook request:', error);
      Snackbar.show({
        text: `Something went wrong please try again`,
        duration: Snackbar.LENGTH_LONG,
        backgroundColor: '#B08968',
        textColor: '#FFFFFF',
      });
    } finally {
      setReqLoading(false);
    }
  };

  useEffect(() => {
    const isbn = book.isbn13 ? book.isbn13 : book.isbn10;

    // Check if at least one ISBN is available before making the API call
    if (isbn) {
      fetchBookDetailsFromGoogle(isbn);
    } else {
      setLoading(false); // Stop loading if ISBN is not available
    }

    checkRequestStatus();
    fetchUserDetails(book.owner);
  }, [book]);

  const openImageViewer = index => {
    setSelectedImageIndex(index);
    setIsImageViewerVisible(true);
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={[styles.container, {backgroundColor: theme.background}]}>
      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} />
      ) : (
        <>
          <View style={[styles.titleContainer, {}]}>
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
          <View style={[styles.detailsContainer, {}]}>
            <Text style={[styles.hookedBy, {color: theme.text}]}>
              Hooked by: {userName}
            </Text>
            {googleBookData && (
              <>
                <Text style={[styles.isbn, {color: theme.text}]}>
                  <Text style={styles.detailLabel}>ISBN10: </Text>
                  {book.isbn10 || 'N/A'}
                </Text>
                <Text style={[styles.isbn, {color: theme.text}]}>
                  <Text style={styles.detailLabel}>ISBN13: </Text>
                  {book.isbn13 || 'N/A'}
                </Text>

                <Text style={[styles.detailText, {color: theme.text}]}>
                  <Text style={styles.detailLabel}>Published Date:</Text>{' '}
                  {googleBookData.publishedDate}
                </Text>
                <Text style={[styles.detailText, {color: theme.text}]}>
                  <Text style={styles.detailLabel}>Page Count:</Text>{' '}
                  {googleBookData.pageCount}
                </Text>
                <Text style={[styles.detailText, {color: theme.text}]}>
                  <Text style={styles.detailLabel}>Categories:</Text>{' '}
                  {googleBookData.categories}
                </Text>
                <Text style={[styles.detailText, {color: theme.text}]}>
                  <Text style={styles.detailLabel}>Language:</Text>{' '}
                  {googleBookData.language}
                </Text>
              </>
            )}
            <Text style={[styles.detailText, {color: theme.text}]}>
              <Text style={styles.detailLabel}>Description:</Text>{' '}
              {book.description
                ? book.description
                : googleBookData.description || 'N/A'}
            </Text>
            {book.isFetchedFromGoogle == 'true' && (
              <Text style={[styles.detailLabel, {color: theme.text}]}>
                The details for this book was sourced from Google.
              </Text>
            )}

            <View
              style={[
                styles.buttonContainer,
                googleBookData ? {} : {justifyContent: 'center'},
              ]}>
              <TouchableOpacity
                disabled={isRequestPending || reqLoading}
                style={[
                  styles.buyButton,
                  {
                    backgroundColor:
                      isRequestPending || loading
                        ? theme.accent2
                        : theme.primary,
                    width: googleBookData ? '48%' : '100%', // Set width based on the availability of eBook button
                  },
                ]}
                onPress={handleUnhookRequest}>
                {reqLoading ? (
                  <ActivityIndicator
                    size={TextSize.Large}
                    color={theme.secondary}
                  />
                ) : isRequestPending ? (
                  <Text style={[styles.buyButtonText, {color: theme.text}]}>
                    Request Pending
                  </Text>
                ) : (
                  <Text style={[styles.buyButtonText, {color: theme.text}]}>
                    Request Unhook
                  </Text>
                )}
              </TouchableOpacity>

              {googleBookData && (
                <TouchableOpacity
                  style={[
                    styles.buyButton,
                    {backgroundColor: theme.border, width: '48%'},
                  ]}
                  onPress={handleBuyEbook}>
                  <Text style={[styles.buyButtonText, {color: theme.text}]}>
                    Buy eBook{' '}
                    <Icon
                      name="open-in-new"
                      size={TextSize.Tiny}
                      color={theme.text}
                    />
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View
              style={[
                styles.imagesOuterContainer,
                {backgroundColor: theme.card},
              ]}>
              <Text style={[styles.imagesContainerText, {color: theme.text}]}>
                Photos of book by {userName}
              </Text>
              {book.images && book.images.length > 0 ? (
                <FlatList
                  data={book.images}
                  keyExtractor={(item, index) => `${item}-${index}`}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  renderItem={({item, index}) => (
                    <TouchableOpacity onPress={() => openImageViewer(index)}>
                      <Image
                        source={{uri: item}}
                        style={styles.additionalImage}
                        resizeMode="contain"
                      />
                    </TouchableOpacity>
                  )}
                  contentContainerStyle={styles.imagesContainer}
                />
              ) : (
                <Text
                  style={{
                    fontFamily: 'Poppins-SemiBold',
                    fontSize: TextSize.Tiny,
                    color: theme.text,
                    paddingBottom: '4%',
                  }}>
                  No photos provided
                </Text>
              )}
            </View>
          </View>
        </>
      )}

      <ImageViewing
        images={book.images.map(img => ({uri: img}))}
        imageIndex={selectedImageIndex}
        visible={isImageViewerVisible}
        onRequestClose={() => setIsImageViewerVisible(false)}
      />
    </ScrollView>
  );
};

export default BookDetails;

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
  hookedBy: {
    fontSize: TextSize.Small,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 10,
  },
  isbn: {
    fontSize: TextSize.Tiny,
    marginBottom: 5,
  },
  detailText: {
    fontSize: TextSize.Tiny,
    fontFamily: 'Poppins-Regular',
    marginBottom: 5,
  },
  detailLabel: {
    fontFamily: 'Poppins-SemiBold',
  },
  description: {
    fontSize: TextSize.Tiny,
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
    fontSize: TextSize.Tiny,
    fontFamily: 'Poppins-Bold',
  },
  imagesOuterContainer: {
    borderRadius: hp(2),
    justifyContent: 'center',
    marginBottom: hp(10),
    paddingHorizontal: wp(4),
  },
  imagesContainerText: {
    marginTop: hp(1),
    fontSize: TextSize.Tiny,
    fontFamily: 'Poppins-Regular',
  },
  imagesContainer: {
    marginBottom: 8,
  },
  additionalImage: {
    width: hp(10),
    height: wp(24),
    marginRight: 10,
    borderRadius: 10,
  },
});
