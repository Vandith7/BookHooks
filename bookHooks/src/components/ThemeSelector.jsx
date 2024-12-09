import React, {useContext} from 'react';
import {View, Button, StyleSheet, TouchableOpacity, Text} from 'react-native';
import {ThemeContext} from '../context/ThemeContext';
import TextSize from '../TextScaling';

const ThemeSelector = () => {
  const {toggleTheme, themeMode, theme} = useContext(ThemeContext);

  return (
    <View style={[styles.container, {borderTopColor: theme.text}]}>
      <Text
        style={{
          textAlign: 'center',
          marginTop: '4%',
          marginBottom: '4%',
          fontFamily: 'Poppins-SemiBold',
          fontSize: TextSize.Small,
          color: theme.text,
        }}>
        Select your preferred theme
      </Text>
      <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
        <TouchableOpacity
          onPress={() => toggleTheme('light')}
          style={[
            styles.button,
            {
              backgroundColor:
                themeMode === 'light' ? theme.primary : theme.accent2,
            },
          ]}>
          <Text
            style={{
              fontSize: TextSize.Small,
              color: theme.text,
              fontFamily: 'Poppins-Bold',
            }}>
            Light
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => toggleTheme('dark')}
          style={[
            styles.button,
            {
              backgroundColor:
                themeMode === 'dark' ? theme.primary : theme.accent2,
            },
          ]}>
          <Text
            style={{
              fontSize: TextSize.Small,
              color: theme.text,
              fontFamily: 'Poppins-Bold',
            }}>
            Dark
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => toggleTheme('system')}
          style={[
            styles.button,
            {
              backgroundColor:
                themeMode === 'system' ? theme.primary : theme.accent2,
            },
          ]}>
          <Text
            style={{
              fontSize: TextSize.Small,
              color: theme.text,
              fontFamily: 'Poppins-Bold',
            }}>
            System
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    width: '100%',
    padding: 10,
    borderTopWidth: 1,
    marginTop: '2%',
  },
  button: {
    padding: '2%',
    borderRadius: 8,
    width: '30%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ThemeSelector;
