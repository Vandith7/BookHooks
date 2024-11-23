import React, {useEffect, useState, useContext} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {ipv4} from '../assets/others/constants';
import {SocketContext} from '../context/SocketContext'; // Import SocketContext
import {ThemeContext} from '../context/ThemeContext';
import {format, isBefore, isToday, isYesterday, subDays} from 'date-fns';
import {useFocusEffect} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useChatContext} from '../context/ChatContext';

const ChatListsScreen = ({navigation, route}) => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null); // Store current user's data
  const [typingStatuses, setTypingStatuses] = useState({}); // Store typing statuses per chat
  const [searchQuery, setSearchQuery] = useState('');

  const {joinedChats, addChatToJoined} = useChatContext(); // Access joined chats from context
  const socket = useContext(SocketContext); // Access the socket from context
  const {theme} = useContext(ThemeContext);

  const fetchChats = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userResponse = await axios.get(`${ipv4}/user-api/current`, {
        headers: {Authorization: `Bearer ${token}`},
      });
      setUser(userResponse.data); // Set the current user's data

      const response = await axios.get(`${ipv4}/chat-api/chats`, {
        headers: {Authorization: `Bearer ${token}`},
      });
      setChats(response.data.data);
    } catch (error) {
      console.error(
        'Failed to fetch chats:',
        error.response?.data || error.message,
      );
    } finally {
      setLoading(false);
    }
  };
  // Initial fetch of chats
  // useEffect(() => {
  //   fetchChats();
  // }, []);

  // Reload chat when coming back to this screen
  useFocusEffect(
    React.useCallback(() => {
      console.log('useFocus');
      fetchChats();
    }, []), // Dependency on isFirstLoad
  );

  const handleSearchChange = text => {
    setSearchQuery(text);
  };

  const filteredChats = chats.filter(chat => {
    const participantToShow =
      chat.participants[1]._id === user.data._id
        ? chat.participants[0]
        : chat.participants[1];
    return participantToShow.userName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
  });
  // Listen for new messages, typing statuses, and unread counts via Socket.IO
  useEffect(() => {
    if (socket && user && chats) {
      chats.forEach(chat => {
        if (!joinedChats.includes(chat._id)) {
          socket.emit('join_chat', chat._id);
          addChatToJoined(chat._id); // Add to joined chats in context
        }
      });

      // Listen for new messages
      socket.on('receive_message', message => {
        setChats(prevChats => {
          const updatedChats = prevChats.map(chat => {
            const senderId = message.newMessage.sender;

            const isSenderInChat = chat.participants.some(
              participant => participant._id === senderId,
            );

            if (isSenderInChat) {
              return {
                ...chat,
                lastMessage: message.newMessage,
                unreadCount: {
                  ...chat.unreadCount,
                  [user.data._id]: message.unreadCount[user.data._id],
                },
              };
            }
            return chat;
          });

          return updatedChats;
        });
      });

      socket.on('message_read', data => {
        // Prevent multiple updates for the same message
        setChats(prevChats => {
          const updatedChats = prevChats.map(chat => {
            if (chat.lastMessage?._id === data.messageId) {
              if (chat.lastMessage.isRead !== data.isRead) {
                chat.lastMessage.isRead = data.isRead;
              }
            }
            return chat;
          });
          return updatedChats;
        });
      });

      socket.on('typing', data => {
        setTypingStatuses(prevStatuses => ({
          ...prevStatuses,
          [data.chatId]: `${data.userName} is typing...`,
        }));
      });

      socket.on('stop_typing', data => {
        setTypingStatuses(prevStatuses => ({
          ...prevStatuses,
          [data.chatId]: null,
        }));
      });

      return () => {
        socket.off('receive_message');
        socket.off('message_read');
        socket.off('typing');
        socket.off('stop_typing');
      };
    }
  }, [socket, user, chats, joinedChats, addChatToJoined]);

  const renderChatItem = ({item}) => {
    const currentUserId = user.data._id;
    console.log(item);
    // Determine which participant's profile image to show
    const participantToShow =
      item.participants[1]._id === currentUserId
        ? item.participants[0]
        : item.participants[1];

    const getFormattedTime = timestamp => {
      if (!timestamp) return '';

      const messageDate = new Date(timestamp);
      const currentDate = new Date();

      // Check if the message was sent today
      if (isToday(messageDate)) {
        return format(messageDate, 'hh:mm a'); // Show time if today
      }

      // Check if the message was sent yesterday
      if (isYesterday(messageDate)) {
        return 'Yesterday'; // Show "Yesterday" if it was yesterday
      }

      // If older than yesterday, show the full date
      return format(messageDate, 'MMM dd, yyyy'); // Show full date for messages older than yesterday
    };

    const isLastMessageByCurrentUser =
      item.lastMessage?.sender === currentUserId;

    return (
      <TouchableOpacity
        style={[styles.chatItem]}
        onPress={() =>
          navigation.navigate('ChatScreen', {
            chatId: item._id,
            user: participantToShow,
          })
        }>
        <Image
          source={
            participantToShow.profileImage
              ? {uri: participantToShow.profileImage}
              : require('../assets/images/default.jpg')
          }
          style={styles.profileImage}
        />
        <View style={styles.chatContent}>
          <View style={styles.messageContainer}>
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={[styles.chatTitle, {color: theme.text}]}>
              {participantToShow.userName}
            </Text>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              {isLastMessageByCurrentUser &&
                item.lastMessage.isRead !== undefined &&
                !typingStatuses[item._id] && ( // Add condition to check if typing status is not active
                  <View style={styles.readReceiptContainer}>
                    <Icon
                      name={item.lastMessage.isRead ? 'done-all' : 'done'}
                      size={16}
                      color={
                        item.lastMessage.isRead ? theme.primary : theme.text
                      }
                      style={styles.readReceiptIcon}
                    />
                  </View>
                )}
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[styles.lastMessage, {color: theme.text}]}>
                {typingStatuses[item._id] ||
                  item.lastMessage?.text ||
                  'No messages yet'}
              </Text>
            </View>
          </View>
          <View style={styles.unreadCountContainer}>
            <Text
              style={[
                styles.timeText,
                item.unreadCount[currentUserId]
                  ? {color: theme.primary}
                  : {color: theme.text},
              ]}>
              {getFormattedTime(item.lastMessage?.timestamp)}
            </Text>

            <Text
              style={[
                styles.unreadCountText,
                item.unreadCount[currentUserId]
                  ? {backgroundColor: theme.primary}
                  : {},
              ]}>
              {item.unreadCount[currentUserId] > 100
                ? '100+'
                : item.unreadCount[currentUserId] || null}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, {backgroundColor: theme.background}]}>
      {loading ? (
        <View
          style={[
            styles.loadingContainer,
            {backgroundColor: theme.background},
          ]}>
          <ActivityIndicator size="large" color={theme.text} />
          <Text style={[{color: theme.text, fontFamily: 'Poppins-Regular'}]}>
            Loading chats...
          </Text>
        </View>
      ) : chats.length === 0 ? (
        <View
          style={[
            styles.loadingContainer,
            {
              backgroundColor: theme.background,
              justifyContent: 'center',
              alignItems: 'center',
              flex: 1, // Take up the full height of the list when empty
            },
          ]}>
          <Text>
            <Icon name="chat" size={40} color={theme.text} />
          </Text>
          <Text
            style={{
              color: theme.text,
              fontFamily: 'Poppins-Regular',
              fontSize: 16,
              marginTop: 10,
              textAlign: 'center',
            }}>
            Start a chat and connect with new buddies!
          </Text>
          <Text
            style={{
              color: theme.text,
              fontFamily: 'Poppins-Regular',
              fontSize: 14,
              marginTop: 5,
              textAlign: 'center',
              paddingHorizontal: wp(6),
            }}>
            There are no messages at the moment. Your new chats will show up
            here.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.searchContainer}>
            <TextInput
              style={[
                styles.searchInput,
                {
                  backgroundColor: theme.card,
                  color: theme.text,
                  fontFamily: 'Poppins-SemiBold',
                },
              ]}
              placeholder="Search chats..."
              placeholderTextColor={theme.text}
              value={searchQuery}
              onChangeText={handleSearchChange}
            />
            <Icon
              name="search"
              size={24}
              color={theme.text}
              style={styles.searchIcon}
            />
          </View>
          <FlatList
            data={filteredChats}
            renderItem={renderChatItem}
            keyExtractor={item => item._id}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    bottom: hp(8),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: '2%',
    marginHorizontal: '2%',
    width: wp('98%'),
  },
  searchInput: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  searchIcon: {
    position: 'absolute',
    right: wp(4),
  },
  chatItem: {
    flexDirection: 'row',
    paddingVertical: hp(2),
    paddingHorizontal: wp(4),
  },
  profileImage: {
    width: wp(14),
    height: wp(14),
    borderRadius: wp(10),
    marginRight: wp(4),
  },
  chatContent: {
    flex: 1,
    flexDirection: 'row', // Align chat content in a row
    justifyContent: 'space-between', // Ensure space between message content and unread count
    alignItems: 'center',
  },
  messageContainer: {
    flex: 1, // Take up available space for message content
  },
  readReceiptContainer: {
    marginRight: wp(1),
  },
  unreadCountContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginTop: hp(0.1),
  },
  chatTitle: {
    fontSize: wp(4.5),
    maxWidth: '84%',
    fontFamily: 'Poppins-SemiBold',
  },
  lastMessage: {
    fontSize: wp(3.5),
    marginTop: hp(0.1),
    fontFamily: 'Poppins-Regular',
  },
  timeText: {
    fontSize: wp(3),
    marginTop: hp(0.6),
    marginBottom: hp(1),
    fontFamily: 'Poppins-Regular',
  },
  unreadCountText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: wp(2.6),
    padding: wp(1),
    paddingHorizontal: wp(3),
    borderRadius: wp(5),
  },
});

export default ChatListsScreen;
