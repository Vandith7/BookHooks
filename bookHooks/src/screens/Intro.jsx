import React, {useEffect, useState} from 'react';
import {
  Text,
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';
import TextSize from '../TextScaling';
import {ThemeContext} from '../context/ThemeContext';
import logo from '../assets/images/logo.png';

const Intro = () => {
  const {theme} = React.useContext(ThemeContext);
  const navigation = useNavigation();
  const [isRegistered, setIsRegistered] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const checkStorage = async () => {
      try {
        const registered = await AsyncStorage.getItem('isRegistered');
        const storedToken = await AsyncStorage.getItem('token');

        setIsRegistered(registered !== null);
        setToken(storedToken);

        if (registered !== null && storedToken) {
          navigation.navigate('Home');
        } else if (registered !== null && !storedToken) {
          navigation.navigate('Login');
        }
      } catch (error) {
        console.error('Failed to check storage', error);
      }
    };

    checkStorage();
  }, [navigation]);

  const handleGetStarted = async () => {
    try {
      await AsyncStorage.setItem('isRegistered', 'true');
      navigation.navigate('Register');
    } catch (error) {
      console.error('Failed to set registration status', error);
    }
  };

  if (isRegistered !== null && token) {
    return null;
  }

  return (
    <SafeAreaView style={{flex: 1, height: '100%', width: '100%'}}>
      <View style={[styles.OuterContainer, {backgroundColor: theme.primary}]}>
        <View
          style={{
            height: '45%',
            width: '100%',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Image
            source={logo}
            style={{
              height: '60%',
              width: '60%',
            }}
            resizeMode="contain"
          />
        </View>
        <View style={[styles.container, {backgroundColor: theme.background}]}>
          <Text
            style={[
              styles.welcomeText,
              {
                fontSize: TextSize.XLarge,
                color: theme.text,
                marginTop: '2%',
                fontFamily: 'Poppins-SemiBold',
                fontWeight: '500',
              },
            ]}>
            Welcome to,
          </Text>
          <Text
            style={[
              {
                fontSize: TextSize.XXLarge + 2,
                color: theme.primary,
                fontFamily: 'Merriweather-Black',
                marginBottom: '2%',
              },
            ]}>
            BookHooks
          </Text>
          <Text
            style={[
              {
                fontSize: TextSize.Body,
                marginTop: '2%',
                color: theme.text,
                fontFamily: 'Poppins-SemiBold',
              },
            ]}>
            Whether you're here to lend a book, find your next great read, or
            connect with fellow book lovers, we're excited to have you. Dive in
            and get started!
          </Text>
          <Text
            style={[
              {
                fontSize: TextSize.Small,
                marginTop: '2%',
                color: theme.text,
                fontFamily: 'Poppins-Regular',
              },
            ]}>
            Sign in or create an account to start sharing and discovering great
            books with our community.
          </Text>
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              width: '100%',
            }}>
            <TouchableOpacity
              style={[
                styles.getStartedButton,
                {backgroundColor: theme.primary},
              ]}
              onPress={handleGetStarted}>
              <Text
                style={[
                  {
                    fontSize: TextSize.H6,
                    color: theme.text,
                    fontFamily: 'Poppins-Bold',
                  },
                ]}>
                Get Started
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  OuterContainer: {
    flex: 1,
    height: '100%',
    width: '100%',
  },
  container: {
    position: 'absolute',
    bottom: 0,
    height: '55%',
    width: '100%',
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    padding: '5%',
  },
  getStartedButton: {
    height: '50%',
    maxHeight: 55,
    width: '50%',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
});

export default Intro;
