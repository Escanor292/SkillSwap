import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform
} from 'react-native';
import {
  collection, query, where, orderBy, onSnapshot,
  addDoc, doc, updateDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { AuthContext } from '../context/AuthContext';
import { colors } from '../theme/colors';

export default function ChatRoomScreen({ route, navigation }) {
  const { chatId, otherUserName } = route.params;
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const flatListRef = useRef(null);

  // Set header title
  useEffect(() => {
    navigation.setOptions({ title: otherUserName });
  }, [otherUserName]);

  // Listen to messages in realtime
  useEffect(() => {
    const q = query(
      collection(db, 'messages'),
      where('chatId', '==', chatId),
      orderBy('createdAt', 'asc')
    );
    const unsubscribe = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsubscribe;
  }, [chatId]);

  const sendMessage = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setText('');
    try {
      await addDoc(collection(db, 'messages'), {
        chatId,
        senderId: user.uid,
        text: trimmed,
        createdAt: new Date().toISOString(),
      });
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: trimmed,
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.error('Gửi lỗi:', e);
    }
  };

  const renderItem = ({ item }) => {
    const mine = item.senderId === user.uid;
    return (
      <View style={[styles.row, mine ? styles.myRow : styles.otherRow]}>
        <View style={[styles.bubble, mine ? styles.myBubble : styles.otherBubble]}>
          <Text style={mine ? styles.myText : styles.otherText}>{item.text}</Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 12, paddingBottom: 6 }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Nhập tin nhắn..."
          multiline
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
          <Text style={styles.sendText}>Gửi</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  row: { marginBottom: 8, flexDirection: 'row' },
  myRow: { justifyContent: 'flex-end' },
  otherRow: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '75%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  myBubble: { backgroundColor: colors.primary },
  otherBubble: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  myText: { color: '#fff', fontSize: 15 },
  otherText: { color: colors.text, fontSize: 15 },
  inputRow: {
    flexDirection: 'row', padding: 10,
    borderTopWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface, alignItems: 'flex-end',
  },
  input: {
    flex: 1, borderWidth: 1, borderColor: colors.border,
    borderRadius: 22, paddingHorizontal: 14, paddingVertical: 8,
    maxHeight: 100, fontSize: 15, marginRight: 8,
    backgroundColor: colors.background,
  },
  sendBtn: {
    backgroundColor: colors.primary, borderRadius: 22,
    paddingHorizontal: 18, paddingVertical: 10,
  },
  sendText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
