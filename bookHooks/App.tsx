import React from 'react';
import { ThemeProvider, ThemeContext } from './src/context/ThemeContext';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Intro from './src/screens/Intro';
import Register from './src/screens/Register';
import Login from './src/screens/Login';
import BottomTabNavigator from './src/components/BottomTabNavigator';
import Hook from './src/screens/Hook';
import BookDetails from './src/screens/BookDetails';
import OwnBookDetails from './src/screens/OwnBookDetails';
import RequesterDetails from './src/screens/RequesterDetails';
import UnHookRequestDetails from './src/screens/UnHookRequestDetails';
import HookedUserDetails from './src/screens/HookedUserDetails';
import AddTrackBooks from './src/screens/AddTrackBooks';
import TextSize from './src/TextScaling';
import UpdateTrackBook from './src/screens/UpdateTrackBook';
import Buddies from './src/screens/Buddies';
import SearchedBuddyDetails from './src/screens/SearchedBuddyDetails';
import BuddyTrackBook from './src/screens/BuddyTrackBook';

// Define types for navigation params
type RootStackParamList = {
  Intro: undefined;
  Register: undefined;
  Login: undefined;
  Home: undefined;
  Hook: undefined;
  AddTrackBooks:undefined;
  Buddies:undefined;
  BookDetails: { book: { title: string; isbn10?: string; isbn13?: string; owner: string; author: string; bookThumbnail?: string } };
  BuddyTrackBook: { book: { title: string; } }; 
  OwnBook: { book: { title: string; isbn10?: string; isbn13?: string; owner: string; author: string; bookThumbnail?: string } }; 
  RequesterDetails: { userName: string ; userID:string ; bookName:string ; requestId:string }; 
  UnHookRequestDetails: {title:string,request: string,owner:string,ownerName:string,status:string}; 
  HookedUserDetails:{userName: string ; userID:string ; bookName:string ; requestId:string}
  UpdateTrackBook:{book: {BookStatus?: string,  _id?: string, author?: string,  bookThumbnail?: string, categories?: string, createdAt?: string, dateCompleted?: string, isbn10?: string, isbn13?: string, review?: string, source?: string, startDate?: string, title?:string, updatedAt?: string}}
  SearchedBuddyDetails:{buddy:{userID:string;firstName:string;lastName:string;userName:string;profileImage:string;bio:string;joiningDate:Date}}
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const App = () => {
  return (
    <ThemeProvider>
      <NavigationContainer>
        <ThemeWrapper />
      </NavigationContainer>
    </ThemeProvider>
  );
};

const ThemeWrapper = () => {
  const { theme } = React.useContext(ThemeContext);

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.primary,
        },
        headerTintColor: theme.text,
        headerTitleStyle: {
          fontFamily: 'Poppins-SemiBold',
          fontSize: TextSize.Medium,
        },
      }}
      initialRouteName="Intro"
    >
      <Stack.Screen
        name="Intro"
        component={Intro}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Register"
        component={Register}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Login"
        component={Login}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Home"
        component={BottomTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Hook"
        component={Hook}
        options={{ title: 'Hook your book' }}
      />

      <Stack.Screen
        name="Buddies"
        component={Buddies}
        options={{ title: 'Buddies' }}
      />
      
      <Stack.Screen
        name="BookDetails"
        component={BookDetails}
        options={({ route }) => {
          const bookTitle = route.params.book?.title ?? 'Book Details'; 
          return {
            title: bookTitle,
            headerShown: true,
          };
        }}
      />

<Stack.Screen
        name="BuddyTrackBook"
        component={BuddyTrackBook}
        options={({ route }) => {
          const bookTitle = route.params.book?.title ?? 'Book Details'; 
          return {
            title: bookTitle,
            headerShown: true,
          };
        }}
      />

      <Stack.Screen
        name="OwnBook"
        component={OwnBookDetails}
        options={({ route }) => {
          const bookTitle = route.params.book?.title ?? 'Book Details'; 
          return {
            title: bookTitle,
            headerShown: true,
          };
        }}
      />
      
      <Stack.Screen
        name="RequesterDetails"
        component={RequesterDetails}
        options={({ route }) => {
          const bookTitle = route.params.userName ?? 'Requester Details'; 
          return {
            title: bookTitle,
            headerShown: true,
          };
        }}
      />

      <Stack.Screen
        name="UnHookRequestDetails"
        component={UnHookRequestDetails}
        options={({ route }) => {
          const bookTitle = route.params.title ?? 'Requester Details'; 
          return {
            title: bookTitle,
            headerShown: true,
          };
        }}
      />

      <Stack.Screen
        name="HookedUserDetails"
        component={HookedUserDetails}
        options={({ route }) => {
          const bookTitle = route.params.userName ?? 'Hooked User Details'; 
          return {
            title: bookTitle,
            headerShown: true,
          };
        }}
      />
      <Stack.Screen
        name="AddTrackBooks"
        component={AddTrackBooks}
        options={{ title: 'Add Book to Your Collection' }}
      />

      <Stack.Screen
        name="UpdateTrackBook"
        component={UpdateTrackBook}
        options={({ route }) => {
          const bookTitle = route.params.book?.title ?? 'Update Book Details'; 
          return {
            title: bookTitle,
            headerShown: true,
          };
        }}
      />

      <Stack.Screen
        name="SearchedBuddyDetails"
        component={SearchedBuddyDetails}
        options={({ route }) => {
          const buddyName = route.params.buddy?.userName ?? 'Buddy Details'; 
          return {
            title: buddyName,
            headerShown: true,
          };
        }}
      />
    </Stack.Navigator>
  );
};

export default App;
