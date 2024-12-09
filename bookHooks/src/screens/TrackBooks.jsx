import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  ScrollView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import axios from 'axios';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ThemeContext} from '../context/ThemeContext';
import TextSize from '../TextScaling';
import {ipv4} from '../assets/others/constants';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {format} from 'date-fns';

const TrackBooks = () => {
  const [userData, setUserData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const {theme} = React.useContext(ThemeContext);
  const navigation = useNavigation();

  // Fetch books from the API
  const fetchTrackBooks = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${ipv4}/get-trackbooks`, {
        headers: {
          Authorization: `Bearer ${token}`, // Replace with actual token
        },
      });

      if (response.status === 200) {
        setUserData(response.data.data);
      } else {
        console.log('Error:', response.data.data);
      }
    } catch (error) {
      console.error('Error fetching track books:', error);
    } finally {
      setLoading(false);
    }
  };
  useFocusEffect(
    React.useCallback(() => {
      // This will be triggered when the screen comes into focus after going back
      fetchTrackBooks();
    }, []),
  );
  // Call the API when component mounts
  useEffect(() => {
    fetchTrackBooks();
  }, []);

  // Refresh the list
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTrackBooks();
    setRefreshing(false);
  };

  const formatDate = date => {
    return date ? date.toLocaleDateString() : '';
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        height: '100%',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.background,
      }}>
      {loading ? (
        <ActivityIndicator size="large" color={theme.accent2} />
      ) : userData && userData.length > 0 ? (
        <FlatList
          ListFooterComponent={
            <View
              style={{
                justifyContent: 'center',
                alignItems: 'center',
                width: wp(100),
              }}>
              <TouchableOpacity
                style={[styles.hookButton, {backgroundColor: theme.card}]}
                onPress={() => navigation.navigate('AddTrackBooks')}>
                <View style={styles.iconContainer}>
                  <Icon name="book" size={24} color={theme.text} />
                </View>
                <Text
                  style={{
                    color: theme.text,
                    fontSize: TextSize.Small,
                    fontFamily: 'Poppins-SemiBold',
                    textAlign: 'center',
                  }}>
                  Add a book to track your reading progress here!
                </Text>
              </TouchableOpacity>
            </View>
          }
          data={userData}
          keyExtractor={item => item._id} // Assuming each book has a unique _id
          renderItem={({item}) => (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('UpdateTrackBook', {book: item})
              }
              style={[styles.bookContainer, {backgroundColor: theme.card}]}>
              <View>
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
              </View>
              <View style={{width: '90%', marginLeft: '3%'}}>
                <Text
                  style={{
                    fontFamily: 'Poppins-SemiBold',
                    fontSize: TextSize.Small,
                    color: theme.text,
                    width: '68%',
                  }}>
                  {item.title}
                </Text>
                <Text
                  style={{
                    fontFamily: 'Poppins-Regular',
                    fontSize: TextSize.XSmall,
                    color: theme.text,
                    width: '68%',
                  }}>
                  {item.author}
                </Text>
                {item.startDate && (
                  <Text
                    style={{
                      fontFamily: 'Poppins-Regular',
                      fontSize: TextSize.Tiny,
                      color: theme.text,
                      width: '68%',
                    }}>
                    First started reading on{' '}
                    {format(new Date(item.startDate), 'MMMM dd, yyyy')}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          )}
          style={{backgroundColor: theme.background, width: wp(100)}}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      ) : (
        <View
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            width: wp(100),
          }}>
          <TouchableOpacity
            style={[styles.hookButton, {backgroundColor: theme.card}]}
            onPress={() => navigation.navigate('AddTrackBooks')}>
            <View style={styles.iconContainer}>
              <Icon name="book" size={24} color={theme.text} />
            </View>
            <Text
              style={{
                color: theme.text,
                fontSize: TextSize.Small,
                fontFamily: 'Poppins-SemiBold',
                textAlign: 'center',
              }}>
              Add a book to track your reading progress here!
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Button to navigate to the "AddTrackBooks" screen */}
    </SafeAreaView>
  );
};

export default TrackBooks;

const styles = StyleSheet.create({
  hookButton: {
    width: wp('80%'),
    marginTop: '5%',
    height: hp('20%'),
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    padding: 4,
    borderRadius: 10,
    marginBottom: 20,
  },
  iconContainer: {
    marginBottom: 10,
  },
  bookContainer: {
    padding: 15,
    flexDirection: 'row',
    marginVertical: hp(2),
    width: '90%',
    borderRadius: 10,
    marginHorizontal: wp(5),
    elevation: 5,
  },
  bookImage: {
    width: wp('32%'),
    height: hp('24%'),
    borderRadius: 5,
  },
});
