import React, {useState, useContext, useCallback} from 'react';
import {
  StyleSheet,
  ScrollView,
  Text,
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
} from 'react-native';
import {ThemeContext} from '../context/ThemeContext';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import TextSize from '../TextScaling';
import Snackbar from 'react-native-snackbar';
import ImagePicker from 'react-native-image-crop-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';
import {ipv4} from '../assets/others/constants';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import GetLocation from '../components/GetLocation';

const Hook = () => {
  const {theme} = useContext(ThemeContext);
  const navigation = useNavigation();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [isbn10, setIsbn10] = useState('');
  const [isbn13, setIsbn13] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hookLoading, setHookLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState('');
  const [bookCondition, setBookCondition] = useState('');
  const [inputColor, setInputColor] = useState(theme.inputBg);
  const [isFetchedFromGoogle, setIsFetchedFromGoogle] = useState(false); // New state
  const [bookThumbnail, setBookThumbnail] = useState('');
  const [images, setImages] = useState([]);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };
  const handleLocationUpdate = location => {
    setLatitude(location.latitude);
    setLongitude(location.longitude);
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
    setDescription(volumeInfo.description || '');
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
    setInputColor(theme.selectedInputBg);
    setIsFetchedFromGoogle(true);

    Snackbar.show({
      text: 'Book data loaded from google!',
      duration: Snackbar.LENGTH_LONG,
      backgroundColor: '#B08968',
      textColor: '#FFFFFF',
    });
  };

  const handleClearSelectedBook = () => {
    setTitle('');
    setAuthor('');
    setDescription('');
    setCategories('');
    setSelectedBook(null);
    setInputColor(theme.inputBg);
    setIsFetchedFromGoogle(false);
  };
  const handleClearSearchResults = () => {
    setSearchResults([]);
    setError('');
    setLoading(false);
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

  const handleSelectImages = () => {
    if (images.length >= 4) {
      Snackbar.show({
        text: 'You can only select up to 4 images.',
        duration: Snackbar.LENGTH_LONG,
        backgroundColor: '#B08968',
        textColor: '#FFFFFF',
      });
      return;
    }

    ImagePicker.openPicker({
      multiple: true,
      mediaType: 'photo',
      compressImageMaxWidth: 800,
      compressImageMaxHeight: 800,
      compressImageQuality: 0.7,
      includeBase64: true,
    })
      .then(selectedImages => {
        if (images.length + selectedImages.length > 4) {
          Snackbar.show({
            text: 'You can only add up to 4 images.',
            duration: Snackbar.LENGTH_LONG,
            backgroundColor: '#B08968',
            textColor: '#FFFFFF',
          });
          return;
        }

        const formattedImages = selectedImages.map(image => ({
          uri: `data:${image.mime};base64,${image.data}`,
        }));
        setImages([...images, ...formattedImages]);
      })
      .catch(error => {
        console.log('Error selecting images:', error);
      });
  };

  // Function to remove an image from the list
  const handleRemoveImage = index => {
    const updatedImages = images.filter((_, imgIndex) => imgIndex !== index);
    setImages(updatedImages);
  };
  const handleSubmit = async () => {
    if (
      !title.trim() ||
      !author.trim() ||
      !description.trim() ||
      !categories.trim() ||
      !bookCondition.trim()
    ) {
      Snackbar.show({
        text: 'Please enter all required details to continue',
        duration: Snackbar.LENGTH_LONG,
        backgroundColor: '#B08968',
        textColor: '#FFFFFF',
      });
      return;
    }
    if (!latitude && !longitude) {
      Snackbar.show({
        text: `To add the book's location, please tap the 'Get Location' button.`,
        duration: Snackbar.LENGTH_LONG,
        backgroundColor: '#B08968',
        textColor: '#FFFFFF',
      });
      return;
    }
    const formData = {
      title,
      author,
      description,
      condition: bookCondition,
      isFetchedFromGoogle,
      isbn10,
      isbn13,
      bookThumbnail,
      images,
      categories,
      latitude,
      longitude,
    };

    try {
      const token = await AsyncStorage.getItem('token');
      setHookLoading(true);
      console.log(formData);
      await axios.post(`${ipv4}/add-book`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      Snackbar.show({
        text: 'Book hooked successfully!',
        duration: Snackbar.LENGTH_LONG,
        backgroundColor: '#B08968',
        textColor: '#FFFFFF',
      });
      setHookLoading(false);
      navigation.reset({
        index: 0,
        routes: [{name: 'Home'}],
      });
    } catch (error) {
      console.error('Add book error:', error);
      setHookLoading(false);
      alert('Error adding book');
    }
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

  return (
    <KeyboardAvoidingView behavior="padding" style={{flex: 1}}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
                  fontSize: TextSize.Medium,
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
                  placeholder="Search for a book"
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
              {selectedBook && (
                <View
                  style={[
                    styles.detailsContainer,
                    {backgroundColor: theme.card},
                  ]}>
                  <Text style={[styles.detailText, {color: theme.text}]}>
                    <Text style={styles.detailLabel}>ID:</Text>{' '}
                    {selectedBook.id}
                  </Text>
                  <Text style={[styles.detailText, {color: theme.text}]}>
                    <Text style={styles.detailLabel}>Title:</Text>{' '}
                    {selectedBook.title}
                  </Text>
                  <Text style={[styles.detailText, {color: theme.text}]}>
                    <Text style={styles.detailLabel}>Author:</Text>{' '}
                    {selectedBook.author}
                  </Text>
                  <Text style={[styles.detailText, {color: theme.text}]}>
                    <Text style={styles.detailLabel}>Subtitle:</Text>{' '}
                    {selectedBook.subtitle}
                  </Text>
                  <Text style={[styles.detailText, {color: theme.text}]}>
                    <Text style={styles.detailLabel}>Published Date:</Text>{' '}
                    {selectedBook.publishedDate}
                  </Text>
                  <Text style={[styles.detailText, {color: theme.text}]}>
                    <Text style={styles.detailLabel}>Page Count:</Text>{' '}
                    {selectedBook.pageCount}
                  </Text>
                  <Text style={[styles.detailText, {color: theme.text}]}>
                    <Text style={styles.detailLabel}>Categories:</Text>{' '}
                    {selectedBook.categories}
                  </Text>
                  <Text style={[styles.detailText, {color: theme.text}]}>
                    <Text style={styles.detailLabel}>Average Rating:</Text>{' '}
                    {selectedBook.averageRating}
                  </Text>
                  <Text style={[styles.detailText, {color: theme.text}]}>
                    <Text style={styles.detailLabel}>Language:</Text>{' '}
                    {selectedBook.language}
                  </Text>
                  <Text style={[styles.detailText, {color: theme.text}]}>
                    <Text style={styles.detailLabel}>ISBN-13:</Text>{' '}
                    {selectedBook.isbn13}
                  </Text>
                  <Text style={[styles.detailText, {color: theme.text}]}>
                    <Text style={styles.detailLabel}>ISBN-10:</Text>{' '}
                    {selectedBook.isbn10}
                  </Text>
                </View>
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
                  placeholderTextColor={theme.text}
                  value={author}
                  onChangeText={text => handleInputChange(setAuthor, text)}
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
                  placeholder="Category"
                  placeholderTextColor={theme.text}
                  value={categories}
                  onChangeText={text => handleInputChange(setCategories, text)}
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
                    {
                      backgroundColor: theme.inputBg,
                      color: theme.text,
                    },
                  ]}
                  placeholder="Description"
                  placeholderTextColor={theme.text}
                  value={description}
                  onChangeText={text => handleInputChange(setDescription, text)}
                  multiline
                  numberOfLines={5}
                />
              </View>
              {isFetchedFromGoogle && (
                <Text
                  style={[
                    {
                      marginHorizontal: '2%',
                      marginBottom: '2%',
                    },
                    styles.detailText,
                  ]}>
                  Modifying the above book details will classify it as custom.
                </Text>
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
                  placeholder="Book condition"
                  placeholderTextColor={theme.text}
                  value={bookCondition}
                  onChangeText={setBookCondition}
                />
              </View>

              {images.length < 4 && (
                <TouchableOpacity
                  style={[
                    styles.selectImagesButton,
                    {backgroundColor: theme.primary},
                  ]}
                  onPress={handleSelectImages}>
                  <Text
                    style={{
                      color: theme.text,
                      fontFamily: 'Poppins-Bold',
                      fontSize: TextSize.Small,
                    }}>
                    Add images of your book
                  </Text>
                </TouchableOpacity>
              )}

              <View style={styles.imagesContainer}>
                {images.map((image, index) => (
                  <View key={index} style={styles.imageWrapper}>
                    <Image source={{uri: image.uri}} style={styles.image} />
                    <TouchableOpacity
                      style={[
                        styles.removeIcon,
                        {backgroundColor: theme.accent2},
                      ]}
                      onPress={() => handleRemoveImage(index)}>
                      <Icon name="close" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
              <GetLocation onLocationUpdate={handleLocationUpdate} />
              {hookLoading ? (
                <ActivityIndicator size="large" color={theme.accent2} />
              ) : (
                <TouchableOpacity
                  style={[
                    styles.hookButton,
                    {backgroundColor: theme.primary, elevation: 4},
                  ]}
                  onPress={handleSubmit}>
                  <Text
                    style={[
                      {
                        fontSize: TextSize.H6,
                        color: theme.text,
                        fontFamily: 'Poppins-Bold',
                      },
                    ]}>
                    Hook Book
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </TouchableWithoutFeedback>
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
  clearButton: {
    marginLeft: 10,
  },
  clearIcon: {
    width: 20,
    height: 20,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
    width: '100%',
  },
  resultsContainer: {
    width: '100%',
  },
  detailsContainer: {
    padding: 10,
    borderRadius: 5,
    width: '100%',
    marginVertical: 10,
  },
  detailText: {
    fontSize: 14,
    marginVertical: 2,
    fontFamily: 'Poppins-Regular',
  },
  detailLabel: {
    fontWeight: 'bold',
  },
  hookButton: {
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
  },
  selectImagesButton: {
    padding: 10,
    borderRadius: 8,
    marginVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: '4%',
  },
  imageWrapper: {
    position: 'relative',
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    margin: 5,
  },
  removeIcon: {
    position: 'absolute',
    top: 4,
    right: 4,
    borderRadius: 8,
    padding: 2,
  },
  bookImage: {
    width: wp('20%'),
    height: hp('14%'),
    borderRadius: 5,
    marginRight: wp(2),
  },
});

export default Hook;
