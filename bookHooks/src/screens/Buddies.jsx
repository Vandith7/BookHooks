import {
  StyleSheet,
  Text,
  View,
  TextInput,
  FlatList,
  ActivityIndicator,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import {ipv4} from '../assets/others/constants';
import {ThemeContext} from '../context/ThemeContext';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TextSize from '../TextScaling';
import axios from 'axios';

const Buddies = ({navigation}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const {theme} = React.useContext(ThemeContext);

  // Fetch users from the backend based on the search query
  useEffect(() => {
    const fetchUsers = async () => {
      if (searchQuery.trim().length < 3) {
        setFilteredUsers([]); // Clear results if the search query is less than 3 characters
        return;
      }

      setLoading(true);
      try {
        const token = await AsyncStorage.getItem('token');
        const response = await fetch(
          `${ipv4}/find-users?search=${encodeURIComponent(searchQuery)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        const data = await response.json();
        setFilteredUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchRequests = async () => {
      setLoading(true);
      try {
        const token = await AsyncStorage.getItem('token');

        const response = await axios.get(`${ipv4}/get-users-requests`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setRequests(response.data);
      } catch (error) {
        console.error('Error fetching requests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
    const timeoutId = setTimeout(() => {
      fetchUsers();
    }, 500); // Debounce time: 500ms
    console.log(requests);
    return () => clearTimeout(timeoutId); // Clear the timeout on query change
  }, [searchQuery]);

  return (
    <ScrollView style={[styles.container, {backgroundColor: theme.background}]}>
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
          placeholder="Search for buddies..."
          placeholderTextColor={theme.text}
          value={searchQuery}
          onChangeText={text => setSearchQuery(text)}
        />
        <Icon
          name="search"
          size={24}
          color={theme.text}
          style={styles.searchIcon}
        />
      </View>

      {/* Users List */}
      {loading ? (
        <ActivityIndicator size="large" color={theme.accent2} />
      ) : (
        <>
          <FlatList
            style={{paddingBottom: hp(2)}}
            data={filteredUsers}
            keyExtractor={item => item._id} // MongoDB uses _id by default
            renderItem={({item}) => (
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate('SearchedBuddyDetails', {
                    buddy: item,
                  });
                }}
                style={[styles.userItem, {backgroundColor: theme.card}]}>
                <View style={{width: wp(14)}}>
                  {/* Fallback to a default image if profileImage is invalid */}
                  <Image
                    source={
                      item.profileImage
                        ? {uri: item.profileImage}
                        : require('../assets/images/default.jpg') // Default image in case of null
                    }
                    resizeMode="contain"
                    style={styles.profileImage}
                  />
                </View>
                <View style={{width: wp(74)}}>
                  <Text
                    style={{
                      color: theme.text,
                      fontFamily: 'Poppins-SemiBold',
                      fontSize: TextSize.Small,
                    }}>
                    {item.userName}
                  </Text>
                  <Text
                    style={{
                      color: theme.text,
                      fontFamily: 'Poppins-Regular',
                      fontSize: TextSize.Tiny,
                    }}>
                    {`${item.firstName} ${item.lastName}`}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text
                style={[
                  styles.emptyText,
                  {fontSize: TextSize.Tiny, color: theme.text},
                ]}>
                {searchQuery ? 'No buddies found.' : 'Search for buddies'}
              </Text>
            }
          />
          <FlatList
            style={{paddingBottom: hp(2)}}
            data={requests}
            keyExtractor={item => item.userId._id} // MongoDB uses _id by default
            renderItem={({item}) => (
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate('SearchedBuddyDetails', {
                    buddy: item,
                  });
                }}
                style={[styles.userItem, {backgroundColor: theme.card}]}>
                <View style={{width: wp(14)}}>
                  {/* Fallback to a default image if profileImage is invalid */}
                  <Image
                    source={
                      item.userId.profileImage
                        ? {uri: item.userId.profileImage}
                        : require('../assets/images/default.jpg') // Default image in case of null
                    }
                    resizeMode="contain"
                    style={styles.profileImage}
                  />
                </View>
                <View style={{width: wp(74)}}>
                  <Text
                    style={{
                      color: theme.text,
                      fontFamily: 'Poppins-SemiBold',
                      fontSize: TextSize.Small,
                    }}>
                    {item.userId.userName}
                  </Text>
                  <Text
                    style={{
                      color: theme.text,
                      fontFamily: 'Poppins-Regular',
                      fontSize: TextSize.Tiny,
                    }}>
                    {`${item.userId.firstName} ${item.userId.lastName}`}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text
                style={[
                  styles.emptyText,
                  {fontSize: TextSize.Tiny, color: theme.text},
                ]}>
                No requests found.
              </Text>
            }
          />
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: '2%',
    width: wp('94%'),
  },
  searchInput: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
  },
  searchIcon: {
    position: 'absolute',
    right: wp(4),
  },
  userItem: {
    width: wp('94%'),
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
    flexDirection: 'row',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 18,
    marginTop: hp('2%'),
    fontFamily: 'Poppins-Regular',
  },
  profileImage: {
    width: wp(12),
    height: wp(12),
    borderRadius: wp(10),
  },
});

export default Buddies;
