import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {ThemeContext} from '../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Snackbar from 'react-native-snackbar';
import {ipv4} from '../assets/others/constants';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import Icon from 'react-native-vector-icons/MaterialIcons';
import TextSize from '../TextScaling';

const BuddyConnections = ({route, navigation}) => {
  const user = route.params;
  const [buddyConnections, setBuddyConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQueryBuddies, setSearchQueryBuddies] = useState('');
  const {theme} = React.useContext(ThemeContext);

  const getBuddyConnections = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userId = user?.user?._id; // Assuming `user.user._id` contains the logged-in user's ID

      // Make the API request, including the userId as a query parameter
      const response = await axios.get(`${ipv4}/my-buddies?userId=${userId}`);

      // Set the buddies list with the data from the response
      setBuddyConnections(response.data.buddies);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user data:', error);
      Snackbar.show({
        text: 'An error occurred while fetching user data. Please try again.',
        duration: Snackbar.LENGTH_LONG,
        backgroundColor: '#B08968',
        textColor: '#FFFFFF',
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    getBuddyConnections();
  }, []);

  // Filter buddies based on the search query
  const filteredBuddies = buddyConnections.filter(
    buddy =>
      buddy.firstName
        .toLowerCase()
        .includes(searchQueryBuddies.toLowerCase()) ||
      buddy.userName.toLowerCase().includes(searchQueryBuddies.toLowerCase()),
  );
  return (
    <View style={[styles.container, {backgroundColor: theme.background}]}>
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
          placeholder={'Search for buddies...'}
          placeholderTextColor={theme.text}
          value={searchQueryBuddies}
          onChangeText={text => setSearchQueryBuddies(text)}
        />
        <Icon
          name="search"
          size={24}
          color={theme.text}
          style={styles.searchIcon}
        />
      </View>
      <View style={{flex: 1, padding: 10}}>
        {loading ? (
          <ActivityIndicator size="large" color={theme.accent2} />
        ) : (
          <FlatList
            style={{paddingBottom: hp(2)}}
            data={filteredBuddies}
            keyExtractor={item => item._id}
            renderItem={({item}) => {
              const user = item;

              return (
                <TouchableOpacity
                  disabled
                  onPress={() => {
                    navigation.navigate('SearchedBuddyDetails', {
                      buddy: user,
                    });
                  }}
                  style={[styles.userItem, {backgroundColor: theme.card}]}>
                  <View style={{width: wp(14)}}>
                    <Image
                      source={
                        user.profileImage
                          ? {uri: user.profileImage}
                          : require('../assets/images/default.jpg')
                      }
                      resizeMode="contain"
                      style={styles.profileImage}
                    />
                  </View>
                  <View style={{width: wp(74), marginLeft: wp(2)}}>
                    <Text
                      style={{
                        color: theme.text,
                        fontFamily: 'Poppins-SemiBold',
                        fontSize: TextSize.Small,
                      }}>
                      {user.userName}
                    </Text>
                    <Text
                      style={{
                        color: theme.text,
                        fontFamily: 'Poppins-Regular',
                        fontSize: TextSize.Tiny,
                      }}>
                      {`${user.firstName} ${user.lastName}`}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Icon
                  name="person-search"
                  size={40}
                  color={theme.text}
                  style={styles.emptyIcon}
                />
                <Text
                  style={[
                    styles.emptyText,
                    {fontSize: TextSize.Tiny, color: theme.text},
                  ]}>
                  No buddies match your search.
                </Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
};

export default BuddyConnections;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: hp(2),
    paddingHorizontal: wp(4),
  },
  searchInput: {
    width: wp(80),
    height: hp(6),
    paddingHorizontal: wp(4),
    borderRadius: 10,
  },
  searchIcon: {
    alignSelf: 'center',
    marginLeft: -wp(10),
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: hp(1),
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(4),
    borderRadius: 10,
  },
  profileImage: {
    width: wp(14),
    height: wp(14),
    borderRadius: wp(7),
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hp(5),
  },
  emptyIcon: {
    marginBottom: hp(1),
  },
  emptyText: {
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
  },
});
