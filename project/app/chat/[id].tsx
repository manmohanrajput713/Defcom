// import React, { useEffect, useState, useRef, useCallback } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   FlatList,
//   StyleSheet,
//   KeyboardAvoidingView,
//   Platform,
//   ActivityIndicator,
//   Alert,
//   Keyboard,
// } from 'react-native';
// import type { KeyboardEventName, LayoutChangeEvent } from 'react-native';
// import { useLocalSearchParams, useRouter } from 'expo-router';
// import { ArrowLeft, Phone, Video, Send, Check } from 'lucide-react-native';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { supabase } from '@/lib/supabase';
// import { encryptMessage, decryptMessage } from '@/lib/encryption';
// import { useAuth } from '@/contexts/AuthContext';

// interface Message {
//   id: string;
//   content: string;
//   ciphertext?: string | null;
//   sender_id: string;
//   created_at: string;
//   read: boolean;
// }

// export default function ChatScreen() {
//   const { id } = useLocalSearchParams<{ id: string }>();
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [newMessage, setNewMessage] = useState('');
//   const [otherUser, setOtherUser] = useState<any>(null);
//   const [loading, setLoading] = useState(true);
//   const [sending, setSending] = useState(false);
//   const [keyboardVisible, setKeyboardVisible] = useState(false);
//   const [headerHeight, setHeaderHeight] = useState(0);
//   const { session } = useAuth();
//   const router = useRouter();
//   const flatListRef = useRef<FlatList>(null);
//   const insets = useSafeAreaInsets();
//   const keyboardShowEvent: KeyboardEventName =
//     Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
//   const keyboardHideEvent: KeyboardEventName =
//     Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
//   const safeAreaBottom = insets.bottom;
//   const inputPaddingBottom =
//     keyboardVisible
//       ? 12
//       : safeAreaBottom > 0
//         ? safeAreaBottom
//         : 0;
//   const listBottomPadding = 16 + (!keyboardVisible ? safeAreaBottom : 0);
//   const keyboardVerticalOffset =
//     Platform.OS === 'ios' ? headerHeight : 0;
//   const markMessagesAsRead = useCallback(async (messageIds: string[]) => {
//     const uniqueUnreadIds = Array.from(new Set(messageIds)).filter(Boolean);

//     if (!uniqueUnreadIds.length) {
//       return;
//     }

//     let stateChanged = false;

//     setMessages((prev) =>
//       prev.map((message) => {
//         if (uniqueUnreadIds.includes(message.id) && !message.read) {
//           stateChanged = true;
//           return { ...message, read: true };
//         }

//         return message;
//       })
//     );

//     if (!stateChanged) {
//       return;
//     }

//     try {
//       await supabase
//         .from('messages')
//         .update({ read: true })
//         .in('id', uniqueUnreadIds);
//     } catch (error) {
//       console.error('Failed to mark messages as read', error);
//     }
//   }, []);
//   const handleHeaderLayout = useCallback(
//     ({ nativeEvent }: LayoutChangeEvent) => {
//       const { height } = nativeEvent.layout;
//       setHeaderHeight((current) =>
//         Math.abs(current - height) < 1 ? height : height
//       );
//     },
//     []
//   );

//   useEffect(() => {
//     const showSub = Keyboard.addListener(keyboardShowEvent, () => {
//       setKeyboardVisible(true);
//       requestAnimationFrame(() =>
//         flatListRef.current?.scrollToEnd({ animated: true })
//       );
//     });
//     const hideSub = Keyboard.addListener(keyboardHideEvent, () => {
//       setKeyboardVisible(false);
//       requestAnimationFrame(() =>
//         flatListRef.current?.scrollToEnd({ animated: true })
//       );
//     });

//     return () => {
//       showSub.remove();
//       hideSub.remove();
//     };
//   }, [keyboardShowEvent, keyboardHideEvent]);

//   useEffect(() => {
//     if (session?.user && id) {
//       loadChatData();

//       const channel = supabase
//         .channel(`messages:${id}`)
//         .on(
//           'postgres_changes',
//           {
//             event: 'INSERT',
//             schema: 'public',
//             table: 'messages',
//             filter: `conversation_id=eq.${id}`,
//           },
//           async (payload) => {
//             const incoming = payload.new as Message;
//             const decryptedContent = await decryptMessage(
//               incoming.ciphertext || incoming.content
//             );

