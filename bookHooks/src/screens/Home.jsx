import React, {useEffect, useMemo, useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  ScrollView,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  PermissionsAndroid,
  Platform,
  RefreshControl,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ThemeContext} from '../context/ThemeContext';
import TextSize from '../TextScaling';
import {ipv4} from '../assets/others/constants';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import IoniconsIcon from 'react-native-vector-icons/Ionicons';
import Fuse from 'fuse.js';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import Geolocation from 'react-native-geolocation-service';
import Snackbar from 'react-native-snackbar';

const Home = ({navigation}) => {
  const [userData, setUserData] = useState(null);
  const [otherUserBooks, setOtherUserBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [location, setLocation] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const {theme} = React.useContext(ThemeContext);
  const currentUserId = userData ? userData._id : null;

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const toRadians = degree => (degree * Math.PI) / 180;

    const R = 6371; // Radius of the earth in km
    const dLat = toRadians(lat2 - lat1); // Difference in latitude
    const dLon = toRadians(lon2 - lon1); // Difference in longitude
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km

    return distance.toFixed(2); // Return distance with 2 decimal places
  };

  const getUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');

      // If no token is found, show session expired message and navigate to login
      if (!token) {
        showSessionExpiredMessage();
        navigateToLogin();
        return;
      }

      // Make the API request with the token in the Authorization header
      const response = await axios.post(
        `${ipv4}/user-data`,
        {}, // Empty body, assuming the endpoint does not need a payload
        {
          headers: {Authorization: `Bearer ${token}`},
        },
      );

      // If the response is successful, set the user data
      setUserData(response.data.data);
    } catch (error) {
      console.error('Error fetching user data:', error);

      // Handle specific errors based on the response status or error message
      if (error.response?.status === 401) {
        // Token has expired or is invalid
        if (error.response?.data?.error === 'TokenExpiredError') {
          showSessionExpiredMessage();
        } else {
          // For other 401 errors
          Snackbar.show({
            text: 'Your session has expired. Please log in again.',
            duration: Snackbar.LENGTH_LONG,
            backgroundColor: '#B08968',
            textColor: '#FFFFFF',
          });
        }
      } else {
        // Handle any other errors (e.g., network issues, server errors)
        Snackbar.show({
          text: 'An error occurred while fetching user data. Please try again.',
          duration: Snackbar.LENGTH_LONG,
          backgroundColor: '#B08968',
          textColor: '#FFFFFF',
        });
      }

      // Navigate to login screen after showing an error
      navigateToLogin();
    }
  };

  // Helper function for showing session-expired messages
  const showSessionExpiredMessage = () => {
    Snackbar.show({
      text: 'Your session has expired. Please log in again!',
      duration: Snackbar.LENGTH_LONG,
      backgroundColor: '#B08968',
      textColor: '#FFFFFF',
    });
  };

  const navigateToLogin = () => {
    navigation.navigate('Login');
    navigation.reset({
      index: 0,
      routes: [{name: 'Login'}],
    });
  };

  const getOtherUserBooks = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const response = await axios.post(
          `${ipv4}/hooked-books`,
          {}, // Empty body, assuming the endpoint does not need a payload
          {
            headers: {Authorization: `Bearer ${token}`},
          },
        );
        setOtherUserBooks(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching other user books:', error);
    } finally {
      setLoading(false);
    }
  };

  const determineGreeting = () => {
    const currentHour = new Date().getHours();
    if (currentHour >= 5 && currentHour < 12) {
      setGreeting('Good Morning');
    } else if (currentHour >= 12 && currentHour < 18) {
      setGreeting('Good Afternoon');
    } else if (currentHour >= 18 && currentHour < 22) {
      setGreeting('Good Evening');
    } else {
      setGreeting('Good Night');
    }
  };

  // Fuse.js configuration for fuzzy search
  const fuseOptions = {
    keys: ['title', 'author'], // Specify fields to search
    includeScore: true, // Include score to sort by relevance
    threshold: 0.4, // Controls the fuzziness of the search (lower is stricter)
  };

  // Get unique categories from books
  const categories = [
    'All',
    ...new Set(
      otherUserBooks.flatMap(book => {
        return book.categories || [];
      }),
    ),
  ];

  // Initialize Fuse.js with book data when otherUserBooks is populated
  const fuse = new Fuse(otherUserBooks, fuseOptions);
  const filteredBooks = searchQuery
    ? fuse.search(searchQuery).map(result => result.item) // Extract the original items from the Fuse results
    : otherUserBooks; // If no search query, show all books

  // Filter books by selected category
  const displayedBooks =
    selectedCategory === 'All'
      ? filteredBooks
      : filteredBooks.filter(
          book => book.categories && book.categories.includes(selectedCategory),
        );
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Access',
          message: 'This app needs access to your location',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true; // iOS permission handled automatically in the app settings
  };

  const getCurrentLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (hasPermission) {
      Geolocation.getCurrentPosition(
        position => {
          const {latitude, longitude} = position.coords;
          setLocation({latitude, longitude});
        },
        error => {
          console.error('Error fetching location:', error);
        },
        {enableHighAccuracy: true, timeout: 25000, maximumAge: 10000},
      );
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await getUserData();
    await getOtherUserBooks();
    setRefreshing(false);
  };

  useEffect(() => {
    getUserData();
    getOtherUserBooks();
    determineGreeting();
    getCurrentLocation();
  }, []);
  const renderBookItem = useMemo(() => {
    return ({item}) => {
      // Check if book has latitude and longitude
      const hasCoordinates = item.latitude && item.longitude;

      // Calculate distance if coordinates are available
      const distance =
        location && hasCoordinates
          ? calculateDistance(
              location.latitude,
              location.longitude,
              item.latitude,
              item.longitude,
            )
          : 'N/A'; // If no coordinates or user location, show 'N/A'

      return (
        <TouchableOpacity
          style={[styles.bookItem, {backgroundColor: theme.card}]}
          onPress={() =>
            navigation.navigate('BookDetails', {
              book: item,
              currentUserId,
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
            numberOfLines={1} // Limit the title to 4 lines
            ellipsizeMode="tail" // Add "..." at the end if the text overflows
            style={{
              color: theme.text,
              fontSize: TextSize.Small,
              fontFamily: 'Poppins-SemiBold',
              textAlign: 'center',
              marginTop: 10,
            }}>
            {item.title}
          </Text>

          <Text
            numberOfLines={1} // Limit the title to 4 lines
            ellipsizeMode="tail" // Add "..." at the end if the text overflows
            style={{
              color: theme.text,
              fontSize: TextSize.Tiny,
              fontFamily: 'Poppins-SemiBold',
              textAlign: 'center',
            }}>
            by {item.author}
          </Text>

          {/* Display distance or fallback message */}
          <Text
            style={{
              color: theme.text,
              fontSize: TextSize.Tiny,
              fontFamily: 'Poppins-Regular',
              textAlign: 'center',
            }}>
            {hasCoordinates && distance !== 'N/A'
              ? `~ ${distance} km away`
              : ''}
          </Text>
          <Text
            style={{
              color: theme.text,
              fontSize: TextSize.Tiny,
              fontFamily: 'Poppins-SemiBold',
              textAlign: 'center',
            }}>
            {item.requestCount
              ? ` ${item.requestCount} ${
                  item.requestCount === 1 ? 'person has' : 'people have'
                } requested this book`
              : ''}
          </Text>
        </TouchableOpacity>
      );
    };
  }, [location, theme.text]);

  return (
    <SafeAreaView
      style={{
        flex: 1,
        height: '100%',
        width: '100%',
        backgroundColor: theme.background,
      }}>
      {loading ? (
        <ActivityIndicator size="large" color={theme.accent2} />
      ) : userData ? (
        <ScrollView
          style={{backgroundColor: theme.background}}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              width: wp(100),
            }}>
            <View style={{paddingLeft: '2%'}}>
              <Text
                style={[
                  {
                    color: theme.text,
                    fontSize: TextSize.H6,
                  },
                  styles.greetingText,
                ]}>
                {greeting}!
              </Text>
              <Text
                style={{
                  fontSize: TextSize.H6,
                  color: theme.text,
                  fontFamily: 'Poppins-SemiBold',
                  width: wp(80),
                }}>
                {userData.firstName}
              </Text>
            </View>
            <View
              style={{
                justifyContent: 'center',
                alignItems: 'center',
                width: wp(20),
              }}>
              <TouchableOpacity
                style={styles.chatButton}
                onPress={() =>
                  navigation.navigate('ChatsListScreen', {
                    currentUserId,
                  })
                }>
                <IoniconsIcon
                  name="chatbubbles"
                  size={TextSize.Large}
                  color={theme.text}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Box */}
          <View style={styles.searchContainer}>
            <TextInput
              style={[
                styles.searchInput,
                {
                  backgroundColor: theme.card,
                  color: theme.text,
                  fontFamily: 'Poppins-SemiBold',
                },
              ]}
              placeholder="Search books or authors..."
              placeholderTextColor={theme.text}
              value={searchQuery}
              onChangeText={text => {
                setSearchQuery(text);
              }}
            />
            <MaterialIcon
              name="search"
              size={24}
              color={theme.text}
              style={styles.searchIcon}
            />
          </View>

          {/* Category Bar */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryContainer}>
            {categories.map(category => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryItem,
                  selectedCategory === category && {
                    backgroundColor: theme.accent2,
                  },
                ]}
                onPress={() => setSelectedCategory(category)}>
                <Text
                  style={{
                    color: selectedCategory === category ? '#fff' : theme.text,
                    fontFamily: 'Poppins-SemiBold',
                  }}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={{padding: '2%'}}>
            <Text
              style={{
                fontSize: TextSize.H5,
                color: theme.text,
                fontFamily: 'Poppins-SemiBold',
                paddingBottom: '2%',
              }}>
              Find books to unhook
            </Text>

            {displayedBooks.length > 0 ? (
              <FlatList
                data={displayedBooks}
                showsVerticalScrollIndicator={false}
                numColumns={2}
                keyExtractor={item => item._id.toString()}
                renderItem={renderBookItem}
              />
            ) : (
              <Text style={{color: theme.text}}>
                No books found matching your search.
              </Text>
            )}
          </View>
        </ScrollView>
      ) : (
        <Text style={styles.text}>No user data found.</Text>
      )}
    </SafeAreaView>
  );
};

export default Home;

const styles = StyleSheet.create({
  greetingText: {
    fontFamily: 'Poppins-SemiBold',
    paddingTop: '2%',
  },
  bookItem: {
    padding: 10,
    borderRadius: 10,
    elevation: 5,
    alignItems: 'center',
    marginBottom: 20,
    width: '45%',
    margin: '2.5%',
  },
  bookImage: {
    width: '100%',
    height: 150,
    borderRadius: 5,
  },
  chatButton: {
    borderRadius: 20,
    padding: wp(2),
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: '2%',
    marginHorizontal: '2%',
    width: wp('98%'),
  },
  searchInput: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  searchIcon: {
    position: 'absolute',
    right: wp(4),
  },
  categoryContainer: {
    flexDirection: 'row',
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('2%'),
  },
  categoryItem: {
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
    backgroundColor: 'transparent',
  },
});
