import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  PermissionsAndroid,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import {ThemeContext} from '../context/ThemeContext';
import TextSize from '../TextScaling';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

const GetLocation = ({onLocationUpdate}) => {
  const [location, setLocation] = useState(null);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [locationError, setLocationError] = useState('');
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const [buttonText, setButtonText] = useState('Get location');
  const [loading, setLoading] = useState(false);
  const {theme} = React.useContext(ThemeContext);

  useEffect(() => {
    const checkPermission = async () => {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        setLocationError('Location permission denied');
      }
    };
    checkPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'App needs access to your location.',
          buttonNeutral: 'Ask Me Later',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  };

  const getCurrentLocation = () => {
    setLoading(true);
    Geolocation.getCurrentPosition(
      position => {
        const {latitude, longitude} = position.coords;
        setLocation({latitude, longitude});
        setLatitude(latitude);
        setLongitude(longitude);
        setLocationError('');
        setButtonText('Location set!');
        setButtonDisabled(true);
        setLoading(false);
        onLocationUpdate({latitude, longitude});
      },
      error => {
        setLoading(false);
        switch (error.code) {
          case 1:
            setLocationError('Location permission denied');
            break;
          case 2:
            setLocationError('Position unavailable');
            break;
          case 3:
            setLocationError('Timeout occurred');
            break;
          default:
            setLocationError('Error getting location');
        }
        setButtonText('Get location');
        setButtonDisabled(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      },
    );
  };

  return (
    <View style={{marginBottom: hp(3)}}>
      <TouchableOpacity
        style={[
          {
            backgroundColor: buttonDisabled ? theme.accent2 : theme.primary,
            elevation: 4,
          },
          styles.getButton,
        ]}
        onPress={getCurrentLocation}
        disabled={buttonDisabled}>
        {loading ? (
          <ActivityIndicator size="small" color={theme.text} />
        ) : (
          <Text
            style={{
              fontSize: TextSize.H6,
              color: theme.text,
              fontFamily: 'Poppins-Bold',
            }}>
            {buttonText}
          </Text>
        )}
      </TouchableOpacity>

      {locationError ? (
        <Text style={{color: 'red'}}>{locationError}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  getButton: {
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
});

export default GetLocation;