//             setMessages((prev) => [
//               ...prev,
//               {
//                 ...incoming,
//                 read: !!incoming.read,
//                 content: decryptedContent,
//               },
//             ]);
//           }
//         )
//         .on(
//           'postgres_changes',
//           {
//             event: 'UPDATE',
//             schema: 'public',
//             table: 'messages',
//             filter: `conversation_id=eq.${id}`,
//           },
//           (payload) => {
//             const updated = payload.new as Message;
//             setMessages((prev) =>
//               prev.map((message) =>
//                 message.id === updated.id
//                   ? { ...message, read: updated.read }
//                   : message
//               )
//             );
//           }
//         )
//         .subscribe();

//       return () => {
//         supabase.removeChannel(channel);
//       };
//     }
//   }, [session, id]);

//   useEffect(() => {
//     if (!session?.user?.id) {
//       return;
//     }

//     const unreadIds = messages
//       .filter(
//         (message) =>
//           message.sender_id !== session.user.id && !message.read
//       )
//       .map((message) => message.id);

//     if (unreadIds.length) {
//       markMessagesAsRead(unreadIds);
//     }
//   }, [messages, session?.user?.id, markMessagesAsRead]);

//   const loadChatData = async () => {
//     if (!session?.user || !id) return;

//     const { data: participants } = await supabase
//       .from('conversation_participants')
//       .select('user_id')
//       .eq('conversation_id', id)
//       .neq('user_id', session.user.id)
//       .limit(1)
//       .maybeSingle();

//     if (participants) {
//       const { data: user } = await supabase
//         .from('profiles')
//         .select('*')
//         .eq('id', participants.user_id)
//         .single();

//       setOtherUser(user);
//     }

//     const { data: messagesData } = await supabase
//       .from('messages')
//       .select('*')
//       .eq('conversation_id', id)
//       .order('created_at', { ascending: true });

//     if (messagesData) {
//       const decrypted = await Promise.all(
//         (messagesData as any[]).map(async (raw) => {
//           const ciphertext =
//             typeof raw?.ciphertext === 'string' && raw.ciphertext.length > 0
//               ? raw.ciphertext
//               : raw?.content ?? '';
//           return {
//             ...(raw as Message),
//             read: !!raw.read,
//             content: await decryptMessage(ciphertext),
//           } as Message;
//         })
//       );
//       setMessages(decrypted);
//     }

//     setLoading(false);
//   };

//   const sendMessage = async () => {
//     if (!newMessage.trim() || !session?.user || !id) return;

//     if (!otherUser?.id) {
//       await loadChatData();
//     }

//     if (!otherUser?.id) {
//       Alert.alert('Error', 'Unable to determine the recipient for this chat.');
//       return;
//     }

//     setSending(true);
//     const messageContent = newMessage.trim();
//     setNewMessage('');
//     const encryptedContent = await encryptMessage(messageContent);

//     const baseMessagePayload: Record<string, any> = {
//       conversation_id: id,
//       sender_id: session.user.id,
//       content: '[encrypted]',
//       ciphertext: encryptedContent,
//       read: false,
//     };

//     try {
//       const attemptInsert = async (payload: Record<string, any>) => {
//         const { error } = await supabase.from('messages').insert(payload);
//         if (error) {
//           throw error;
//         }
//       };

//       const payloadAttempts: Record<string, any>[] = [
//         {
//           ...baseMessagePayload,
//           sender: session.user.id,
//           recipient: otherUser.id,
//         },
//         { ...baseMessagePayload },
//         (() => {
//           const fallbackPayload: Record<string, any> = {
//             ...baseMessagePayload,
//             content: encryptedContent,
//           };
//           delete fallbackPayload.ciphertext;
//           return fallbackPayload;
//         })(),
//       ];

//       let lastError: any = null;
//       let sent = false;

//       for (const payload of payloadAttempts) {
//         try {
//           await attemptInsert(payload);
//           sent = true;
//           break;
//         } catch (error) {
//           lastError = error;
//         }
//       }

//       if (!sent && lastError) {
//         throw lastError;
//       }

//       const { error: updateError } = await supabase
//         .from('conversations')
//         .update({ updated_at: new Date().toISOString() })
//         .eq('id', id);

//       if (updateError) {
//         throw updateError;
//       }
//     } catch (error: any) {
//       setNewMessage(messageContent);
//       Alert.alert(
//         'Error',
//         error?.message || 'Failed to send message. Please try again.'
//       );
//     } finally {
//       setSending(false);
//     }
//   };

//   const renderMessage = ({ item }: { item: Message }) => {
//     const isOwnMessage = item.sender_id === session?.user.id;

