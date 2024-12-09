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
  ActivityIndicator,
} from 'react-native';
import {ThemeContext} from '../context/ThemeContext';
import TextSize from '../TextScaling';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import logo from '../assets/images/logo.png';
import axios from 'axios';
import ImagePicker from 'react-native-image-crop-picker';
import {useNavigation} from '@react-navigation/native';
import Snackbar from 'react-native-snackbar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ipv4} from '../assets/others/constants';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

const EditProfile = ({route}) => {
  const {theme} = useContext(ThemeContext);
  const {user} = route.params;
  const [firstName, setFirstName] = useState(user.firstName || '');
  const [lastName, setLastName] = useState(user.lastName || '');
  const [userName, setUserName] = useState(user.userName || '');
  const [bio, setBio] = useState(user.bio || '');
  const [email, setEmail] = useState(user.email || '');
  const [contactNumber, setContactNumber] = useState(user.contactNumber || '');

  const [profileImage, setProfileImage] = useState(null);

  // Error states
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [userNameError, setUserNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [contactNumberError, setContactNumberError] = useState('');
  const [apiError, setApiError] = useState('');

  const [loading, setLoading] = useState(false);

  const navigation = useNavigation();
  // Validate functions
  const validateFirstName = () => {
    if (!firstName) {
      setFirstNameError("First name can't be empty");
      return false;
    }
    setFirstNameError('');
    return true;
  };

  const validateLastName = () => {
    if (!lastName) {
      setLastNameError("Last name can't be empty");
      return false;
    }
    setLastNameError('');
    return true;
  };
  const validateUserName = () => {
    if (!userName) {
      setUserNameError("User name can't be empty");
      return false;
    }
    setUserNameError('');
    return true;
  };

  const validateEmail = () => {
    if (!email) {
      setEmailError("Email can't be empty");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Invalid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validateContactNumber = () => {
    if (!contactNumber) {
      setContactNumberError("Contact number can't be empty");
      return false;
    } else if (contactNumber.length !== 10) {
      setContactNumberError('Invalid contact number');
      return false;
    }
    setContactNumberError('');
    return true;
  };

  const handleEdit = async () => {
    if (loading) return;
    if (!validateFirstName()) return;
    if (!validateLastName()) return;
    if (!validateUserName()) return;
    if (!validateEmail()) return;
    if (!validateContactNumber()) return;
    setLoading(true);
    const formData = {};
    if (firstName !== user.firstName) formData.firstName = firstName;
    if (lastName !== user.lastName) formData.lastName = lastName;
    if (userName !== user.userName) formData.userName = userName;
    if (email !== user.email) formData.email = email;
    if (contactNumber !== user.contactNumber)
      formData.contactNumber = contactNumber;
    if (bio !== user.bio) formData.bio = bio;
    formData.profileImage = profileImage;
    const token = await AsyncStorage.getItem('token');
    axios
      .post(
        `${ipv4}/edit-profile`,
        formData, // Data (form data with changed fields)
        {
          headers: {Authorization: `Bearer ${token}`}, // Headers with the token
        },
      )
      .then(res => {
        setLoading(false);
        if (res.data.status === 'Success') {
          Snackbar.show({
            text: 'Profile edited',
            duration: Snackbar.LENGTH_LONG,
            backgroundColor: '#B08968',
            textColor: '#FFFFFF',
          });
          navigation.navigate('Home');
        } else {
          const errorMessage =
            typeof res.data.data === 'string'
              ? res.data.data
              : JSON.stringify(res.data.data);

          if (errorMessage.toLowerCase().includes('email')) {
            setEmailError('This email is already in use.');
          } else if (errorMessage.toLowerCase().includes('user name already')) {
            setUserNameError('This username is already taken.');
          } else if (errorMessage.toLowerCase().includes('contact number')) {
            setContactNumberError('This contact number is already in use.');
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
          setEmailError('This email is already in use.');
        } else if (errorMessage.toLowerCase().includes('user name already')) {
          setUserNameError('This username is already taken.');
        } else if (errorMessage.toLowerCase().includes('contact number')) {
          setContactNumberError('This contact number is already in use.');
        } else {
          setApiError('An unknown error occurred.');
        }
      });
  };

  const pickImage = () => {
    ImagePicker.openPicker({
      width: 300,
      height: 300,
      cropping: true,
      cropperCircleOverlay: true,
      includeBase64: true,
    }).then(image => {
      const data = `data:${image.mime};base64,${image.data}`;
      setProfileImage(data);
    });
  };

  const removeImage = () => {
    setProfileImage(null);
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
                source={
                  user.profileImage
                    ? {uri: user.profileImage}
                    : require('../assets/images/default.jpg')
                }
                style={styles.profileImage}
                resizeMode="contain"
              />
            </View>

            {/* Name Fields */}
            <View style={styles.nameRow}>
              <View
                style={[
                  styles.inputContainer,
                  styles.halfWidth,
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
                  placeholder="First Name"
                  placeholderTextColor={theme.placeholder}
                  value={firstName}
                  onChangeText={setFirstName}
                  onBlur={validateFirstName} // Validate on blur
                />
              </View>
              <View
                style={[
                  styles.inputContainer,
                  styles.halfWidth,
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
                  placeholder="Last Name"
                  placeholderTextColor={theme.placeholder}
                  value={lastName}
                  onChangeText={setLastName}
                  onBlur={validateLastName} // Validate on blur
                />
              </View>
            </View>
            {firstNameError ? (
              <Text style={styles.errorText}>{firstNameError}</Text>
            ) : null}
            {lastNameError ? (
              <Text style={styles.errorText}>{lastNameError}</Text>
            ) : null}

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
                placeholder="User Name"
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
                name="email"
                size={24}
                color={theme.iconColor}
                style={styles.icon}
              />
              <TextInput
                keyboardType="email-address"
                autoCapitalize="none"
                style={[
                  styles.input,
                  {backgroundColor: theme.inputBg, color: theme.text},
                ]}
                placeholder="Email"
                placeholderTextColor={theme.placeholder}
                value={email}
                onChangeText={setEmail}
                onBlur={validateEmail} // Validate on blur
              />
            </View>
            {emailError ? (
              <Text style={styles.errorText}>{emailError}</Text>
            ) : null}

            <View
              style={[
                styles.inputContainer,
                {backgroundColor: theme.secondary},
              ]}>
              <Icon
                name="phone"
                size={24}
                color={theme.iconColor}
                style={styles.icon}
              />
              <TextInput
                keyboardType="numeric"
                style={[
                  styles.input,
                  {backgroundColor: theme.inputBg, color: theme.text},
                ]}
                placeholder="Contact Number"
                placeholderTextColor={theme.placeholder}
                value={contactNumber}
                onChangeText={setContactNumber}
                onBlur={validateContactNumber} // Validate on blur
              />
            </View>
            {contactNumberError ? (
              <Text style={styles.errorText}>{contactNumberError}</Text>
            ) : null}

            <View
              style={[
                styles.inputContainer,
                {backgroundColor: theme.secondary},
              ]}>
              <Icon
                name="face"
                size={24}
                color={theme.iconColor}
                style={styles.icon}
              />
              <TextInput
                style={[
                  styles.input,
                  {backgroundColor: theme.inputBg, color: theme.text},
                ]}
                multiline={true} // Allows multi-line input
                numberOfLines={4} // Limits the initial number of lines
                maxHeight={60} // Adjust this value as needed
                placeholder="Introduce yourself in a few words..."
                placeholderTextColor={theme.placeholder}
                value={bio}
                onChangeText={setBio}
              />
            </View>

            {/* Profile Image Picker */}
            <View style={styles.profileImageContainer}>
              <TouchableOpacity
                style={[styles.imagePicker, {backgroundColor: theme.secondary}]}
                onPress={pickImage}>
                {profileImage ? (
                  <>
                    <Image
                      source={{uri: profileImage}}
                      style={styles.profileImage} // Ensure you have a style defined for image size
                    />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={removeImage}>
                      <Icon
                        name="close"
                        size={24}
                        color="white"
                        style={styles.closeIcon}
                      />
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Icon
                      name="add-a-photo"
                      size={24}
                      color={theme.iconColor}
                    />
                    <Text
                      style={{
                        color: theme.text,
                        textAlign: 'center',
                        fontFamily: 'Poppins-Regular',
                        fontSize: TextSize.Tiny,
                        marginHorizontal: hp(1),
                      }}>
                      Pick new Profile Image
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
            {loading ? (
              <ActivityIndicator size="large" color={theme.accent2} />
            ) : (
              <TouchableOpacity
                disabled={loading}
                style={[
                  styles.getStartedButton,
                  {backgroundColor: theme.primary, elevation: 4},
                ]}
                onPress={handleEdit}>
                <Text
                  style={[
                    {
                      fontSize: TextSize.H6,
                      color: theme.text,
                      fontFamily: 'Poppins-Bold',
                    },
                  ]}>
                  Save changes
                </Text>
              </TouchableOpacity>
            )}
            {apiError ? (
              <Text style={[styles.errorText, {marginTop: '2%'}]}>
                {apiError}
              </Text>
            ) : null}
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default EditProfile;

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
    width: wp(22),
    height: wp(22),
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
