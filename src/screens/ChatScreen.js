import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator
} from 'react-native';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { AuthContext } from '../context/AuthContext';
import { colors } from '../theme/colors';

export default function ChatScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen realtime to chats where current user is a participant
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const chatList = [];
      for (const snap of snapshot.docs) {
        const data = snap.data();
        const otherId = data.participants.find(id => id !== user.uid);
        let otherName = 'Người dùng';
        try {
          const otherSnap = await getDoc(doc(db, 'users', otherId));
          if (otherSnap.exists()) otherName = otherSnap.data().name || 'Người dùng';
        } catch {}
        chatList.push({
          id: snap.id, otherName, otherId,
          lastMessage: data.lastMessage || '',
          updatedAt: data.updatedAt || '',
        });
      }
      chatList.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      setChats(chatList);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => navigation.navigate('ChatRoom', {
        chatId: item.id,
        otherUserName: item.otherName,
        otherUserId: item.otherId,
      })}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.otherName.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{item.otherName}</Text>
        <Text style={styles.last} numberOfLines={1}>
          {item.lastMessage || 'Bắt đầu cuộc trò chuyện...'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />;

  return (
    <View style={styles.container}>
      {chats.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Chưa có cuộc trò chuyện nào</Text>
          <Text style={styles.emptyText}>Ghép cặp với ai đó để bắt đầu nhắn tin!</Text>
        </View>
      ) : (
        <FlatList data={chats} keyExtractor={i => i.id} renderItem={renderItem} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  chatItem: {
    flexDirection: 'row', padding: 16,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.surface, alignItems: 'center',
  },
  avatar: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 22 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  last: { fontSize: 13, color: colors.textLight, marginTop: 3 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
  emptyText: { fontSize: 14, color: colors.textLight, textAlign: 'center' },
});