//     return (
//       <View
//         style={[
//           styles.messageContainer,
//           isOwnMessage ? styles.ownMessage : styles.otherMessage,
//         ]}
//       >
//         <View
//           style={[
//             styles.messageBubble,
//             isOwnMessage ? styles.ownBubble : styles.otherBubble,
//           ]}
//         >
//           <Text
//             style={[
//               styles.messageText,
//               isOwnMessage ? styles.ownText : styles.otherText,
//             ]}
//           >
//             {item.content}
//           </Text>
//           <View
//             style={[
//               styles.messageMeta,
//               isOwnMessage ? styles.ownMeta : styles.otherMeta,
//             ]}
//           >
//             <Text
//               style={[
//                 styles.messageTime,
//                 isOwnMessage ? styles.ownTime : styles.otherTime,
//               ]}
//             >
//               {new Date(item.created_at).toLocaleTimeString([], {
//                 hour: '2-digit',
//                 minute: '2-digit',
//               })}
//             </Text>
//             {isOwnMessage && item.read && (
//               <Check
//                 size={14}
//                 color="rgba(255, 255, 255, 0.85)"
//                 style={styles.messageStatusIcon}
//               />
//             )}
//           </View>
//         </View>
//       </View>
//     );
//   };

//   if (loading) {
//     return (
//       <View style={styles.centered}>
//         <ActivityIndicator size="large" color="#007AFF" />
//       </View>
//     );
//   }

//   return (
//     <KeyboardAvoidingView
//       style={styles.container}
//       behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//       keyboardVerticalOffset={keyboardVerticalOffset}
//     >
//       <View style={styles.header} onLayout={handleHeaderLayout}>
//         <TouchableOpacity
//           style={styles.backButton}
//           onPress={() => router.back()}
//         >
//           <ArrowLeft size={24} color="#007AFF" />
//         </TouchableOpacity>
//         <View style={styles.headerInfo}>
//           <View style={styles.headerAvatar}>
//             <Text style={styles.headerAvatarText}>
//               {otherUser?.display_name?.charAt(0).toUpperCase() || '?'}
//             </Text>
//           </View>
//           <Text style={styles.headerTitle}>
//             {otherUser?.display_name || 'Chat'}
//           </Text>
//         </View>
//         <View style={styles.headerActions}>
//           <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
//             <Phone size={22} color="#007AFF" />
//           </TouchableOpacity>
//           <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
//             <Video size={22} color="#007AFF" />
//           </TouchableOpacity>
//         </View>
//       </View>

//       <FlatList
//         ref={flatListRef}
//         data={messages}
//         renderItem={renderMessage}
//         keyExtractor={(item) => item.id}
//         style={styles.messagesWrapper}
//         contentContainerStyle={[
//           styles.messagesList,
//           { paddingBottom: listBottomPadding },
//         ]}
//         onContentSizeChange={() =>
//           flatListRef.current?.scrollToEnd({ animated: true })
//         }
//         keyboardShouldPersistTaps="handled"
//         ListEmptyComponent={
//           <View style={styles.emptyContainer}>
//             <Text style={styles.emptyText}>No messages yet</Text>
//             <Text style={styles.emptySubtext}>Start the conversation!</Text>
//           </View>
//         }
//       />

