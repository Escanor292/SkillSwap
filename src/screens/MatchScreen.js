import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, TextInput
} from 'react-native';
import { collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { AuthContext } from '../context/AuthContext';
import { colors } from '../theme/colors';

export default function MatchScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [allMatches, setAllMatches] = useState([]);
  const [filteredMatches, setFilteredMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { loadMatches(); }, []);

  const loadMatches = async () => {
    try {
      const mySnap = await getDoc(doc(db, 'users', user.uid));
      const myData = mySnap.data() || {};
      const myLearn = (myData.skillsToLearn || []).map(s => s.toLowerCase());
      const myTeach = (myData.skillsToTeach || []).map(s => s.toLowerCase());

      const snapshot = await getDocs(collection(db, 'users'));
      const results = [];

      snapshot.forEach(snap => {
        if (snap.id === user.uid) return;
        const other = snap.data();
        const otherTeach = (other.skillsToTeach || []).map(s => s.toLowerCase());
        const otherLearn = (other.skillsToLearn || []).map(s => s.toLowerCase());

        const canTeachMe = otherTeach.some(s => myLearn.includes(s));
        if (!canTeachMe) return;

        const isTwoWay = otherLearn.some(s => myTeach.includes(s));
        results.push({ ...other, uid: snap.id, isTwoWay });
      });

      results.sort((a, b) => (b.isTwoWay ? 1 : 0) - (a.isTwoWay ? 1 : 0));
      setAllMatches(results);
      setFilteredMatches(results);
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text) => {
    setSearch(text);
    if (!text) {
      setFilteredMatches(allMatches);
    } else {
      const filtered = allMatches.filter(item => 
        (item.name || '').toLowerCase().includes(text.toLowerCase())
      );
      setFilteredMatches(filtered);
    }
  };

  const openChat = async (otherUser) => {
    const chatId = [user.uid, otherUser.uid].sort().join('_');
    try {
      await setDoc(doc(db, 'chats', chatId), {
        participants: [user.uid, otherUser.uid],
        lastMessage: '',
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      navigation.navigate('ChatRoom', {
        chatId,
        otherUserName: otherUser.name || 'Người dùng',
        otherUserId: otherUser.uid,
      });
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    }
  };

  const renderItem = ({ item }) => (
    <View style={[styles.card, item.isTwoWay && styles.twoWayCard]}>
      {item.isTwoWay && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>🔄 Match 2 chiều</Text>
        </View>
      )}
      <View style={styles.avatarRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(item.name || 'N').charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardName}>{item.name || 'Chưa đặt tên'}</Text>
          <Text style={styles.cardSchool}>{item.school || ''}</Text>
        </View>
      </View>
      <Text style={styles.skillLabel}>🎓 Có thể dạy:</Text>
      <Text style={styles.skillText}>{(item.skillsToTeach || []).join(', ') || 'Chưa cập nhật'}</Text>
      <Text style={styles.skillLabel}>📚 Muốn học:</Text>
      <Text style={styles.skillText}>{(item.skillsToLearn || []).join(', ') || 'Chưa cập nhật'}</Text>
      <TouchableOpacity style={styles.chatBtn} onPress={() => openChat(item)}>
        <Text style={styles.chatBtnText}>💬 Nhắn tin</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />;

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm theo tên..."
          value={search}
          onChangeText={handleSearch}
        />
      </View>

      {filteredMatches.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Không tìm thấy kết quả</Text>
          <Text style={styles.emptyText}>Thử tìm tên khác hoặc cập nhật lại hồ sơ nhé!</Text>
        </View>
      ) : (
        <FlatList
          data={filteredMatches}
          keyExtractor={item => item.uid}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchContainer: {
    padding: 16, backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.border
  },
  searchInput: {
    backgroundColor: colors.background, padding: 12,
    borderRadius: 10, borderWidth: 1, borderColor: colors.border,
  },
  card: {
    backgroundColor: colors.surface, borderRadius: 14, padding: 16,
    marginBottom: 14, borderWidth: 1, borderColor: colors.border, elevation: 2,
  },
  twoWayCard: { borderColor: colors.primary, borderWidth: 2 },
  badge: {
    backgroundColor: colors.primary, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
    alignSelf: 'flex-start', marginBottom: 10,
  },
  badgeText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: colors.secondary,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 20 },
  cardName: { fontSize: 17, fontWeight: 'bold', color: colors.text },
  cardSchool: { fontSize: 13, color: colors.textLight },
  skillLabel: { fontSize: 13, fontWeight: '600', color: colors.secondary, marginTop: 6 },
  skillText: { fontSize: 14, color: colors.text },
  chatBtn: {
    backgroundColor: colors.primary, borderRadius: 10,
    padding: 11, alignItems: 'center', marginTop: 14,
  },
  chatBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
  emptyText: { fontSize: 14, color: colors.textLight, textAlign: 'center' },
});
