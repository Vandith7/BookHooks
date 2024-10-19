import React, {useContext} from 'react';
import {View, Button, StyleSheet} from 'react-native';
import {ThemeContext} from '../context/ThemeContext';

const ThemeSelector = () => {
  const {toggleTheme, themeMode} = useContext(ThemeContext);

  return (
    <View style={styles.container}>
      <Button
        title="Light Mode"
        onPress={() => toggleTheme('light')}
        color={themeMode === 'light' ? 'blue' : 'gray'}
      />
      <Button
        title="Dark Mode"
        onPress={() => toggleTheme('dark')}
        color={themeMode === 'dark' ? 'blue' : 'gray'}
      />
      <Button
        title="System Default"
        onPress={() => toggleTheme('system')}
        color={themeMode === 'system' ? 'blue' : 'gray'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    padding: 10,
  },
});

export default ThemeSelector;
