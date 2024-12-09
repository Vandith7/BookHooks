import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useContext, useEffect, useState} from 'react';
import {ThemeContext} from '../context/ThemeContext';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import TextSize from '../TextScaling';
import {Picker} from '@react-native-picker/picker'; // Updated import
import DateTimePicker from '@react-native-community/datetimepicker'; // Updated import
import {format, formatDate} from 'date-fns';
import Snackbar from 'react-native-snackbar';
import {useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {ipv4} from '../assets/others/constants';

const UpdateTrackBook = ({route}) => {
  const {book} = route.params;
  const {theme} = useContext(ThemeContext);
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState('');
  const [visibility, setVisibility] = useState('');
  const [bookStatus, setBookStatus] = useState('');
  const [dateCompleted, setDateCompleted] = useState(null);
  const [dateStarted, setDateStarted] = useState(null);
  const [showDateCompletedPicker, setShowDateCompletedPicker] = useState(false);
  const [showDateStartedPicker, setShowDateStartedPicker] = useState(false);
  const [bookLoading, setBookLoading] = useState(false);
  const [showReviewTextField, setShowReviewTextField] = useState(false);
  const [editedReview, setEditedReview] = useState('');
  const navigation = useNavigation();
  useEffect(() => {
    if (book.BookStatus) {
      setBookStatus(book.BookStatus);
    }
    if (book.visibility) {
      setVisibility(book.visibility);
    }
  }, [book.BookStatus, book.visibility]);
  const handleDateCompletedChange = (event, selectedDate) => {
    setShowDateCompletedPicker(false); // Close the picker

    if (event.type !== 'dismissed') {
      // Only update if the picker was not dismissed
      setDateCompleted(selectedDate);
    }
  };

  const handleDateStartedChange = (event, selectedDate) => {
    setShowDateStartedPicker(false); // Close the picker

    if (event.type !== 'dismissed') {
      // Only update if the picker was not dismissed
      setDateStarted(selectedDate);
    }
  };

  const formatDate = date => {
    return date ? date.toLocaleDateString() : '';
  };
  const handleSubmit = async () => {
    // Handle form submission here

    const bookData = {
      trackBookId: book._id,
      bookStatus: bookStatus,
      visibility: visibility,
      readCount:
        bookStatus === 'completed' ? (book.readCount || 0) + 1 : book.readCount,
    };

    // Add review only if editedReview is not an empty string
    if (editedReview !== '') {
      bookData.review = editedReview;
    }

    if (dateCompleted !== null) {
      bookData.dateCompleted = dateCompleted;
    }

    if (dateStarted !== null) {
      bookData.dateStarted = dateStarted;
    }

    if (bookStatus !== 'complete' && dateCompleted !== null) {
      Snackbar.show({
        text: `Can't change date completed of book with status ${bookStatus} !`,
        duration: Snackbar.LENGTH_LONG,
        backgroundColor: '#B08968',
        textColor: '#FFFFFF',
      });
      setDateCompleted(null);
      return;
    }
    try {
      // Get token from AsyncStorage
      const token = await AsyncStorage.getItem('token');
      setBookLoading(true);

      // Send the book data to the backend
      await axios.post(`${ipv4}/update-trackbook-status`, bookData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // If the request is successful, show a success snackbar
      Snackbar.show({
        text: 'Book updated successfully!',
        duration: Snackbar.LENGTH_LONG,
        backgroundColor: '#B08968',
        textColor: '#FFFFFF',
      });

      setBookLoading(false); // Stop loading after success

      // Reset navigation to the Home page
      navigation.goBack();
    } catch (error) {
      console.error('Add book error:', error);
      setBookLoading(false);
      Snackbar.show({
        text: 'Error updating book',
        duration: Snackbar.LENGTH_LONG,
        backgroundColor: '#B08968',
        textColor: '#FFFFFF',
      });
    }
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
                  {
                    color: theme.text,
                    fontFamily: 'Poppins-SemiBold',
                    fontSize: TextSize.Medium,
                  },
                ]}>
                {book.title}
              </Text>

              <Text
                style={[
                  styles.author,
                  {color: theme.text, fontSize: TextSize.Small},
                ]}>
                by {book.author}
              </Text>
            </View>
          </View>
          <View style={[styles.detailsContainer, {}]}>
            <>
              <Text
                style={[
                  styles.isbn,
                  {color: theme.text, fontSize: TextSize.Tiny},
                ]}>
                <Text style={styles.detailLabel}>ISBN10: </Text>
                {book.isbn10 || 'N/A'}
              </Text>
              <Text
                style={[
                  styles.isbn,
                  {color: theme.text, fontSize: TextSize.Tiny},
                ]}>
                <Text style={styles.detailLabel}>ISBN13: </Text>
                {book.isbn13 || 'N/A'}
              </Text>
              <Text
                style={[
                  styles.detailText,
                  {color: theme.text, fontSize: TextSize.Tiny},
                ]}>
                <Text style={styles.detailLabel}>Categories:</Text>{' '}
                {book.categories || 'N/A'}
              </Text>
              <Text
                style={[
                  styles.detailText,
                  {color: theme.text, fontSize: TextSize.Tiny},
                ]}>
                <Text style={styles.detailLabel}>Source:</Text>{' '}
                {book.source || 'N/A'}
              </Text>
            </>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                flexWrap: 'wrap', // Allows the text and button to wrap
              }}>
              <Text
                style={[
                  styles.detailText,
                  {color: theme.text, fontSize: TextSize.Tiny},
                ]}>
                <Text style={styles.detailLabel}>Started reading:</Text>{' '}
                {dateStarted
                  ? format(new Date(dateStarted), 'MMMM dd, yyyy')
                  : book.startDate
                  ? format(new Date(book.startDate), 'MMMM dd, yyyy')
                  : 'N/A'}
              </Text>

              <TouchableOpacity
                style={{marginLeft: '4%'}}
                onPress={() =>
                  setShowDateStartedPicker(prevState => !prevState)
                }>
                <Icon
                  name="edit-note"
                  size={TextSize.Small}
                  color={theme.text}
                />
              </TouchableOpacity>
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                flexWrap: 'wrap', // Allows the text and button to wrap
              }}>
              <Text
                style={[
                  styles.detailText,
                  {color: theme.text, fontSize: TextSize.Tiny},
                ]}>
                <Text style={styles.detailLabel}>Completed reading:</Text>{' '}
                {dateCompleted
                  ? format(new Date(dateCompleted), 'MMMM dd, yyyy')
                  : 'Not completed'}
              </Text>
              <TouchableOpacity
                style={{marginLeft: '4%'}}
                onPress={() =>
                  setShowDateCompletedPicker(prevState => !prevState)
                }>
                <Icon
                  name="edit-note"
                  size={TextSize.Small}
                  color={theme.text}
                />
              </TouchableOpacity>
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                flexWrap: 'wrap', // Allows the text and button to wrap
              }}>
              <Text
                style={[
                  {
                    color: theme.text,
                    fontSize: TextSize.Tiny,
                    fontFamily: 'Poppins-Regular',
                    maxWidth: '90%', // Limit text width to make space for the button
                  },
                ]}>
                <Text style={styles.detailLabel}>Your review:</Text>{' '}
                {book.review || 'N/A'}
              </Text>
              <TouchableOpacity
                style={{marginLeft: '4%'}}
                onPress={() => setShowReviewTextField(prevState => !prevState)}>
                <Icon
                  name="edit-note"
                  size={TextSize.Small}
                  color={theme.text}
                />
              </TouchableOpacity>
            </View>
            {showReviewTextField && (
              <View
                style={[
                  styles.inputContainer,
                  {backgroundColor: theme.secondary, marginBottom: '5%'},
                ]}>
                <TextInput
                  style={[
                    styles.input,
                    {backgroundColor: theme.inputBg, color: theme.text},
                  ]}
                  placeholder="Post a new review"
                  value={editedReview}
                  onChangeText={setEditedReview}
                  multiline={true} // Allows multi-line input
                  numberOfLines={4} // Limits the initial number of lines
                  maxHeight={100} // Adjust this value as needed
                />
              </View>
            )}

            {book.readCount > 0 && (
              <Text
                style={[
                  styles.detailText,
                  {
                    color: theme.text,
                    fontSize: TextSize.Tiny,
                    marginTop: hp(1),
                  },
                ]}>
                <Text style={styles.detailLabel}>Times Read:</Text>{' '}
                {book.readCount}
              </Text>
            )}
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: theme.secondary,
                  marginBottom: '5%',
                  flexDirection: 'row',
                  alignItems: 'center',
                },
              ]}>
              <Text
                style={{
                  color: theme.text,
                  fontFamily: 'Poppins-Regular',
                  flex: 1, // This ensures the label and picker are aligned properly
                }}>
                Visibility
              </Text>
              <Picker
                selectedValue={visibility}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.inputBg,
                    color: theme.text,
                    fontFamily: 'Poppins-Regular',
                    flex: 2, // Adjusting the flex to ensure the picker takes enough space
                  },
                ]}
                onValueChange={itemValue => setVisibility(itemValue)}>
                <Picker.Item label="Public" value="public" />
                <Picker.Item label="Private" value="private" />
              </Picker>
            </View>
            <View
              style={[
                styles.inputContainer,
                {
                  backgroundColor: theme.secondary,
                  marginBottom: '5%',
                  flexDirection: 'row',
                  alignItems: 'center',
                },
              ]}>
              <Text
                style={{
                  color: theme.text,
                  fontFamily: 'Poppins-Regular',
                  flex: 1, // This ensures the label and picker are aligned properly
                }}>
                Status
              </Text>
              <Picker
                selectedValue={bookStatus}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.inputBg,
                    color: theme.text,
                    fontFamily: 'Poppins-Regular',
                    flex: 2, // Adjusting the flex to ensure the picker takes enough space
                  },
                ]}
                onValueChange={itemValue => setBookStatus(itemValue)}>
                {book.BookStatus != 'completed' && (
                  <Picker.Item label="Reading" value="reading" />
                )}
                {book.BookStatus != 'completed' && (
                  <Picker.Item label="To Read" value="to read" />
                )}
                {book.BookStatus != 'completed' && (
                  <Picker.Item label="Dropped" value="dropped" />
                )}
                {book.BookStatus != 'completed' && (
                  <Picker.Item label="On Hold" value="on hold" />
                )}
                {book.BookStatus != 'completed' && (
                  <Picker.Item label="Wishlisted" value="wishlisted" />
                )}
                {book.BookStatus != 'reading' && (
                  <Picker.Item label="Reading Again" value="reading again" />
                )}

                <Picker.Item label="Completed" value="completed" />
              </Picker>
            </View>

            {dateCompleted && bookStatus === 'completed' ? (
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: theme.secondary,
                    marginBottom: '5%',
                    paddingVertical: hp(1),
                  },
                ]}>
                <View
                  style={{
                    width: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Text
                    style={{
                      fontSize: TextSize.Tiny,
                      fontFamily: 'Poppins-SemiBold',
                      color: theme.text,
                    }}
                    onPress={() => setShowDateCompletedPicker(true)}>
                    Completed date: {formatDate(dateCompleted)}
                  </Text>
                  <Text
                    style={{
                      fontSize: TextSize.Tiny,
                      fontFamily: 'Poppins-SemiBold',
                      color: theme.text,
                    }}
                    onPress={() => setShowDateCompletedPicker(true)}>
                    Tap to change
                  </Text>
                </View>
              </View>
            ) : bookStatus === 'completed' &&
              book.BookStatus !== 'completed' ? (
              <TouchableOpacity
                style={[
                  styles.button,
                  {backgroundColor: theme.primary, elevation: 4},
                ]}
                onPress={() => setShowDateCompletedPicker(true)}>
                <Text
                  style={[
                    {
                      fontSize: TextSize.Small,
                      color: theme.text,
                      fontFamily: 'Poppins-Bold',
                    },
                  ]}>
                  Select Completed Date
                </Text>
              </TouchableOpacity>
            ) : null}
            {showDateStartedPicker && (
              <DateTimePicker
                value={dateStarted || new Date()}
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={handleDateStartedChange}
              />
            )}
            {showDateCompletedPicker && (
              <DateTimePicker
                value={dateCompleted || new Date()}
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={handleDateCompletedChange}
              />
            )}
            {bookStatus !== book.BookStatus ||
            visibility !== book.visibility ||
            (dateStarted !== book.startDate && dateStarted !== null) ||
            (dateCompleted !== book.dateCompleted && dateCompleted !== null) ||
            editedReview !== review ? (
              <TouchableOpacity
                style={[
                  styles.button,
                  {backgroundColor: theme.primary, elevation: 4},
                ]}
                onPress={handleSubmit}>
                <Text
                  style={[
                    {
                      fontSize: TextSize.Small,
                      color: theme.text,
                      fontFamily: 'Poppins-Bold',
                    },
                  ]}>
                  Update Book
                </Text>
              </TouchableOpacity>
            ) : (
              <></>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
};

export default UpdateTrackBook;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  bookImage: {
    width: 100,
    height: 150,
    marginRight: 20,
  },
  title: {
    // fontSize: TextSize.Medium,
    height: 'auto',
    width: wp(48),
    margin: hp(1),
    top: hp(1),
    flexShrink: 1,
  },
  subtitle: {
    // fontSize: TextSize.Small,
    fontFamily: 'Poppins-Regular',
    marginHorizontal: hp(1),
    width: wp(48),
  },
  author: {
    // fontSize: TextSize.Small,
    fontFamily: 'Poppins-Regular',
    marginHorizontal: hp(1),
    width: wp(48),
  },
  detailsContainer: {
    marginTop: 10,
  },
  hookedBy: {
    // fontSize: TextSize.Medium,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 10,
  },
  isbn: {
    // fontSize: TextSize.Small,
    marginBottom: 5,
  },
  detailText: {
    // fontSize: TextSize.Small,
    fontFamily: 'Poppins-Regular',
    marginBottom: 5,
  },
  detailLabel: {
    fontFamily: 'Poppins-SemiBold',
  },
  description: {
    // fontSize: TextSize.Small,
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
    // fontSize: TextSize.Small,
    fontFamily: 'Poppins-Bold',
  },
  button: {
    padding: 15,
    marginBottom: hp(2),
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagesOuterContainer: {
    borderRadius: hp(2),
    justifyContent: 'center',
    marginBottom: hp(10),
    paddingHorizontal: wp(4),
  },
  imagesContainerText: {
    marginTop: hp(1),
    // fontSize: TextSize.Small,
    fontFamily: 'Poppins-Regular',
  },
  imagesContainer: {
    marginBottom: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 10,
    borderRadius: 5,
    fontFamily: 'Poppins-Regular',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginVertical: 5,
  },
});
