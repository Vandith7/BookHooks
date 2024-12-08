//Almost working
import React, {
  useState,
  useEffect,
  useRef,
  useContext,
  useCallback,
} from 'react';
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
import {SocketContext} from '../context/SocketContext';
import {useFocusEffect} from '@react-navigation/native';

const ChatScreen = ({navigation, route}) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null); // Store current user's data
  const [token, setToken] = useState(null);
  const [newMessagesIndicator, setNewMessagesIndicator] = useState(false); // Indicator for new messages
  const [inputHeight, setInputHeight] = useState(hp(8)); // Default height
  const [typingTimeout, setTypingTimeout] = useState(null); // For managing debounce
  const [indicatorPosition] = useState(new Animated.Value(0)); // Default position
  const [indicatorOpacity] = useState(new Animated.Value(0));

  const socket = useContext(SocketContext); // Access the socket from context

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
        setToken(token);
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
    if (user && socket) {
      // socket.emit('join_chat', chatId);

      // Listen for new messages only after user data is available
      socket.on('receive_message', message => {
        console.log(message);
        if (user && message.newMessage.sender !== user.data._id) {
          const messageExists = messages.some(
            existingMessage => existingMessage._id === message.newMessage._id,
          );

          if (!messageExists) {
            setMessages(prevMessages => [message.newMessage, ...prevMessages]);
            console.log('received', message);
            handleReadReceipt(chatId, message.newMessage._id);

            // If the user is not at the bottom, show the new messages indicator
            if (!isAtBottom.current) {
              setNewMessagesIndicator(true);
            }
          }
        }
      });

      socket.on('typing', data => {
        // Add a typing indicator message to the messages array
        setMessages(prevMessages => {
          const updatedMessages = prevMessages.filter(msg => !msg.isTyping);
          return [
            {isTyping: true, userName: data.userName},
            ...updatedMessages,
          ];
        });
      });

      socket.on('stop_typing', () => {
        // Remove the typing indicator message
        setMessages(prevMessages => prevMessages.filter(msg => !msg.isTyping));
      });

      socket.on('message_read', data => {
        const {messageId, isRead, updatedAt} = data;

        setMessages(prevMessages => {
          return prevMessages.map(msg => {
            if (msg._id === messageId) {
              return {
                ...msg,
                isRead, // Update the read status for the message
                updatedAt,
              };
            }
            return msg;
          });
        });
      });

      // setSocket(socketConnection);

      // Cleanup socket connection when component unmounts
      return () => {
        // socket.off('receive_message');
        // socket.off('typing');
        // socket.off('stop_typing');
        // socket.off('message_read');
      };
    }
  }, [socket, user, chatId]); // Depend on user to set up socket after it's fetched

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
  const fetchMessages = async () => {
    try {
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
  useFocusEffect(
    React.useCallback(() => {
      console.log('useFocus');
      if (user) {
        fetchMessages();
      }
    }, [user, chatId]), // Dependency on isFirstLoad
  );

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
    setNewMessage('');
    const messageData = {text: newMessage.trim()};

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
        lastMessage: newMessageWithSender,
      });

      setNewMessage(''); // Clear the message input field
      scrollToBottom();
      setInputHeight(hp(8));
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageData.text);
      Snackbar.show({
        text: 'Failed to send message. Please try again.',
        duration: Snackbar.LENGTH_LONG,
        backgroundColor: '#D32F2F',
        textColor: '#FFFFFF',
      });
    }
  };

  const handleTyping = useCallback(
    text => {
      setNewMessage(text);

      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }

      if (text.trim()) {
        socket.emit('typing', {chatId, userName: user.data.userName});
      } else {
        socket.emit('stop_typing', {chatId, userName: user.data.userName});
      }

      const timeout = setTimeout(() => {
        socket.emit('stop_typing', {chatId, userName: user.data.userName});
      }, 2000);

      setTypingTimeout(timeout);
    },
    [chatId, typingTimeout, user],
  );

  const handleDeleteSuccess = messageId => {
    // Filter out the deleted message from the messages array
    const updatedMessages = messages.filter(
      message => message._id !== messageId,
    );
    // Update the state or notify the parent component to re-render
    // For example, using a function passed as a prop to update the messages state in the parent:
    setMessages(updatedMessages);
  };

  // Render each message in the chat
  const MessageItem = React.memo(
    ({item, index, user, messages, handleReadReceipt, chatId, theme}) => {
      const isCurrentUser = item.sender && item.sender._id === user.data._id;
      const [showReadTime, setShowReadTime] = useState(false);
      const [showDeleteOption, setShowDeleteOption] = useState(false);
      const animatedWidth = useRef(new Animated.Value(0)).current; // Animation reference for expanding message
      const deleteAnimatedWidth = useRef(new Animated.Value(0)).current; // Animation reference for delete button

      const messageTime = new Date(item.timestamp);
      const formattedTime = format(messageTime, 'hh:mm a');
      const showDate =
        !messages[index + 1] ||
        new Date(messages[index + 1].timestamp).toDateString() !==
          messageTime.toDateString();
      const formattedDate = format(messageTime, 'MMMM dd, yyyy');

      if (!isCurrentUser && !item.isRead) {
        handleReadReceipt(chatId, item._id);
      }

      const handleShowSeenTime = () => {
        const shouldExpand = !showReadTime;
        const shouldShow = showDeleteOption;
        setShowReadTime(shouldExpand);
        if (shouldShow) {
          setShowDeleteOption(false);
        }
        // Animate the width change
        Animated.timing(animatedWidth, {
          toValue: shouldExpand ? wp(24) : 0, // Width for the "Read at" section
          duration: 200, // Animation duration
          useNativeDriver: false,
        }).start();
      };

      const handleLongPress = () => {
        const shouldShow = !showDeleteOption;
        setShowDeleteOption(shouldShow);

        // Animate the delete button width change
        Animated.timing(deleteAnimatedWidth, {
          toValue: shouldShow ? wp(24) : 0, // Width for the delete section
          duration: 200, // Animation duration
          useNativeDriver: false,
        }).start();
      };

      const handleDelete = () => {
        handleDeleteMessage(item._id); // Delete the message
        setShowDeleteOption(false); // Hide the delete option after deletion
      };

      const handleDeleteMessage = async messageId => {
        console.log('delete', messageId);
        try {
          const response = await axios.delete(
            `${ipv4}/chats/${chatId}/messages/${messageId}`,
            {headers: {Authorization: `Bearer ${token}`}},
          );

          if (response.status === 200) {
            // Successfully deleted the message, update the UI
            handleDeleteSuccess(messageId);
            Snackbar.show({
              text: 'Message unsent!',
              duration: Snackbar.LENGTH_LONG,
              backgroundColor: '#B08968',
              textColor: '#FFFFFF',
            });
          } else {
            // Handle failure (e.g., show an error message)
            console.log(
              'Failed to delete message:',
              response.data.message || 'Unknown error',
            );
          }
        } catch (error) {
          console.error('Error deleting message:', error);
        }
      };

      return (
        <View>
          {showDate && (
            <View style={styles.dateContainer}>
              <Text style={[styles.dateText, {color: theme.text}]}>
                {formattedDate}
              </Text>
            </View>
          )}

          <TouchableOpacity
            onPress={handleShowSeenTime}
            onLongPress={handleLongPress}>
            <View
              style={[
                styles.messageContainer,
                isCurrentUser ? styles.alignRight : styles.alignLeft,
              ]}>
              {/* Expandable "Read at" section */}
              {isCurrentUser && (
                <Animated.View
                  style={[
                    styles.readTimeContainer,
                    {
                      width: animatedWidth, // Width changes smoothly with animation
                      transform: [
                        {
                          scaleY: animatedWidth.interpolate({
                            inputRange: [0, wp(24)],
                            outputRange: [0, 1], // Scales in height, prevents crumbling
                          }),
                        },
                      ],
                      backgroundColor: theme.secondary,
                    },
                  ]}>
                  <Text style={[styles.readTimeText, {color: theme.text}]}>
                    {item.isRead ? 'Read at' : 'Not yet'}
                  </Text>
                  <Text style={[styles.readTimeText, {color: theme.text}]}>
                    {item.isRead
                      ? isToday(new Date(item.updatedAt)) // Check if the date is today
                        ? format(new Date(item.updatedAt), 'hh:mm a') // Show only time if today
                        : isYesterday(new Date(item.updatedAt)) // Check if the date is yesterday
                        ? `Yesterday at ${format(
                            new Date(item.updatedAt),
                            'hh:mm a',
                          )}` // Show 'Yesterday' and time if yesterday
                        : format(
                            new Date(item.updatedAt),
                            "MMM dd, yyyy 'at' hh:mm a",
                          ) // Show full date if older than yesterday
                      : 'Read'}
                  </Text>
                </Animated.View>
              )}

              {/* Delete Option */}
              {isCurrentUser && showDeleteOption && (
                <Animated.View style={{width: deleteAnimatedWidth}}>
                  <TouchableOpacity
                    style={[
                      styles.deleteContainer,
                      {backgroundColor: '#FF6B6B'},
                    ]}
                    onPress={handleDelete}>
                    <Text style={[styles.deleteText, {color: '#FFFFFF'}]}>
                      Unsend
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              )}

              {/* Message Bubble */}
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

                <View
                  style={[
                    styles.messageStatusContainer,
                    isCurrentUser
                      ? {justifyContent: 'flex-end'}
                      : {justifyContent: 'flex-start'},
                  ]}>
                  <Text style={[styles.messageTime, {color: theme.text}]}>
                    {formattedTime}
                  </Text>
                  {isCurrentUser && (
                    <Icon
                      name={item.isRead ? 'done-all' : 'done'}
                      size={20}
                      color={theme.text}
                      style={styles.statusIcon}
                    />
                  )}
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      );
    },
  );
  // Main renderMessageItem function that now uses MessageItem as a component
  const renderMessageItem = useCallback(
    ({item, index}) => {
      if (item.isTyping) {
        return (
          <View
            style={[
              styles.message,
              styles.receivedMessage,
              {backgroundColor: theme.secondary},
            ]}>
            <Text style={[styles.messageText, {color: theme.text}]}>
              {`${item.userName} is typing...`}
            </Text>
          </View>
        );
      }

      return (
        <MessageItem
          item={item}
          index={index}
          user={user}
          messages={messages}
          handleReadReceipt={handleReadReceipt}
          chatId={chatId}
          theme={theme}
        />
      );
    },
    [messages, user, theme, handleReadReceipt, chatId],
  );

  // Handle scroll events to detect if the user is at the bottom
  const handleScroll = event => {
    const contentOffsetY = event.nativeEvent.contentOffset.y;

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
    if (socket) {
      // Ensure socket is initialized before emitting
      try {
        socket.emit('read_receipt', {
          chatId,
          messageId,
          userId: user.data._id,
        });
      } catch (error) {
        console.error('Error handling read receipt:', error);
      }
    } else {
      console.error('Socket is not initialized yet');
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
          keyExtractor={(item, index) => index.toString()}
          showsVerticalScrollIndicator={false}
          inverted
          onScroll={handleScroll} // Detect scroll position
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
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
    fontFamily: 'Poppins-Regular',
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
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alignRight: {
    justifyContent: 'flex-end',
  },
  alignLeft: {
    justifyContent: 'flex-start',
  },
  readTimeContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    height: hp(8),
    overflow: 'hidden',
    marginRight: wp(1),
    marginBottom: hp(1),
  },
  readTimeText: {
    fontSize: wp(2.8),
    fontFamily: 'Poppins-Regular',
    textAlign: 'center',
  },
  deleteContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    height: hp(8),
    overflow: 'hidden',
    marginRight: wp(1),
    marginBottom: hp(1),
  },
  deleteText: {
    fontSize: wp(2.8),
    fontFamily: 'Poppins-SemiBold',
    textAlign: 'center',
  },
});

export default ChatScreen;