//       <View
//         style={[
//           styles.inputContainer,
//           { paddingBottom: inputPaddingBottom },
//         ]}
//       >
//         <TextInput
//           style={styles.input}
//           value={newMessage}
//           onChangeText={setNewMessage}
//           placeholder="Type a message..."
//           multiline
//           maxLength={1000}
//           onFocus={() => flatListRef.current?.scrollToEnd({ animated: true })}
//         />
//         <TouchableOpacity
//           style={[
//             styles.sendButton,
//             (!newMessage.trim() || sending) && styles.sendButtonDisabled,
//           ]}
//           onPress={sendMessage}
//           disabled={!newMessage.trim() || sending}
//         >
//           {sending ? (
//             <ActivityIndicator size="small" color="#fff" />
//           ) : (
//             <Send size={20} color="#fff" />
//           )}
//         </TouchableOpacity>
//       </View>
//     </KeyboardAvoidingView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f9fafb',
//   },
//   centered: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#fff',
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     paddingHorizontal: 16,
//     paddingTop: 60,
//     paddingBottom: 12,
//     backgroundColor: '#fff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#e5e7eb',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.05,
//     shadowRadius: 2,
//     elevation: 2,
//   },
//   backButton: {
//     width: 40,
//     height: 40,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   headerInfo: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   headerAvatar: {
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     backgroundColor: '#007AFF',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 8,
//   },
//   headerAvatarText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   headerTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#1a1a1a',
//   },
//   headerActions: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 8,
//   },
//   iconButton: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     alignItems: 'center',
//     justifyContent: 'center',
//     backgroundColor: '#f0f4ff',
//   },
//   messagesList: {
//     flexGrow: 1,
//     paddingHorizontal: 16,
//     paddingTop: 16,
//     paddingBottom: 16,
//   },
//   messagesWrapper: {
//     flex: 1,
//   },
//   messageContainer: {
//     marginBottom: 12,
//   },
//   ownMessage: {
//     alignItems: 'flex-end',
//   },
//   otherMessage: {
//     alignItems: 'flex-start',
//   },
//   messageBubble: {
//     maxWidth: '75%',
//     paddingHorizontal: 14,
//     paddingVertical: 10,
//     borderRadius: 18,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//     elevation: 1,
//   },
//   ownBubble: {
//     backgroundColor: '#007AFF',
//     borderBottomRightRadius: 6,
//   },
//   otherBubble: {
//     backgroundColor: '#fff',
//     borderBottomLeftRadius: 6,
//     borderWidth: 1,
//     borderColor: '#e5e7eb',
//   },
//   messageText: {
//     fontSize: 16,
//     lineHeight: 20,
//     marginBottom: 4,
//   },
//   ownText: {
//     color: '#fff',
//   },
//   otherText: {
//     color: '#1a1a1a',
//   },
//   messageTime: {
//     fontSize: 11,
//   },
//   ownTime: {
//     color: 'rgba(255, 255, 255, 0.7)',
//   },
//   otherTime: {
//     color: '#999',
//   },
//   messageMeta: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 2,
//   },
//   ownMeta: {
//     justifyContent: 'flex-end',
//     alignSelf: 'flex-end',
//   },
//   otherMeta: {
//     justifyContent: 'flex-start',
//     alignSelf: 'flex-start',
//   },
//   messageStatusIcon: {
//     marginLeft: 6,
//   },
//   inputContainer: {
//     flexDirection: 'row',
//     alignItems: 'flex-end',
//     paddingHorizontal: 16,
//     paddingTop: 12,
//     paddingBottom: 12,
//     backgroundColor: '#fff',
//     borderTopWidth: 1,
//     borderTopColor: '#e5e7eb',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: -1 },
//     shadowOpacity: 0.05,
//     shadowRadius: 2,
//     elevation: 3,
//   },
//   input: {
//     flex: 1,
//     minHeight: 42,
//     maxHeight: 100,
//     borderWidth: 1,
//     borderColor: '#e5e7eb',
//     borderRadius: 22,
//     paddingHorizontal: 18,
//     paddingVertical: 11,
//     fontSize: 16,
//     backgroundColor: '#fff',
//     marginRight: 10,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.05,
//     shadowRadius: 2,
//     elevation: 1,
//   },
//   sendButton: {
//     width: 42,
//     height: 42,
//     borderRadius: 21,
//     backgroundColor: '#007AFF',
//     justifyContent: 'center',
//     alignItems: 'center',
//     shadowColor: '#007AFF',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.3,
//     shadowRadius: 3,
//     elevation: 3,
//   },
//   sendButtonDisabled: {
//     opacity: 0.4,
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingVertical: 60,
//   },
//   emptyText: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#999',
//     marginBottom: 4,
//   },
//   emptySubtext: {
//     fontSize: 14,
//     color: '#999',
//   },
// });

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Keyboard,
  Image,
} from 'react-native';
import type { KeyboardEventName, LayoutChangeEvent } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Phone, Video, Send } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import {
  encryptMessage,
  decryptMessage,
  DESTROYED_MESSAGE_PLACEHOLDER,
} from '@/lib/encryption';
import { useAuth } from '@/contexts/AuthContext';
import { getAvatarSource } from '@/components/AvatarPicker';

// WebRTC calling only works on native platforms
const isNative = Platform.OS !== 'web';
let useCall: (() => { startCall: (conversationId: string, calleeId: string, callType: 'audio' | 'video') => Promise<void> }) | null = null;
if (isNative) {
  useCall = require('@/contexts/CallContext').useCall;
}

