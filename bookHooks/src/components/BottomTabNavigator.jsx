import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Home from '../screens/Home';
import HookUnhook from '../screens/HookUnhook';
import TrackBooks from '../screens/TrackBooks';
import Profile from '../screens/Profile';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {ThemeContext} from '../context/ThemeContext';
import TextSize from '../TextScaling';
import Buddies from '../screens/Buddies';

const Tab = createBottomTabNavigator();

const BottomTabNavigator = () => {
  const {theme} = React.useContext(ThemeContext);
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({focused, color, size}) => {
          let iconName;
          let iconSize = focused ? 28 : 24;
          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'HookUnhook') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'Buddies') {
            iconName = focused ? 'people' : 'people-outline'; // Changed to people-outline
          } else if (route.name === 'Track') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={iconSize} color={color} />;
        },
        tabBarActiveTintColor: '#2A2A2A',
        tabBarInactiveTintColor: '#2A2A2A',
        tabBarShowLabel: false,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.primary,
        },
      })}>
      <Tab.Screen name="HomeTab" component={Home} />
      <Tab.Screen name="HookUnhook" component={HookUnhook} />
      <Tab.Screen
        name="Buddies"
        component={Buddies}
        options={{
          headerShown: true,
          headerTitle: 'Connect with buddies',
          headerStyle: {
            backgroundColor: theme.primary,
          },
          headerTitleStyle: {
            color: theme.text,
            fontFamily: 'Poppins-SemiBold',
            fontSize: TextSize.Medium,
          },
        }}
      />
      <Tab.Screen
        name="Track"
        component={TrackBooks}
        options={{
          headerShown: true,
          headerTitle: 'Track Your Reading Journey',
          headerStyle: {
            backgroundColor: theme.primary,
          },
          headerTitleStyle: {
            color: theme.text,
            fontFamily: 'Poppins-SemiBold',
            fontSize: TextSize.Medium,
          },
        }}
      />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  );
};

export default BottomTabNavigator;
