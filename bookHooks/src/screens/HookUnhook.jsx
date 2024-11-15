import React, {useEffect, useState, useCallback} from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Image,
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

const HookUnhook = () => {
  const {theme} = React.useContext(ThemeContext);
  const [hookedBooks, setHookedBooks] = useState([]);
  const [unhook, setUnHooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isHookView, setIsHookView] = useState(true); // State to manage hook/unhook view
  const navigation = useNavigation();

  const fetchBooks = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(`${ipv4}/user-books`, {
        headers: {
          Authorization: `Bearer ${token}`, // Use the token from AsyncStorage
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
          Authorization: `Bearer ${token}`, // Use the token from AsyncStorage
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

  const handleToggle = view => {
    setIsHookView(view === 'Hook');
  };

  useFocusEffect(
    useCallback(() => {
      fetchUnHook();
    }, []),
  );

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: theme.background}}>
      <View style={styles.container}>
        {/* Toggle Buttons for Hook/Unhook */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              isHookView ? styles.activeButton : styles.inactiveButton,
              {backgroundColor: isHookView ? theme.primary : theme.card},
            ]}
            onPress={() => handleToggle('Hook')}>
            <Text
              style={[
                styles.toggleText,
                {color: isHookView ? theme.text : theme.text},
              ]}>
              Hooks
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              !isHookView ? styles.activeButton : styles.inactiveButton,
              {backgroundColor: !isHookView ? theme.primary : theme.card},
            ]}
            onPress={() => handleToggle('Unhook')}>
            <Text
              style={[
                styles.toggleText,
                {color: !isHookView ? theme.text : theme.text},
              ]}>
              Unhooks
            </Text>
          </TouchableOpacity>
        </View>

        {isHookView ? (
          // Hook View
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
                  <Icon name="book" size={24} color={theme.text} />
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
        ) : (
          // Unhook View
          <View style={styles.unhookView}>
            {/* <Text
              style={{
                color: theme.text,
                fontSize: TextSize.H4,
                fontFamily: 'Poppins-SemiBold',
                textAlign: 'center',
                paddingLeft: '2%',
                paddingTop: '2%',
              }}>
              Your Unhooks
            </Text> */}
            {/* Add content for Unhook functionality */}
            <FlatList
              contentContainerStyle={{alignItems: 'center'}}
              data={unhook} // Assuming 'unhook' contains the unhook requests from API
              showsVerticalScrollIndicator={false}
              numColumns={2}
              key={`unhook-${2}`}
              keyExtractor={item => item._id.toString()}
              ListHeaderComponent={
                <Text style={[styles.headerText, {color: theme.text}]}>
                  Your UnHooks
                </Text>
              }
              renderItem={({item}) => (
                <TouchableOpacity
                  style={[
                    styles.bookItem,
                    {
                      backgroundColor: theme.card,
                    },
                  ]}
                  onPress={() => {
                    console.log(item),
                      navigation.navigate('UnHookRequestDetails', {
                        title: item.book.title,
                        request: item._id,
                        owner: item.owner._id,
                        ownerName: item.owner.userName,
                        status: item.status,
                      });
                  }}>
                  <Image
                    source={
                      item.book.bookThumbnail
                        ? {uri: item.book.bookThumbnail}
                        : require('../assets/images/book-stack.png')
                    }
                    resizeMode="contain"
                    style={styles.bookImage}
                  />
                  <View
                    style={{
                      height: 'auto',
                      width: '100%',
                    }}>
                    <Text
                      style={{
                        color: theme.text,
                        fontSize: TextSize.Tiny,
                        fontFamily: 'Poppins-SemiBold',
                        textAlign: 'center',
                        marginTop: 10,
                      }}>
                      {item.book.title} {/* Book Title */}
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
                      {item.status.charAt(0).toUpperCase() +
                        item.status.slice(1)}{' '}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default HookUnhook;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  toggleButton: {
    width: wp('40%'),
    marginHorizontal: wp('2%'),
    paddingVertical: hp('1%'),
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  activeButton: {
    borderColor: '#fff',
  },
  inactiveButton: {
    borderColor: '#ccc',
  },
  toggleText: {
    fontSize: TextSize.Medium,
    fontFamily: 'Poppins-SemiBold',
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
  unhookView: {
    flex: 1,
    // justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontSize: TextSize.H4,
    fontFamily: 'Poppins-SemiBold',
    paddingLeft: '2%',
    paddingTop: '2%',
  },
});