interface Message {
  id: string;
  content: string;
  ciphertext?: string | null;
  sender_id: string;
  created_at: string;
  read: boolean;
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState<any>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const partnerIdRef = useRef<string | null>(null);
  const otherUserRef = useRef<any>(null);
  const messagesRef = useRef<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const { session } = useAuth();
  const callContext = isNative && useCall ? useCall() : null;
  const startCall = callContext?.startCall;
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();
  const updateMessages = useCallback(
    (updater: (prev: Message[]) => Message[]) => {
      setMessages((prev) => {
        const next = updater(prev);
        messagesRef.current = next;
        return next;
      });
    },
    []
  );
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const mergeMessages = useCallback(
    (existing: Message[], incoming: Message[]) => {
      if (!existing.length) {
        return incoming;
      }

      const messageMap = new Map<string, Message>();
      for (const message of existing) {
        messageMap.set(message.id, message);
      }

      for (const message of incoming) {
        const current = messageMap.get(message.id);
        if (
          current &&
          current.content !== DESTROYED_MESSAGE_PLACEHOLDER &&
          message.content === DESTROYED_MESSAGE_PLACEHOLDER
        ) {
          messageMap.set(message.id, {
            ...message,
            content: current.content,
          });
        } else {
          messageMap.set(message.id, message);
        }
      }

      return Array.from(messageMap.values()).sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    },
    []
  );

  const markMessagesAsRead = useCallback(
    async (messageIds: string[]) => {
      if (!messageIds.length) {
        return;
      }

      const uniqueUnreadIds = Array.from(new Set(messageIds)).filter(Boolean);
      if (!uniqueUnreadIds.length) {
        return;
      }

      // Mark messages as read in local state
      updateMessages((prev) =>
        prev.map((message) =>
          uniqueUnreadIds.includes(message.id) ? { ...message, read: true } : message
        )
      );

      // Update read status in database
      try {
        await supabase
          .from('messages')
          .update({ read: true })
          .in('id', uniqueUnreadIds);
      } catch (error) {
        console.error('[markMessagesAsRead] Failed to update read status:', error);
      }
    },
    [updateMessages]
  );
  useEffect(() => {
    partnerIdRef.current = partnerId;
  }, [partnerId]);
  useEffect(() => {
    otherUserRef.current = otherUser;
  }, [otherUser]);

  useEffect(() => {
    if (!session?.user?.id) {
      return;
    }

    const unreadIds = messages
      .filter(
        (message) =>
          message.sender_id !== session.user.id && !message.read
      )
      .map((message) => message.id);

    if (unreadIds.length) {
      markMessagesAsRead(unreadIds);
    }
  }, [messages, session?.user?.id, markMessagesAsRead]);

  const ensurePartnerDetails = useCallback(async () => {
    if (!session?.user || !id) {
      return;
    }

    if (partnerIdRef.current && otherUserRef.current?.id) {
      return;
    }

    const { data: participants } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', id)
      .neq('user_id', session.user.id)
      .limit(1)
      .maybeSingle();

    if (!participants?.user_id) {
      return;
    }

    if (!partnerIdRef.current) {
      partnerIdRef.current = participants.user_id;
      setPartnerId(participants.user_id);
    }

    if (!otherUserRef.current?.id) {
      const { data: user } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', participants.user_id)
        .single();

      if (user) {
        otherUserRef.current = user;
        setOtherUser(user);
      }
    }
  }, [session?.user?.id, id]);
  const keyboardShowEvent: KeyboardEventName =
    Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
  const keyboardHideEvent: KeyboardEventName =
    Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
  const safeAreaBottom = insets.bottom;
  const inputPaddingBottom =
    keyboardVisible
      ? 12
      : safeAreaBottom > 0
        ? safeAreaBottom
        : 0;
  const listBottomPadding = 16 + (!keyboardVisible ? safeAreaBottom : 0);
  const keyboardVerticalOffset =
    Platform.OS === 'ios' ? headerHeight : 0;
  const handleHeaderLayout = useCallback(
    ({ nativeEvent }: LayoutChangeEvent) => {
      const { height } = nativeEvent.layout;
      setHeaderHeight((current) =>
        Math.abs(current - height) < 1 ? height : height
      );
    },
    []
  );

