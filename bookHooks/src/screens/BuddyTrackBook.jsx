import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import React, {useContext, useState} from 'react';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {ThemeContext} from '../context/ThemeContext';
import TextSize from '../TextScaling';
import {format} from 'date-fns';

const BuddyTrackBook = ({route}) => {
  const {book, buddy} = route.params;
  const {theme} = useContext(ThemeContext);
  const [loading, setLoading] = useState(false);
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      style={[styles.container, {backgroundColor: theme.background}]}>
      {loading ? (
        <ActivityIndicator size="large" color={theme.primary} />
      ) : (
        <>
          <View style={[styles.titleContainer, {}]}>
            <Image
              source={
                book.bookThumbnail
                  ? {uri: book.bookThumbnail}
                  : require('../assets/images/book-stack.png')
              }
              resizeMode="contain"
              style={styles.bookImage}
            />
            <View>
              <Text
                style={[
                  styles.title,
                  {
                    color: theme.text,
                    fontFamily: 'Poppins-SemiBold',
                    fontSize: TextSize.Medium,
                  },
                ]}>
                {book.title}
              </Text>

              <Text
                style={[
                  styles.author,
                  {color: theme.text, fontSize: TextSize.Small},
                ]}>
                by {book.author}
              </Text>
            </View>
          </View>
          <View style={[styles.detailsContainer, {}]}>
            <>
              <Text
                style={[
                  styles.isbn,
                  {color: theme.text, fontSize: TextSize.Tiny},
                ]}>
                <Text style={styles.detailLabel}>ISBN10: </Text>
                {book.isbn10 || 'N/A'}
              </Text>
              <Text
                style={[
                  styles.isbn,
                  {color: theme.text, fontSize: TextSize.Tiny},
                ]}>
                <Text style={styles.detailLabel}>ISBN13: </Text>
                {book.isbn13 || 'N/A'}
              </Text>
              <Text
                style={[
                  styles.detailText,
                  {color: theme.text, fontSize: TextSize.Tiny},
                ]}>
                <Text style={styles.detailLabel}>Status:</Text>{' '}
                {book.BookStatus || 'N/A'}
              </Text>
              <Text
                style={[
                  styles.detailText,
                  {color: theme.text, fontSize: TextSize.Tiny},
                ]}>
                <Text style={styles.detailLabel}>Categories:</Text>{' '}
                {book.categories || 'N/A'}
              </Text>
              <Text
                style={[
                  styles.detailText,
                  {color: theme.text, fontSize: TextSize.Tiny},
                ]}>
                <Text style={styles.detailLabel}>Source:</Text>{' '}
                {book.source || 'N/A'}
              </Text>
              <Text
                style={[
                  styles.detailText,
                  {color: theme.text, fontSize: TextSize.Tiny},
                ]}>
                <Text style={styles.detailLabel}>Started reading:</Text>{' '}
                {book.startDate
                  ? format(new Date(book.startDate), 'MMMM dd, yyyy')
                  : 'N/A'}
              </Text>
              <Text
                style={[
                  styles.detailText,
                  {color: theme.text, fontSize: TextSize.Tiny},
                ]}>
                <Text style={styles.detailLabel}>Completed reading:</Text>{' '}
                {book.dateCompleted
                  ? format(new Date(book.dateCompleted), 'MMMM dd, yyyy')
                  : 'Not completed'}
              </Text>
            </>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                flexWrap: 'wrap', // Allows the text and button to wrap
              }}>
              <Text
                style={[
                  {
                    color: theme.text,
                    fontSize: TextSize.Tiny,
                    fontFamily: 'Poppins-Regular',
                    maxWidth: '90%', // Limit text width to make space for the button
                  },
                ]}>
                <Text style={styles.detailLabel}>
                  {buddy.userName}'s review:
                </Text>{' '}
                {book.review || 'N/A'}
              </Text>
            </View>

            {book.readCount > 0 && (
              <Text
                style={[
                  styles.detailText,
                  {
                    color: theme.text,
                    fontSize: TextSize.Tiny,
                    marginTop: hp(1),
                  },
                ]}>
                <Text style={styles.detailLabel}>Times Read:</Text>{' '}
                {book.readCount}
              </Text>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
};

export default BuddyTrackBook;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  bookImage: {
    width: 100,
    height: 150,
    marginRight: 20,
  },
  title: {
    // fontSize: TextSize.Medium,
    height: 'auto',
    width: wp(48),
    margin: hp(1),
    top: hp(1),
    flexShrink: 1,
  },
  author: {
    // fontSize: TextSize.Small,
    fontFamily: 'Poppins-Regular',
    marginHorizontal: hp(1),
    width: wp(48),
  },
  detailsContainer: {
    marginTop: 10,
  },
  isbn: {
    // fontSize: TextSize.Small,
    marginBottom: 5,
  },
  detailText: {
    // fontSize: TextSize.Small,
    fontFamily: 'Poppins-Regular',
    marginBottom: 5,
  },
  detailLabel: {
    fontFamily: 'Poppins-SemiBold',
  },
});
