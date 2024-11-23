//Almost working
import React, {useState, useEffect, useRef, useContext} from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableHighlight,
  ActivityIndicator,
  Pressable,
  Animated,
  TouchableOpacity,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';
import NetInfo from '@react-native-community/netinfo';
import Snackbar from 'react-native-snackbar'; // Import Snackbar
import {ipv4} from '../assets/others/constants'; // Replace with the actual path to constants file
import {ThemeContext} from '../context/ThemeContext';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import {format, isToday, isYesterday} from 'date-fns'; // Import date-fns functions
import Icon from 'react-native-vector-icons/MaterialIcons';

const ChatScreen = ({navigation, route}) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [user, setUser] = useState(null); // Store current user's data
  const [newMessagesIndicator, setNewMessagesIndicator] = useState(false); // Indicator for new messages
  const [inputHeight, setInputHeight] = useState(hp(8)); // Default height
  const [isTyping, setIsTyping] = useState(false); // Typing state
  const [typingTimeout, setTypingTimeout] = useState(null); // For managing debounce
  const [showDetails, setShowDetails] = React.useState(false);
  const [expandedMessageId, setExpandedMessageId] = useState(null);
  const [indicatorPosition] = useState(new Animated.Value(0)); // Default position
  const [indicatorOpacity] = useState(new Animated.Value(0));

  const maxHeight = hp(12);

  const {chatId} = route.params; // Receive chatId from navigation route params

  const flatListRef = useRef(); // Reference for FlatList
  const isAtBottom = useRef(true); // Flag to check if the user is at the bottom
  const {theme} = useContext(ThemeContext);

  // Fetch user data once when the component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const userResponse = await axios.get(`${ipv4}/user-api/current`, {
            headers: {Authorization: `Bearer ${token}`},
          });
          setUser(userResponse.data); // Set the current user's data
        }
        console.log('fetch data called');
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchData();
  }, []); // Empty dependency array to fetch only once on mount

  // Set up socket connection after user data is fetched
  useEffect(() => {
    if (user) {
      const socketConnection = io(`${ipv4}`);
      // Join the specific chat room
      socketConnection.emit('join_chat', chatId);

      // Listen for new messages only after user data is available
      socketConnection.on('receive_message', message => {
        if (user && message.sender !== user.data._id) {
          const messageExists = messages.some(
            existingMessage => existingMessage._id === message._id,
          );

          if (!messageExists) {
            setMessages(prevMessages => [message, ...prevMessages]);
            console.log('received', message);
            handleReadReceipt(chatId, message._id);

            // If the user is not at the bottom, show the new messages indicator
            if (!isAtBottom.current) {
              setNewMessagesIndicator(true);
            }
          }
        }
      });

      socketConnection.on('typing', data => {
        // Add a typing indicator message to the messages array
        setMessages(prevMessages => {
          const updatedMessages = prevMessages.filter(msg => !msg.isTyping);
          return [
            {isTyping: true, userName: data.userName},
            ...updatedMessages,
          ];
        });
      });

      socketConnection.on('stop_typing', () => {
        // Remove the typing indicator message
        setMessages(prevMessages => prevMessages.filter(msg => !msg.isTyping));
      });

      socketConnection.on('message_read', data => {
        const {messageId, isRead} = data;

        setMessages(prevMessages => {
          return prevMessages.map(msg => {
            if (msg._id === messageId) {
              return {
                ...msg,
                isRead, // Update the read status for the message
              };
            }
            return msg;
          });
        });
      });

      setSocket(socketConnection);

      // Cleanup socket connection when component unmounts
      return () => {
        socketConnection.disconnect();
      };
    }
  }, [user, chatId]); // Depend on user to set up socket after it's fetched

  useEffect(() => {
    if (newMessagesIndicator) {
      // Animate the position of the new message indicator
      Animated.parallel([
        Animated.timing(indicatorPosition, {
          toValue: 0, // Move the indicator up
          duration: 300, // Animation duration
          useNativeDriver: true, // Use native driver for performance
        }),
        Animated.timing(indicatorOpacity, {
          toValue: 1, // Fully visible
          duration: 300, // Animation duration
          useNativeDriver: true, // Use native driver for performance
        }),
      ]).start();
    } else {
      // Reset position when the indicator is no longer shown
      Animated.parallel([
        Animated.timing(indicatorPosition, {
          toValue: inputHeight + 32, // Move the indicator back down
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(indicatorOpacity, {
          toValue: 0, // Fully transparent
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [newMessagesIndicator, inputHeight]); // Trigger the effect when indicator state or inputHeight changes

  // Fetch chat messages after user is set
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const messagesResponse = await axios.get(
          `${ipv4}/chat-api/chats/${chatId}`,
          {
            headers: {Authorization: `Bearer ${token}`},
          },
        );
        setMessages(messagesResponse.data.data.messages); // Set messages data
        setLoading(false); // Stop loading once messages are fetched
        // scrollToBottom();
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    if (user) {
      fetchMessages();
    }
  }, [user, chatId]); // Fetch messages after user is available

  const scrollToBottom = () => {
    flatListRef.current.scrollToOffset({offset: 0, animated: true});
    setNewMessagesIndicator(false);

    Animated.timing(indicatorOpacity, {
      toValue: 100,
      duration: 150,
      useNativeDriver: true,
    }).start();

    Animated.timing(indicatorOpacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  // Handle sending a message
  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const isConnected = await NetInfo.fetch().then(state => state.isConnected);
    if (!isConnected) {
      Snackbar.show({
        text: 'No internet connection. Please check your connection.',
        duration: Snackbar.LENGTH_LONG,
        backgroundColor: '#B08968',
        textColor: '#FFFFFF',
      });
      return;
    }

    const token = await AsyncStorage.getItem('token');
    const messageData = {text: newMessage};

    try {
      // Send the message to the server
      const response = await axios.post(
        `${ipv4}/chat-api/chats/${chatId}/messages`,
        messageData,
        {headers: {Authorization: `Bearer ${token}`}},
      );

      // Get the new message data from the server response
      const serverMessage = response.data.data;

      // Add the current user's sender information to the message locally
      const newMessageWithSender = {
        ...serverMessage,
        sender: {_id: user.data._id}, // Include current user's _id
      };

      // Update messages state with the newly sent message
      setMessages(prevMessages => [newMessageWithSender, ...prevMessages]);

      // Emit the new message via socket for real-time updates
      socket.emit('send_message', {
        chatId,
        message: newMessageWithSender, // Include the full message with `messageId`
      });

      setNewMessage(''); // Clear the message input field
      scrollToBottom();
      setInputHeight(hp(8));
    } catch (error) {
      console.error('Error sending message:', error);

      Snackbar.show({
        text: 'Failed to send message. Please try again.',
        duration: Snackbar.LENGTH_LONG,
        backgroundColor: '#D32F2F',
        textColor: '#FFFFFF',
      });
    }
  };

  const handleTyping = text => {
    setNewMessage(text);

    if (typingTimeout) {
      clearTimeout(typingTimeout); // Clear the previous timeout
    }

    if (text.trim()) {
      // Emit typing event when user starts typing
      socket.emit('typing', {chatId: chatId, userName: user.data.userName});
    } else {
      // Emit stop_typing event when the input is empty
      socket.emit('stop_typing', {
        chatId: chatId,
        userName: user.data.userName,
      });
    }

    const timeout = setTimeout(() => {
      socket.emit('stop_typing', {chatId: chatId, userName: user.userName}); // Emit stop_typing event after delay
    }, 2000); // 2 second delay to detect stop typing

    setTypingTimeout(timeout); // Save timeout reference
  };

  // Render each message in the chat
  const MessageItem = React.memo(
    ({
      item,
      isExpanded,
      toggleMessageDetails,
      theme,
      user,
      handleReadReceipt,
    }) => {
      const isCurrentUser = item.sender && item.sender._id === user.data._id;

      if (item.isTyping) {
        // Render typing indicator
        return (
          <View
            style={[
              styles.message,
              styles.receivedMessage,
              {backgroundColor: theme.secondary},
            ]}>
            <Text
              style={[
                styles.messageText,
                {color: theme.text},
              ]}>{`${item.userName} is typing...`}</Text>
          </View>
        );
      }

      // Format the timestamp for time
      const messageTime = new Date(item.timestamp);
      const formattedTime = format(messageTime, 'hh:mm a');

      // Check if the date of the current message is different from the previous one
      const showDate =
        !messages[item.index + 1] ||
        new Date(messages[item.index + 1].timestamp).toDateString() !==
          messageTime.toDateString();

      const formattedDate = format(messageTime, 'MMMM dd, yyyy');

      if (!isCurrentUser && !item.isRead) {
        handleReadReceipt(chatId, item._id);
      }

      const readTime = item.updatedAt
        ? format(new Date(item.updatedAt), 'hh:mm a')
        : null;

      return (
        <View>
          {showDate && (
            <View style={styles.dateContainer}>
              <Text style={[styles.dateText, {color: theme.text}]}>
                {formattedDate}
              </Text>
            </View>
          )}
          <TouchableOpacity onPress={toggleMessageDetails}>
            <View
              style={[
                styles.message,
                isCurrentUser
                  ? [styles.sentMessage, {backgroundColor: theme.primary}]
                  : [
                      styles.receivedMessage,
                      {backgroundColor: theme.secondary},
                    ],
              ]}>
              <Text style={[styles.messageText, {color: theme.text}]}>
                {item.text}
              </Text>

              <View style={styles.messageStatusContainer}>
                <Text style={[styles.messageTime, {color: theme.text}]}>
                  {formattedTime}
                </Text>
                {isCurrentUser && (
                  <Icon
                    name={item.isRead ? 'done-all' : 'done'}
                    size={wp(4)}
                    color={theme.text}
                    style={styles.statusIcon}
                  />
                )}
              </View>

              {isExpanded && isCurrentUser && (
                <View style={styles.detailsContainer}>
                  <Text style={[styles.detailsText, {color: theme.text}]}>
                    {item.isRead ? `Seen at ${readTime}` : 'Not read yet'}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
      );
    },
  );

  const renderMessageItem = ({item, index}) => {
    const isExpanded = expandedMessageId === item._id;
    console.log(item);
    // Toggle expanded message when clicked
    const toggleMessageDetails = () => {
      setExpandedMessageId(isExpanded ? null : item._id);
    };

    return (
      <MessageItem
        item={item}
        isExpanded={isExpanded}
        toggleMessageDetails={toggleMessageDetails}
        theme={theme}
        user={user}
        handleReadReceipt={handleReadReceipt}
      />
    );
  };

  // Handle scroll events to detect if the user is at the bottom
  const handleScroll = event => {
    const contentOffsetY = event.nativeEvent.contentOffset.y;
    const contentHeight = event.nativeEvent.contentSize.height;
    const layoutHeight = event.nativeEvent.layoutMeasurement.height;

    // If the user is at the bottom
    if (contentOffsetY <= 20) {
      // At the top of the reversed list
      isAtBottom.current = true;
      setNewMessagesIndicator(false);
    } else {
      isAtBottom.current = false;
    }
  };

  const handleReadReceipt = async (chatId, messageId) => {
    try {
      socket.emit('read_receipt', {
        chatId,
        messageId,
        userId: user.data._id, // The ID of the user marking the message as read
      });
    } catch (error) {
      console.error('Error handling read receipt:', error);
    }
  };

  return (
    <View style={[styles.container, {backgroundColor: theme.card}]}>
      {/* Chat messages list */}
      {loading ? (
        <View style={[styles.loadingContainer, {backgroundColor: theme.card}]}>
          <ActivityIndicator size="large" color={theme.text} />
          <Text style={[{color: theme.text, fontFamily: 'Poppins-Regular'}]}>
            Loading chats...
          </Text>
        </View>
      ) : messages.length < 1 ? (
        <View
          style={[
            styles.loadingContainer,
            {
              backgroundColor: theme.card,
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
            Engage in a conversation and meet new buddies!
          </Text>
          <Text
            style={{
              color: theme.text,
              fontFamily: 'Poppins-Regular',
              fontSize: 14,
              marginTop: 5,
              textAlign: 'center',
            }}>
            No messages yet. Send the first one!
          </Text>
        </View>
      ) : (
        <FlatList
          style={{paddingHorizontal: wp(2)}}
          ref={flatListRef}
          data={messages}
          renderItem={renderMessageItem}
          keyExtractor={item => item._id.toString()} // Use unique key (message ID)
          showsVerticalScrollIndicator={false}
          inverted
          onScroll={handleScroll} // Detect scroll position
        />
      )}
      {/* New message indicator */}
      {newMessagesIndicator && (
        <Animated.View
          style={[
            styles.newMessageIndicator,
            {
              backgroundColor: theme.highlight,
              transform: [{translateY: indicatorPosition}], // Use translateY instead of bottom
              opacity: indicatorOpacity,
            },
          ]}>
          <Pressable onPress={scrollToBottom}>
            <Text style={[styles.newMessageText, {color: theme.background}]}>
              New messages arrived
            </Text>
          </Pressable>
        </Animated.View>
      )}

      {/* Input field and send button */}
      <View
        style={[styles.inputContainer, {backgroundColor: theme.background}]}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.primary,
              height: Math.min(inputHeight, maxHeight), // Ensure height doesn't exceed maxHeight
            },
          ]}
          value={newMessage}
          multiline
          onChangeText={handleTyping}
          placeholderTextColor={theme.text}
          placeholder="Type a message..."
          onContentSizeChange={event => {
            const newHeight = event.nativeEvent.contentSize.height + hp(2);
            setInputHeight(Math.min(newHeight, maxHeight)); // Limit the height
          }}
        />

        <TouchableHighlight
          style={[styles.sendButton, {backgroundColor: theme.highlight}]}
          onPress={sendMessage}>
          <Text
            style={{fontFamily: 'Poppins-SemiBold', color: theme.background}}>
            Send
          </Text>
        </TouchableHighlight>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    height: hp(84),
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateContainer: {
    alignItems: 'center',
    marginVertical: hp(2),
  },
  dateText: {
    fontSize: wp(3.8),
    fontFamily: 'Poppins-SemiBold',
    textTransform: 'uppercase',
  },
  message: {
    padding: wp(3),
    marginBottom: hp(1),
    borderRadius: 8,
    maxWidth: '75%',
  },
  messageTime: {
    fontSize: wp(3),
    textAlign: 'right', // Align to the right for sent messages
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007bff',
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#ddd',
  },
  messageText: {
    fontFamily: 'Poppins-Regular',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: hp(2),
  },
  input: {
    flex: 1,
    padding: wp(2),
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    fontFamily: 'Poppins-Regular',
    paddingHorizontal: wp(4),
  },
  sendButton: {
    marginLeft: wp(3),
    padding: wp(2),
    borderRadius: 10,
  },
  newMessageIndicator: {
    position: 'absolute',
    bottom: hp(14),
    alignSelf: 'center', // Center horizontally within the parent
    padding: 10,
    borderRadius: 20,
    zIndex: 1,
  },

  newMessageText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
  },

  typingIndicator: {
    position: 'absolute',
    bottom: 80,
    alignSelf: 'center', // Center horizontally within the parent
    padding: 10,
    borderRadius: 20,
    zIndex: 1,
  },

  messageStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    marginLeft: 4, // Spacing between time and icon
  },
});

export default ChatScreen;