  useEffect(() => {
    const showSub = Keyboard.addListener(keyboardShowEvent, () => {
      setKeyboardVisible(true);
      requestAnimationFrame(() =>
        flatListRef.current?.scrollToEnd({ animated: true })
      );
    });
    const hideSub = Keyboard.addListener(keyboardHideEvent, () => {
      setKeyboardVisible(false);
      requestAnimationFrame(() =>
        flatListRef.current?.scrollToEnd({ animated: true })
      );
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardShowEvent, keyboardHideEvent]);

  useEffect(() => {
    if (session?.user && id) {
      loadChatData();

      const channel = supabase
        .channel(`messages:${id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${id}`,
          },
          async (payload) => {
            const incoming = payload.new as Message;
            const remoteUserId =
              incoming.sender_id === session.user.id
                ? partnerIdRef.current ?? otherUserRef.current?.id ?? ''
                : incoming.sender_id;

            let decryptedContent = '[encrypted]';
            if (remoteUserId.length > 0) {
              try {
                decryptedContent = await decryptMessage(
                  incoming.ciphertext || incoming.content,
                  {
                    conversationId: id,
                    localUserId: session.user.id,
                    remoteUserId,
                    senderIsLocal: incoming.sender_id === session.user.id,
                  }
                );
              } catch {
                console.info('[Realtime] Message could not be decrypted, marking destroyed:', {
                  messageId: incoming.id,
                });
                decryptedContent = DESTROYED_MESSAGE_PLACEHOLDER;
              }
            }

            const existingMessage = messagesRef.current.find(
              (msg) => msg.id === incoming.id
            );
            const newMsg: Message = {
              ...incoming,
              content:
                decryptedContent === DESTROYED_MESSAGE_PLACEHOLDER &&
                  existingMessage &&
                  existingMessage.content !== DESTROYED_MESSAGE_PLACEHOLDER
                  ? existingMessage.content
                  : decryptedContent,
            };

            updateMessages((prev) => {
              const alreadyExists = prev.some((msg) => msg.id === newMsg.id);
              if (alreadyExists) {
                return prev.map((msg) => (msg.id === newMsg.id ? newMsg : msg));
              }
              return [...prev, newMsg];
            });

            if (incoming.sender_id !== session.user.id && !incoming.read) {
              await supabase
                .from('messages')
                .update({ read: true })
                .eq('id', incoming.id);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${id}`,
          },
          (payload) => {
            const updated = payload.new as Message;
            updateMessages((prev) =>
              prev.map((msg) => (msg.id === updated.id ? { ...msg, read: updated.read } : msg))
            );
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [session?.user?.id, id]);

  const loadChatData = async (options: { preserveRecent?: boolean } = {}) => {
    const preserveRecent = options.preserveRecent ?? false;

    if (!session?.user || !id) return;

    const { data: participants } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', id)
      .neq('user_id', session.user.id)
      .limit(1)
      .maybeSingle();

    if (participants) {
      if (participants.user_id) {
        partnerIdRef.current = participants.user_id;
        setPartnerId(participants.user_id);
      }
      const { data: user } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', participants.user_id)
        .single();

      if (user) {
        otherUserRef.current = user;
      }
      setOtherUser(user);
    }

    const { data: messagesData } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    if (messagesData) {
      const resolvedPartnerId =
        participants?.user_id ??
        partnerIdRef.current ??
        otherUserRef.current?.id ??
        '';

      // Decrypt messages SEQUENTIALLY to maintain ratchet state consistency
      const decrypted: Message[] = [];
      console.log(`[loadChatData] Decrypting ${messagesData.length} messages sequentially...`);

      for (const raw of messagesData as any[]) {
        const existingMessage = messagesRef.current.find(
          (msg) => msg.id === raw.id
        );

        try {
          const ciphertext =
            typeof raw?.ciphertext === 'string' && raw.ciphertext.length > 0
              ? raw.ciphertext
              : raw?.content ?? '';
          if (__DEV__ && typeof ciphertext === 'string') {
            console.log('[loadChatData] Ciphertext preview:', ciphertext.slice(0, 64));
          }
          const isLocalSender = raw?.sender_id === session.user.id;
          const remoteUserId = isLocalSender
            ? resolvedPartnerId
            : raw?.sender_id ?? resolvedPartnerId;

          console.log('[loadChatData] Decrypting message:', {
            messageId: raw.id,
            isLocalSender,
            hasResolvedPartner: !!resolvedPartnerId,
            remoteUserId,
            hasCiphertext: !!ciphertext && ciphertext !== '[encrypted]',
          });

          if (!remoteUserId) {
            console.warn('[loadChatData] No remote user ID, showing as encrypted');
            decrypted.push({
              ...(raw as Message),
              content: '[encrypted]',
            } as Message);
            continue;
          }

          const decryptedContent = await decryptMessage(ciphertext, {
            conversationId: id,
            localUserId: session.user.id,
            remoteUserId,
            senderIsLocal: isLocalSender,
          });

          console.log('[loadChatData] Message decrypted successfully:', raw.id);
          decrypted.push({
            ...(raw as Message),
            content: decryptedContent,
          } as Message);
        } catch {
          console.info('[loadChatData] Message could not be decrypted, marking destroyed:', {
            messageId: raw.id,
          });

          if (
            preserveRecent &&
            existingMessage &&
            existingMessage.content !== DESTROYED_MESSAGE_PLACEHOLDER
          ) {
            decrypted.push({
              ...(raw as Message),
              content: existingMessage.content,
            } as Message);
          } else {
            decrypted.push({
              ...(raw as Message),
              content: DESTROYED_MESSAGE_PLACEHOLDER,
            } as Message);
          }
        }
      }

      console.log(
        `[loadChatData] Decryption complete: ${decrypted.filter((m) => !m.content.startsWith('[')).length
        }/${decrypted.length} successful`
      );
      const mergedMessages = preserveRecent
        ? mergeMessages(messagesRef.current, decrypted)
        : decrypted;
      updateMessages(() => mergedMessages);

      const unreadMessages = decrypted.filter(
        (msg) => msg.sender_id !== session.user.id && !msg.read
      );

      if (unreadMessages.length > 0) {
        await supabase
          .from('messages')
          .update({ read: true })
          .in(
            'id',
            unreadMessages.map((m) => m.id)
          );
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    if (!session?.user || !id) {
      return;
    }

    const poller = setInterval(() => {
      loadChatData({ preserveRecent: true });
    }, 5000);

    return () => clearInterval(poller);
  }, [session?.user?.id, id]);

  const sendMessage = async () => {
    console.log('[sendMessage] Starting...');

    if (!newMessage.trim() || !session?.user || !id) {
      console.log('[sendMessage] Validation failed:', {
        hasMessage: !!newMessage.trim(),
        hasSession: !!session?.user,
        hasId: !!id
      });
      return;
    }

    if (!otherUserRef.current?.id) {
      console.log('[sendMessage] Ensuring partner details are loaded...');
      await ensurePartnerDetails();
    }

    const recipientId =
      partnerIdRef.current ?? otherUserRef.current?.id ?? null;

    if (!recipientId) {
      console.log('[sendMessage] No recipient found');
      Alert.alert('Error', 'Unable to determine the recipient for this chat.');
      return;
    }

    console.log('[sendMessage] Recipient ID:', recipientId);
    setSending(true);
    const messageContent = newMessage.trim();
    setNewMessage('');
    let encryptedContent = '';
    let signalMetadata: Record<string, any> | null = null;

    try {
      console.log('[sendMessage] Encrypting message...');
      encryptedContent = await encryptMessage(messageContent, {
        conversationId: id,
        localUserId: session.user.id,
        remoteUserId: recipientId,
        associatedData: id,
      });
      console.log('[sendMessage] Message encrypted successfully');

      try {
        const parsed = JSON.parse(encryptedContent);
        if (parsed && typeof parsed === 'object') {
          signalMetadata = parsed.handshake ?? null;
        }
      } catch {
        signalMetadata = null;
      }
    } catch (error: any) {
      setSending(false);
      setNewMessage(messageContent);
      console.error('[sendMessage] Encryption failed:', error);
      Alert.alert(
        'Encryption error',
        `Failed to encrypt: ${error?.message || 'Unknown error'}\n\nPlease check console for details.`
      );
      return;
    }

    const messagePayload = {
      conversation_id: id,
      sender_id: session.user.id,
      content: '[encrypted]',
      ciphertext: encryptedContent,
      signal_metadata: signalMetadata,
      read: false,
    };

    try {
      console.log('[sendMessage] Inserting message to database...');
      const { data, error } = await supabase
        .from('messages')
        .insert(messagePayload)
        .select();

      if (error) {
        console.error('[sendMessage] Database insert error:', error);
        throw error;
      }

      console.log('[sendMessage] Message inserted successfully:', data);

      // Update conversation timestamp
      const { error: updateError } = await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', id);

      if (updateError) {
        console.error('[sendMessage] Conversation update error:', updateError);
        // Don't throw - message was sent successfully
      }

      await loadChatData({ preserveRecent: true });
      console.log('[sendMessage] Message sent successfully!');
    } catch (error: any) {
      setNewMessage(messageContent);
      setSending(false);
      console.error('[sendMessage] Failed to send message:', error);
      Alert.alert(
        'Send Failed',
        `Error: ${error?.message || 'Unknown error'}\n\nDetails: ${JSON.stringify(error, null, 2)}`
      );
      return;
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.sender_id === session?.user.id;

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isOwnMessage ? styles.ownBubble : styles.otherBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isOwnMessage ? styles.ownText : styles.otherText,
            ]}
          >
            {item.content}
          </Text>
          <View style={styles.messageFooter}>
            <Text
              style={[
                styles.messageTime,
                isOwnMessage ? styles.ownTime : styles.otherTime,
              ]}
            >
              {new Date(item.created_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
            {isOwnMessage && (
              <Text style={styles.readIndicator}>{item.read ? '✓✓' : '✓'}</Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      <View style={styles.header} onLayout={handleHeaderLayout}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={22} color="#F5F5F5" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={styles.headerAvatar}>
            {otherUser?.avatar_url && getAvatarSource(otherUser.avatar_url) ? (
              <Image
                source={getAvatarSource(otherUser.avatar_url)}
                style={styles.headerAvatarImage}
                resizeMode="cover"
              />
            ) : (
              <Text style={styles.headerAvatarText}>
                {otherUser?.display_name?.charAt(0).toUpperCase() || '?'}
              </Text>
            )}
          </View>
          <Text style={styles.headerTitle}>
            {otherUser?.display_name?.toUpperCase() || 'CHANNEL'}
          </Text>
        </View>
        {isNative && (
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconButton}
              activeOpacity={0.7}
              onPress={() => {
                if (partnerId && id && startCall) {
                  startCall(id, partnerId, 'audio');
                } else {
                  Alert.alert('Error', 'Unable to start call. User info not loaded.');
                }
              }}
            >
              <Phone size={20} color="#4A7C59" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              activeOpacity={0.7}
              onPress={() => {
                if (partnerId && id && startCall) {
                  startCall(id, partnerId, 'video');
                } else {
                  Alert.alert('Error', 'Unable to start call. User info not loaded.');
                }
              }}
            >
              <Video size={20} color="#4A7C59" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesWrapper}
        contentContainerStyle={[
          styles.messagesList,
          { paddingBottom: listBottomPadding },
        ]}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>NO MESSAGES</Text>
            <Text style={styles.emptySubtext}>Start secure communication</Text>
          </View>
        }
      />

      <View
        style={[
          styles.inputContainer,
          { paddingBottom: inputPaddingBottom },
        ]}
      >
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          placeholderTextColor="#8E8E93"
          multiline
          maxLength={1000}
          onFocus={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!newMessage.trim() || sending) && styles.sendButtonDisabled,
          ]}
          onPress={sendMessage}
          disabled={!newMessage.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#F5F5F5" />
          ) : (
            <Send size={18} color="#F5F5F5" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    borderRadius: 10,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#4A7C59',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerAvatarText: {
    color: '#F5F5F5',
    fontSize: 14,
    fontWeight: '700',
  },
  headerAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F5F5F5',
    letterSpacing: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2C2C2E',
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  messagesList: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  messagesWrapper: {
    flex: 1,
  },
  messageContainer: {
    marginBottom: 10,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  ownBubble: {
    backgroundColor: '#4A7C59',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#2C2C2E',
    borderWidth: 1,
    borderColor: '#3A3A3C',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 4,
  },
  destroyedText: {
    fontStyle: 'italic',
    color: '#8E8E93',
    opacity: 0.7,
  },
  selfDestructBubble: {
    borderWidth: 1,
    borderColor: '#D4A017',
    borderStyle: 'dashed',
  },
  selfDestructIndicator: {
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: 'rgba(212, 160, 23, 0.1)',
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  selfDestructText: {
    fontSize: 10,
    color: '#D4A017',
    fontWeight: '600',
  },
  ownText: {
    color: '#F5F5F5',
  },
  otherText: {
    color: '#F5F5F5',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    justifyContent: 'flex-end',
  },
  messageTime: {
    fontSize: 10,
    fontWeight: '500',
    opacity: 0.7,
  },
  ownTime: {
    color: 'rgba(245, 245, 245, 0.7)',
  },
  otherTime: {
    color: '#8E8E93',
  },
  readIndicator: {
    fontSize: 11,
    color: 'rgba(245, 245, 245, 0.8)',
    marginLeft: 2,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#2C2C2E',
    borderTopWidth: 1,
    borderTopColor: '#3A3A3C',
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: '#1C1C1E',
    color: '#F5F5F5',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#4A7C59',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F5F5F5',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 2,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#8E8E93',
    textAlign: 'center',
  },
});
