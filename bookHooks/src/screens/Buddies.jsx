import {
  StyleSheet,
  Text,
  View,
  TextInput,
  FlatList,
  ActivityIndicator,
  Image,
  TouchableOpacity,
} from 'react-native';
import React, {useState, useEffect, useCallback} from 'react';
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
import {TabView, SceneMap, TabBar} from 'react-native-tab-view';
import {useFocusEffect} from '@react-navigation/native';

const Buddies = ({navigation}) => {
  const [searchQueryBuddies, setSearchQueryBuddies] = useState('');
  const [searchQueryRequests, setSearchQueryRequests] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const {theme} = React.useContext(ThemeContext);
  const [index, setIndex] = useState(0);
  const [routes, setRoutes] = useState([
    {key: 'search', title: 'Search Buddies'},
    {key: 'requests', title: `Requests`}, // Initialize with 0 requests
  ]);

  useEffect(() => {
    setRoutes([
      {key: 'search', title: 'Search Buddies'},
      {
        key: 'requests',
        title:
          requests.length === 1
            ? 'Request (1)'
            : requests.length > 1
            ? `Requests (${requests.length})`
            : 'Requests',
      },
    ]);
  }, [requests]);
  const fetchUsers = async () => {
    if (searchQueryBuddies.trim().length < 3) {
      setFilteredUsers([]); // Clear results if the search query is less than 3 characters
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(
        `${ipv4}/find-users?search=${encodeURIComponent(searchQueryBuddies)}`,
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

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchUsers();
    }, 500); // Debounce time: 500ms

    return () => clearTimeout(timeoutId); // Clear the timeout on query change
  }, [searchQueryBuddies]);

  // Fetch requests from the backend (Requests Tab)
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
  useEffect(() => {
    fetchRequests();
  }, []);

  // Filter requests based on search query (Requests Tab)
  useEffect(() => {
    const filtered = requests.filter(request => {
      const {firstName, lastName, userName} = request.userId; // Destructure user info

      // Match the search query with firstName, lastName, or userName
      return (
        firstName.toLowerCase().includes(searchQueryRequests.toLowerCase()) ||
        lastName.toLowerCase().includes(searchQueryRequests.toLowerCase()) ||
        userName.toLowerCase().includes(searchQueryRequests.toLowerCase())
      );
    });

    setFilteredRequests(filtered);
  }, [searchQueryRequests, requests]);

  useFocusEffect(
    React.useCallback(() => {
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

      if (index === 1) {
        fetchRequests(); // Fetch requests only when on Requests tab
      }

      return () => {
        // Any cleanup if needed
      };
    }, [index]), // Re-run when index changes (on tab change)
  );

  // Scene for rendering the requests tab
  const RequestsRoute = () => (
    <View style={{flex: 1, padding: 10}}>
      {loading ? (
        <ActivityIndicator size="large" color={theme.accent2} />
      ) : (
        <FlatList
          style={{paddingBottom: hp(2)}}
          data={filteredRequests}
          keyExtractor={item => item.userId._id} // MongoDB uses _id by default
          renderItem={({item}) => {
            const user = item.userId; // Set item to userId

            return (
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate('SearchedBuddyDetails', {
                    buddy: user, // Use the user object
                  });
                }}
                style={[styles.userItem, {backgroundColor: theme.card}]}>
                <View style={{width: wp(14)}}>
                  {/* Fallback to a default image if profileImage is invalid */}
                  <Image
                    source={
                      user.profileImage
                        ? {uri: user.profileImage}
                        : require('../assets/images/default.jpg') // Default image in case of null
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
                No requests found.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );

  // Scene for rendering the search tab
  const SearchRoute = () => (
    <View style={{flex: 1, padding: 10}}>
      {loading ? (
        <ActivityIndicator size="large" color={theme.accent2} />
      ) : (
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
              <View style={{width: wp(74), marginLeft: wp(2)}}>
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
            <View style={styles.emptyContainer}>
              <Icon
                name="search"
                size={40}
                color={theme.text}
                style={styles.emptyIcon}
              />
              <Text
                style={[
                  styles.emptyText,
                  {fontSize: TextSize.Tiny, color: theme.text},
                ]}>
                {searchQueryBuddies
                  ? 'No buddies found.'
                  : 'Search for buddies'}
              </Text>
            </View>
          }
        />
      )}
    </View>
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
          placeholder={
            index === 0 ? 'Search for buddies...' : 'Search Requests...'
          }
          placeholderTextColor={theme.text}
          value={index === 0 ? searchQueryBuddies : searchQueryRequests} // Conditionally use search state based on the tab
          onChangeText={text =>
            index === 0
              ? setSearchQueryBuddies(text)
              : setSearchQueryRequests(text)
          }
        />
        <Icon
          name="search"
          size={24}
          color={theme.text}
          style={styles.searchIcon}
        />
      </View>

      {/* Tab View for Search and Requests */}
      <TabView
        navigationState={{index, routes}}
        renderScene={SceneMap({
          search: SearchRoute,
          requests: RequestsRoute,
        })}
        onIndexChange={setIndex}
        initialLayout={{width: wp('100%')}}
        renderTabBar={props => (
          <TabBar
            {...props}
            indicatorStyle={{backgroundColor: theme.text}}
            style={{backgroundColor: theme.primary}}
            labelStyle={{
              color: theme.text,
              fontFamily: 'Poppins-SemiBold',
            }}
            activeColor={theme.text}
            inactiveColor={theme.secondary}
          />
        )}
      />
    </View>
  );
};

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

export default Buddies;
