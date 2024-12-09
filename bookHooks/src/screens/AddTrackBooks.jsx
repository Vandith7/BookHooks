import React, {useContext, useState, useCallback} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Image,
} from 'react-native';
import {Picker} from '@react-native-picker/picker'; // Updated import
import DateTimePicker from '@react-native-community/datetimepicker'; // Updated import
import {SafeAreaView} from 'react-native-safe-area-context';
import {ThemeContext} from '../context/ThemeContext';
import TextSize from '../TextScaling';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import axios from 'axios';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Snackbar from 'react-native-snackbar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ipv4} from '../assets/others/constants';
import {useNavigation} from '@react-navigation/native';

const AddTrackBooks = () => {
  const {theme} = useContext(ThemeContext);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn10, setIsbn10] = useState('');
  const [isbn13, setIsbn13] = useState('');
  const [bookThumbnail, setBookThumbnail] = useState('');
  const [categories, setCategories] = useState('');
  const [bookStatus, setBookStatus] = useState('reading');
  const [source, setSource] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [review, setReview] = useState('');
  const [otherSource, setOtherSource] = '';
  const [startDate, setStartDate] = useState(null);
  const [dateCompleted, setDateCompleted] = useState(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showDateCompletedPicker, setShowDateCompletedPicker] = useState(false);
  const [inputColor, setInputColor] = useState(theme.inputBg);
  const [isFetchedFromGoogle, setIsFetchedFromGoogle] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookLoading, setBookLoading] = useState(false);
  const navigation = useNavigation();
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };
  const handleInputChange = (setter, value) => {
    setter(value);
    if (isFetchedFromGoogle) {
      setIsFetchedFromGoogle(false); // Set to false when the user edits any field
      Snackbar.show({
        text: 'Google Books data cleared. Custom details will now be used.',
        duration: Snackbar.LENGTH_LONG,
        backgroundColor: '#B08968',
        textColor: '#FFFFFF',
      });
    }
  };
  const debouncedHandleSearch = useCallback(
    debounce(async query => {
      if (query.length < 3) {
        setSearchResults([]);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const response = await axios.get(
          'https://www.googleapis.com/books/v1/volumes',
          {
            params: {
              q: query,
              key: process.env.GOOGLE_API_KEY,
            },
          },
        );
        setSearchResults(response.data.items || []);
      } catch (error) {
        if (error.response?.status === 429) {
          setError('Too many requests. Please try again later.');
        } else {
          setError('Error fetching book data. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    }, 1000),
    [],
  );

  const handleSelectBook = book => {
    const {volumeInfo, id} = book;

    const isbn13 =
      volumeInfo.industryIdentifiers?.find(
        identifier => identifier.type === 'ISBN_13',
      )?.identifier || 'N/A';
    const isbn10 =
      volumeInfo.industryIdentifiers?.find(
        identifier => identifier.type === 'ISBN_10',
      )?.identifier || 'N/A';
    const bookThumbnail =
      volumeInfo.imageLinks?.smallThumbnail ||
      volumeInfo.imageLinks?.thumbnail ||
      '';

    setTitle(volumeInfo.title || '');
    setAuthor(volumeInfo.authors?.[0] || '');
    const categories = volumeInfo.categories
      ? volumeInfo.categories.join(', ')
      : 'N/A';

    setCategories(categories);

    setSelectedBook({
      id: id || 'N/A',
      title: volumeInfo.title || '',
      author: volumeInfo.authors?.[0] || '',
      description: volumeInfo.description || '',
      subtitle: volumeInfo.subtitle || 'N/A',
      publishedDate: volumeInfo.publishedDate || 'N/A',
      pageCount: volumeInfo.pageCount || 'N/A',
      categories: volumeInfo.categories?.join(', ') || 'N/A',
      averageRating: volumeInfo.averageRating || 'N/A',
      language: volumeInfo.language || 'N/A',
      isbn13,
      isbn10,
      bookThumbnail,
    });
    setSearchResults([]);
    setIsbn10(isbn10);
    setIsbn13(isbn13);
    setBookThumbnail(bookThumbnail);

    Snackbar.show({
      text: 'Book data loaded from google!',
      duration: Snackbar.LENGTH_LONG,
      backgroundColor: '#B08968',
      textColor: '#FFFFFF',
    });
  };

  const renderItem = ({item}) => (
    <TouchableOpacity
      style={[styles.resultItem, {backgroundColor: theme.card}]}
      onPress={() => handleSelectBook(item)}>
      <>
        <Image
          source={
            item.volumeInfo &&
            item.volumeInfo.imageLinks &&
            item.volumeInfo.imageLinks.thumbnail
              ? {uri: item.volumeInfo.imageLinks.thumbnail}
              : require('../assets/images/book-stack.png')
          }
          resizeMode="contain"
          style={styles.bookImage}
        />

        <Text
          style={{
            color: theme.text,
            fontFamily: 'Poppins-Regular',
            fontSize: TextSize.Tiny + 2,
            height: 'auto',
            flexShrink: 1,
          }}>
          {item.volumeInfo.title}
        </Text>
      </>
    </TouchableOpacity>
  );

  const handleClearSelectedBook = () => {
    setTitle('');
    setAuthor('');
    setCategories('');
    setIsbn10('');
    setIsbn13('');
    setSelectedBook(null);
  };
  const handleClearSearchResults = () => {
    setSearchResults([]);
    setLoading(false);
  };
  const handleSubmit = async () => {
    // Handle form submission here
    if (!title.trim() || !author.trim()) {
      Snackbar.show({
        text: 'Please enter all required details to continue',
        duration: Snackbar.LENGTH_LONG,
        backgroundColor: '#B08968',
        textColor: '#FFFFFF',
      });
      return;
    }

    if (
      (bookStatus == 'reading' && startDate == null) ||
      (bookStatus == 'completed' && startDate == null)
    ) {
      Snackbar.show({
        text: 'Please select book start date to continue',
        duration: Snackbar.LENGTH_LONG,
        backgroundColor: '#B08968',
        textColor: '#FFFFFF',
      });
      return;
    }
    if (bookStatus == 'completed' && dateCompleted == null) {
      Snackbar.show({
        text: 'Please select book completed date to continue',
        duration: Snackbar.LENGTH_LONG,
        backgroundColor: '#B08968',
        textColor: '#FFFFFF',
      });
      return;
    }
    const bookData = {
      title,
      author,
      isbn10,
      isbn13,
      bookThumbnail,
      categories,
      bookStatus,
      startDate,
      dateCompleted,
      source,
      review,
      visibility,
    };

    try {
      // Get token from AsyncStorage
      const token = await AsyncStorage.getItem('token');
      setBookLoading(true);

      // Send the book data to the backend
      await axios.post(`${ipv4}/add-trackbook`, bookData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // If the request is successful, show a success snackbar
      Snackbar.show({
        text: 'Book added successfully!',
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
        text: 'Error adding book',
        duration: Snackbar.LENGTH_LONG,
        backgroundColor: '#B08968',
        textColor: '#FFFFFF',
      });
    }
  };

  // Handle start date change
  const handleDateChange = (event, selectedDate) => {
    setShowStartDatePicker(false); // Close the picker

    if (event.type !== 'dismissed') {
      // Only update if a date is selected
      setStartDate(selectedDate);
    }
  };

  // Handle completed date change
  // Handle completed date change
  const handleDateCompletedChange = (event, selectedDate) => {
    setShowDateCompletedPicker(false); // Close the picker

    if (event.type !== 'dismissed') {
      // Only update if the picker was not dismissed
      setDateCompleted(selectedDate);
    }
  };

  const formatDate = date => {
    return date ? date.toLocaleDateString() : '';
  };

  return (
    <KeyboardAvoidingView behavior="padding" style={{flex: 1}}>
      <SafeAreaView
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: theme.background,
        }}>
        <ScrollView
          keyboardShouldPersistTaps="always"
          contentContainerStyle={{
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <View
            style={[
              styles.container,
              {backgroundColor: theme.card, marginTop: '8%'},
            ]}>
            <Text
              style={{
                fontFamily: 'Poppins-SemiBold',
                fontSize: TextSize.Small,
                color: theme.text,
              }}>
              Fill details of book
            </Text>
            <Text
              style={{
                fontFamily: 'Poppins-SemiBold',
                fontSize: TextSize.Tiny,
                color: theme.text,
              }}>
              You have the flexibility to either incorporate your own custom
              details or make use of data sourced from Google, which we will
              retrieve on your behalf.
            </Text>
            <View
              style={[
                styles.inputContainer,
                {backgroundColor: theme.secondary},
              ]}>
              <TextInput
                style={[
                  styles.input,
                  {backgroundColor: inputColor, color: theme.text},
                ]}
                placeholder="Search for a book or enter title"
                placeholderTextColor={theme.text}
                value={title}
                onChangeText={text => {
                  handleInputChange(setTitle, text);
                  debouncedHandleSearch(text);
                }}
              />
              {isFetchedFromGoogle && (
                <Icon
                  name="cloud-done"
                  size={24}
                  color={theme.primary}
                  style={styles.fetchIcon}
                />
              )}
              {searchResults.length > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={handleClearSearchResults}>
                  <Icon
                    name="close"
                    size={20}
                    color={theme.text}
                    style={styles.clearIcon}
                  />
                </TouchableOpacity>
              )}
              {selectedBook && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={handleClearSelectedBook}>
                  <Icon
                    name="cancel"
                    size={20}
                    color={theme.text}
                    style={styles.clearIcon}
                  />
                </TouchableOpacity>
              )}
            </View>

            {loading && (
              <ActivityIndicator size="large" color={theme.primary} />
            )}
            {error ? (
              <Text style={[styles.errorText, {color: theme.highlight}]}>
                {error}
              </Text>
            ) : (
              <FlatList
                data={searchResults}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                style={styles.resultsContainer}
                ListHeaderComponent={<View style={{padding: 10}}></View>}
              />
            )}

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
                placeholder="Author"
                value={author}
                onChangeText={setAuthor}
              />
            </View>

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
                placeholder="ISBN-10"
                value={isbn10}
                onChangeText={setIsbn10}
              />
            </View>

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
                placeholder="ISBN-13"
                value={isbn13}
                onChangeText={setIsbn13}
              />
            </View>

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
                placeholder="Categories"
                value={categories}
                onChangeText={setCategories}
              />
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
                <Picker.Item label="Reading" value="reading" />
                <Picker.Item label="To Read" value="to read" />
                <Picker.Item label="Completed" value="completed" />
                <Picker.Item label="Dropped" value="dropped" />
                <Picker.Item label="On Hold" value="on hold" />
                <Picker.Item label="Wishlisted" value="wishlisted" />
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
                  flex: 1, // Ensuring the label is aligned with the picker
                }}>
                Source
              </Text>
              <Picker
                selectedValue={source}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.inputBg,
                    color: theme.text,
                    fontFamily: 'Poppins-Regular',
                    flex: 2, // Adjusting space for picker
                  },
                ]}
                onValueChange={itemValue => setSource(itemValue)}>
                <Picker.Item label="BookHooks" value="BookHooks" />
                <Picker.Item label="External" value="External" />
                <Picker.Item label="Library" value="Library" />
                <Picker.Item label="Bookstore" value="Bookstore" />
                <Picker.Item label="Gift" value="Gift" />
                <Picker.Item label="Borrowed" value="Borrowed" />
                <Picker.Item label="E-book" value="E-book" />
                <Picker.Item label="Audiobook" value="Audiobook" />
                <Picker.Item label="Other" value="Other" />
              </Picker>
            </View>

            {source == 'Other' && (
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
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.inputBg,
                      color: theme.text,
                      flex: 2,
                    },
                  ]}
                  placeholder="Enter another source here"
                  value={otherSource}
                  onChangeText={setOtherSource}
                />
              </View>
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
                {backgroundColor: theme.secondary, marginBottom: '5%'},
              ]}>
              <TextInput
                style={[
                  styles.input,
                  {backgroundColor: theme.inputBg, color: theme.text},
                ]}
                placeholder="Post a Review"
                value={review}
                onChangeText={setReview}
              />
            </View>
            {startDate ? (
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
                    onPress={() => setShowStartDatePicker(true)}>
                    {' '}
                    Start date : {formatDate(startDate)}
                  </Text>
                  <Text
                    style={{
                      fontSize: TextSize.Tiny,
                      fontFamily: 'Poppins-SemiBold',
                      color: theme.text,
                    }}
                    onPress={() => setShowStartDatePicker(true)}>
                    Tap to change
                  </Text>
                </View>
              </View>
            ) : bookStatus === 'reading' ||
              bookStatus === 'completed' ||
              bookStatus === 'dropped' ||
              bookStatus === 'on hold' ? (
              <TouchableOpacity
                style={[
                  styles.button,
                  {backgroundColor: theme.primary, elevation: 4},
                ]}
                onPress={() => setShowStartDatePicker(true)}>
                <Text
                  style={[
                    {
                      fontSize: TextSize.Small,
                      color: theme.text,
                      fontFamily: 'Poppins-Bold',
                    },
                  ]}>
                  Select Start Date
                </Text>
              </TouchableOpacity>
            ) : (
              <></>
            )}

            {showStartDatePicker && (
              <DateTimePicker
                value={startDate || new Date()}
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={handleDateChange}
              />
            )}

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
            ) : bookStatus === 'completed' ? (
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

            {showDateCompletedPicker && (
              <DateTimePicker
                value={dateCompleted || new Date()}
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={handleDateCompletedChange}
              />
            )}
            {bookLoading ? (
              <ActivityIndicator size="large" color={theme.accent2} />
            ) : (
              <TouchableOpacity
                style={[
                  styles.button,
                  {backgroundColor: theme.primary, elevation: 4},
                ]}
                onPress={handleSubmit}>
                <Text
                  style={[
                    {
                      fontSize: TextSize.Medium,
                      color: theme.text,
                      fontFamily: 'Poppins-Bold',
                    },
                  ]}>
                  Save Book
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '90%',
    borderRadius: 10,
    padding: 20,
    marginVertical: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginVertical: 5,
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 10,
    borderRadius: 5,
    fontFamily: 'Poppins-Regular',
  },
  button: {
    padding: 15,
    marginBottom: hp(2),
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
    width: '100%',
  },

  bookImage: {
    width: wp('20%'),
    height: hp('14%'),
    borderRadius: 5,
    marginRight: wp(2),
  },
});

export default AddTrackBooks;
