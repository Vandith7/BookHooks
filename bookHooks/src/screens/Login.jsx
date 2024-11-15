import React, {useState, useContext} from 'react';
import {
  ScrollView,
  StyleSheet,
  TextInput,
  Image,
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import {ThemeContext} from '../context/ThemeContext';
import TextSize from '../TextScaling';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import logo from '../assets/images/logo.png';
import axios from 'axios';
import {useNavigation} from '@react-navigation/native';
import Snackbar from 'react-native-snackbar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ipv4} from '../assets/others/constants';

const Login = () => {
  const {theme} = useContext(ThemeContext);

  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  // Error states

  const [userNameError, setUserNameError] = useState('');

  const [passwordError, setPasswordError] = useState('');

  const [apiError, setApiError] = useState('');

  const [loading, setLoading] = useState(false);

  const navigation = useNavigation();

  const validateUserName = () => {
    if (!userName) {
      setUserNameError('Please enter your user name or email');
      return false;
    }
    setUserNameError('');
    return true;
  };

  const validatePassword = () => {
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!\"#$%&'()*+,-./:;<=>?@[\\\]^_`{|}~])[A-Za-z\d!\"#$%&'()*+,-./:;<=>?@[\\\]^_`{|}~]{8,}$/;

    if (!password) {
      setPasswordError("Password can't be empty");
      return false;
    }
    if (!passwordRegex.test(password)) {
      if (password.length < 8) {
        setPasswordError('Password must be at least 8 characters long');
      } else if (!/(?=.*[a-z])/.test(password)) {
        setPasswordError('Password must include at least one lowercase letter');
      } else if (!/(?=.*[A-Z])/.test(password)) {
        setPasswordError('Password must include at least one uppercase letter');
      } else if (!/(?=.*\d)/.test(password)) {
        setPasswordError('Password must include at least one number');
      } else if (
        !/(?=.*[!\"#$%&'()*+,-./:;<=>?@[\\\]^_`{|}~])/.test(password)
      ) {
        setPasswordError(
          'Password must include at least one special character',
        );
      }
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleLogin = () => {
    if (loading) return;
    if (!validateUserName()) return;
    if (!validatePassword()) return;
    setLoading(true);

    const formData = {
      loginId: userName,
      password,
    };

    axios
      .post(`${ipv4}/login`, formData)
      .then(res => {
        setLoading(false);
        if (res.data.status === 'Success') {
          Snackbar.show({
            text: 'Login successful!',
            duration: Snackbar.LENGTH_LONG,
            backgroundColor: '#B08968',
            textColor: '#FFFFFF',
          });
          AsyncStorage.setItem('token', res.data.data);
          AsyncStorage.setItem('isRegistered', 'true');
          navigation.navigate('Home');
          navigation.reset({
            index: 0,
            routes: [{name: 'Home'}],
          });
        } else {
          const errorMessage =
            typeof res.data.data === 'string'
              ? res.data.data
              : JSON.stringify(res.data.data);

          if (errorMessage.toLowerCase().includes('email')) {
            setUserNameError(
              'Account not found. Please check your email or username.',
            );
          } else if (errorMessage.toLowerCase().includes('password')) {
            setPasswordError('Incorrect password. Please try again.');
          } else {
            setApiError('An unknown error occurred.');
          }
        }
      })
      .catch(e => {
        setLoading(false);
        console.error('Error details:', e);

        const errorMessage =
          e.response && e.response.data
            ? typeof e.response.data === 'string'
              ? e.response.data
              : JSON.stringify(e.response.data)
            : 'Failed to register, please try again.';

        console.log('Error message:', errorMessage);

        if (errorMessage.toLowerCase().includes('email')) {
          setUserNameError(
            'Account not found. Please check your email or username.',
          );
        } else if (errorMessage.toLowerCase().includes('password')) {
          setPasswordError('Incorrect password. Please try again.');
        } else {
          setApiError('An unknown error occurred.');
        }
      });
  };

  return (
    <KeyboardAvoidingView behavior="padding" style={{flex: 1}}>
      <SafeAreaView
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: theme.primary,
        }}>
        <ScrollView
          keyboardShouldPersistTaps={'always'}
          contentContainerStyle={{
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <View style={[styles.container, {backgroundColor: theme.card}]}>
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}>
              <Image
                source={logo}
                style={{height: 100, width: 100}}
                resizeMode="contain"
              />
            </View>
            <View style={{alignItems: 'center', justifyContent: 'center'}}>
              <Text
                style={[
                  styles.welcomeText,
                  {
                    fontSize: TextSize.Medium,
                    color: theme.text,
                    fontFamily: 'Poppins-SemiBold',
                    fontWeight: '500',
                  },
                ]}>
                Log In to
              </Text>
              <Text
                style={[
                  {
                    fontSize: TextSize.XXLarge,
                    color: theme.primary,
                    fontFamily: 'Merriweather-Black',
                    marginBottom: '8%',
                  },
                ]}>
                BookHooks
              </Text>
            </View>

            {/* Other Input Fields */}
            <View
              style={[
                styles.inputContainer,
                {backgroundColor: theme.secondary},
              ]}>
              <Icon
                name="person"
                size={24}
                color={theme.iconColor}
                style={styles.icon}
              />
              <TextInput
                style={[
                  styles.input,
                  {backgroundColor: theme.inputBg, color: theme.text},
                ]}
                placeholder="User Name or email"
                placeholderTextColor={theme.placeholder}
                value={userName}
                onChangeText={setUserName}
                onBlur={validateUserName} // Validate on blur
              />
            </View>
            {userNameError ? (
              <Text style={styles.errorText}>{userNameError}</Text>
            ) : null}

            <View
              style={[
                styles.inputContainer,
                {backgroundColor: theme.secondary},
              ]}>
              <Icon
                name="lock"
                size={24}
                color={theme.iconColor}
                style={styles.icon}
              />
              <TextInput
                style={[
                  styles.input,
                  {backgroundColor: theme.inputBg, color: theme.text},
                ]}
                placeholder="Password"
                placeholderTextColor={theme.placeholder}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                onBlur={validatePassword} // Validate on blur
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Icon
                  style={styles.icon}
                  name={showPassword ? 'visibility' : 'visibility-off'}
                  size={24}
                  color={theme.iconColor}
                />
              </TouchableOpacity>
            </View>
            {passwordError ? (
              <Text style={styles.errorText}>{passwordError}</Text>
            ) : null}

            {loading ? (
              <ActivityIndicator size="large" color={theme.accent2} />
            ) : (
              <TouchableOpacity
                disabled={loading}
                style={[
                  styles.getStartedButton,
                  {backgroundColor: theme.primary, elevation: 4},
                ]}
                onPress={handleLogin}>
                <Text
                  style={[
                    {
                      fontSize: TextSize.H6,
                      color: theme.text,
                      fontFamily: 'Poppins-Bold',
                    },
                  ]}>
                  Sign In
                </Text>
              </TouchableOpacity>
            )}
            {apiError ? (
              <Text style={[styles.errorText, {marginTop: '2%'}]}>
                {apiError}
              </Text>
            ) : null}
            <View style={{marginTop: '4%'}}>
              <Text
                style={{
                  fontSize: TextSize.Tiny,
                  color: theme.text,
                  fontFamily: 'Poppins-Regular',
                }}>
                New to BookHooks?
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text
                  style={{
                    fontSize: TextSize.Tiny,
                    color: theme.highlight,
                    fontFamily: 'Poppins-SemiBold',
                  }}>
                  Create an account
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    width: '82%',
    padding: '8%',
    marginTop: '10%',
    elevation: 8,
    borderRadius: 12,
    marginBottom: '10%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderRadius: 8,
    paddingLeft: 10,
  },
  icon: {
    marginRight: 4,
  },
  input: {
    flex: 1,
    fontSize: TextSize.Tiny,
    paddingVertical: 10,
    fontFamily: 'Poppins-Regular',
  },
  getStartedButton: {
    width: '100%',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: '8%',
  },
  welcomeText: {
    textAlign: 'center',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    marginLeft: '1%',
    marginTop: '-6%',
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  halfWidth: {
    width: '48%',
  },
  imagePicker: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  removeImageButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#B08968',
    borderRadius: 12,
    padding: 4,
  },
  profileImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
