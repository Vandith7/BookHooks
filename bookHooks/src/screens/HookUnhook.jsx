import React, {useEffect, useState, useCallback} from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {ThemeContext} from '../context/ThemeContext';
import TextSize from '../TextScaling';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ipv4} from '../assets/others/constants';
import axios from 'axios';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {TabView, SceneMap, TabBar} from 'react-native-tab-view';

const HookUnhook = () => {
  const {theme} = React.useContext(ThemeContext);
  const [hookedBooks, setHookedBooks] = useState([]);
  const [unhook, setUnHooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigation = useNavigation();
  const [index, setIndex] = useState(0);
  const [routes, setRoutes] = useState([
    {key: 'hooks', title: 'Your Hooks'},
    {key: 'unHooks', title: `Your UnHooks`},
  ]);

  const fetchBooks = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${ipv4}/user-books`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setHookedBooks(response.data.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch books');
      setLoading(false);
      console.error(err);
    }
  };

  const fetchUnHook = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${ipv4}/user-unhooks`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUnHooks(response.data.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch books');
      setLoading(false);
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBooks();
    fetchUnHook();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchUnHook();
    }, []),
  );

  const HookRoute = () =>
    loading ? (
      <ActivityIndicator
        size="large"
        color={theme.primary}
        style={styles.activityIndicator}
      />
    ) : (
      <FlatList
        contentContainerStyle={{alignItems: 'center'}}
        data={hookedBooks}
        showsVerticalScrollIndicator={false}
        numColumns={2}
        key={`hookedBooks-${2}`}
        keyExtractor={item => item._id.toString()}
        ListHeaderComponent={
          <Text style={[styles.headerText, {color: theme.text}]}>
            Your Hooks
          </Text>
        }
        ListFooterComponent={
          <TouchableOpacity
            style={[styles.hookButton, {backgroundColor: theme.card}]}
            onPress={() => navigation.navigate('Hook')}>
            <View style={styles.iconContainer}>
              <Icon name="menu-book" size={24} color={theme.text} />
            </View>
            <Text
              style={{
                color: theme.text,
                fontSize: TextSize.Small,
                fontFamily: 'Poppins-SemiBold',
                textAlign: 'center',
              }}>
              Click here to Hook your Book!
            </Text>
          </TouchableOpacity>
        }
        renderItem={({item}) => (
          <TouchableOpacity
            style={[styles.bookItem, {backgroundColor: theme.card}]}
            onPress={() => navigation.navigate('OwnBook', {book: item})}>
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
              style={{
                color: theme.text,
                fontSize: TextSize.Tiny,
                fontFamily: 'Poppins-SemiBold',
                textAlign: 'center',
                marginTop: 10,
              }}>
              {item.title}
            </Text>
          </TouchableOpacity>
        )}
      />
    );

  const UnHookRoute = () =>
    loading ? (
      <ActivityIndicator
        size="large"
        color={theme.primary}
        style={styles.activityIndicator}
      />
    ) : (
      <FlatList
        contentContainerStyle={{alignItems: 'center', paddingBottom: hp(2)}}
        data={unhook}
        showsVerticalScrollIndicator={false}
        numColumns={2}
        key={`unhook-${2}`}
        keyExtractor={item => item._id.toString()}
        ListHeaderComponent={
          <Text style={[styles.headerText, {color: theme.text}]}>
            Your UnHooks
          </Text>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon
              name="menu-book"
              size={40}
              color={theme.text}
              style={styles.emptyIcon}
            />
            <Text
              style={[
                styles.emptyText,
                {fontSize: TextSize.Tiny, color: theme.text},
              ]}>
              No books unhooked yet.
            </Text>
          </View>
        }
        renderItem={({item}) => (
          <TouchableOpacity
            style={[styles.bookItem, {backgroundColor: theme.card}]}
            onPress={() =>
              navigation.navigate('UnHookRequestDetails', {
                title: item.book.title,
                request: item._id,
                owner: item.owner._id,
                ownerName: item.owner.userName,
                profileImage: item.owner.profileImage,
                status: item.status,
              })
            }>
            <Image
              source={
                item.book.bookThumbnail
                  ? {uri: item.book.bookThumbnail}
                  : require('../assets/images/book-stack.png')
              }
              resizeMode="contain"
              style={styles.bookImage}
            />
            <View>
              <Text
                numberOfLines={1} // Limit the title to 4 lines
                ellipsizeMode="tail" // Add "..." at the end if the text overflows
                style={{
                  color: theme.text,
                  fontSize: TextSize.Tiny,
                  fontFamily: 'Poppins-SemiBold',
                  textAlign: 'center',
                  marginTop: 10,
                }}>
                {item.book.title}
              </Text>
            </View>
            <View>
              <Text
                style={{
                  color: theme.text,
                  fontSize: TextSize.Tiny,
                  fontFamily: 'Poppins-SemiBold',
                  textAlign: 'center',
                }}>
                Owner: {item.owner.userName}
              </Text>
            </View>
            <View>
              <Text
                style={{
                  color: item.status === 'pending' ? 'orange' : 'green',
                  fontSize: TextSize.Tiny,
                  fontFamily: 'Poppins-SemiBold',
                  textAlign: 'center',
                  marginTop: 5,
                }}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    );

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: theme.background}}>
      <View style={styles.container}>
        <TabView
          navigationState={{index, routes}}
          renderScene={SceneMap({
            hooks: HookRoute,
            unHooks: UnHookRoute,
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  iconContainer: {
    paddingBottom: hp(1),
  },
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
  bookItem: {
    width: wp('42%'),
    padding: 10,
    borderRadius: 10,
    elevation: 5,
    alignItems: 'center',
    margin: 5,
    justifyContent: 'space-between',
  },
  bookImage: {
    width: wp('32%'),
    height: hp('24%'),
    borderRadius: 5,
  },

  headerText: {
    fontSize: TextSize.Small,
    fontFamily: 'Poppins-SemiBold',
    textAlign: 'center',
    paddingTop: hp(2),
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

export default HookUnhook;
