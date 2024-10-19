import React, {useEffect, useState} from 'react';
import {Text, View, StyleSheet} from 'react-native';

const quotes = [
  'Welcome back, [name]! “A reader lives a thousand lives before he dies.”',
  'Hello, [name]! “So many books, so little time.”',
  'Glad to see you, [name]! “Books are a uniquely portable magic.”',
  '[name], dive into a new adventure! “A room without books is like a body without a soul.”',
  'Ready for another journey, [name]? “There is no friend as loyal as a book.”',
  '[name], let’s turn another page! “You can never get a cup of tea large enough or a book long enough to suit me.”',
  'Great to have you back, [name]! “Books are the mirrors of the soul.”',
  'Welcome, [name]! “The only thing that you absolutely have to know is the location of the library.”',
  'What’s next, [name]? “A book is a dream that you hold in your hand.”',
  '[name], let’s explore new worlds! “I have always imagined that Paradise will be a kind of library.”',
  'Hello, [name]! “The reading of all good books is like a conversation with the finest minds of past centuries.”',
  '[name], welcome to your next literary adventure! “A good book has no ending.”',
  '[name], every book is a new journey! “There is no friend as loyal as a book.”',
  'Welcome back, [name]! “Books are the quietest and most constant of friends; they are the most accessible and wisest of counselors, and the most patient of teachers.”',
  'Happy reading, [name]! “Books are a uniquely portable magic.”',
  '[name], your next great adventure awaits! “So many books, so little time.”',
  'Dive back in, [name]! “A book is a device to ignite the imagination.”',
  '[name], ready for another great read? “Books are a uniquely portable magic.”',
  'Welcome, [name]! “Books are the keys to wisdom’s treasure.”',
  '[name], every page is a new journey! “There is no frigate like a book to take us lands away.”',
  'Let’s begin, [name]! “Reading is to the mind what exercise is to the body.”',
  '[name], immerse yourself! “Books are a uniquely portable magic.”',
  'Welcome, [name]! “Books can be dangerous. The best ones should be labeled ‘This could change your life.’”',
  '[name], get ready to be inspired! “The world belongs to those who read.”',
];

const BookQuotes = ({firstName}) => {
  const [quote, setQuote] = useState('');

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    const personalizedQuote = quotes[randomIndex].replace('[name]', firstName);
    setQuote(personalizedQuote);
  }, [firstName]);

  return (
    <View style={styles.container}>
      <Text style={styles.quoteText}>{quote}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quoteText: {
    fontSize: 18,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default BookQuotes;
