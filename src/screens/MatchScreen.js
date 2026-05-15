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
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Get current user's skills
      const mySnap = await getDoc(doc(db, 'users', user.uid));
      const myData = mySnap.data() || {};
      const myLearn = (myData.skillsToLearn || []).map(s => s.toLowerCase());
      const myTeach = (myData.skillsToTeach || []).map(s => s.toLowerCase());

      // Get ALL users
      const snapshot = await getDocs(collection(db, 'users'));
      const results = [];

      snapshot.forEach(snap => {
        if (snap.id === user.uid) return;
        const other = snap.data();
        const otherTeach = (other.skillsToTeach || []).map(s => s.toLowerCase());
        const otherLearn = (other.skillsToLearn || []).map(s => s.toLowerCase());

        // Check matching (even if current user has no skills, still show everyone)
        const canTeachMe = myLearn.length > 0 && otherTeach.some(s => myLearn.includes(s));
        const isTwoWay = canTeachMe && myTeach.length > 0 && otherLearn.some(s => myTeach.includes(s));

        results.push({ ...other, uid: snap.id, canTeachMe, isTwoWay });
      });

      // Sort: 2-way first, then 1-way matches, then rest
      results.sort((a, b) => {
        if (b.isTwoWay !== a.isTwoWay) return b.isTwoWay ? 1 : -1;
        if (b.canTeachMe !== a.canTeachMe) return b.canTeachMe ? 1 : -1;
        return 0;
      });

      setAllUsers(results);
      setFilteredUsers(results);
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể tải dữ liệu. Kiểm tra kết nối mạng.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text) => {
    setSearch(text);
    if (!text.trim()) {
      setFilteredUsers(allUsers);
    } else {
      const q = text.toLowerCase();
      const filtered = allUsers.filter(item =>
        (item.name || '').toLowerCase().includes(q) ||
        (item.school || '').toLowerCase().includes(q) ||
        (item.skillsToTeach || []).some(s => s.toLowerCase().includes(q))
      );
      setFilteredUsers(filtered);
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
    <View style={[styles.card, item.isTwoWay && styles.twoWayCard, item.canTeachMe && !item.isTwoWay && styles.oneWayCard]}>
      {item.isTwoWay && (
        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
          <Text style={styles.badgeText}>🔄 Match 2 chiều</Text>
        </View>
      )}
      {item.canTeachMe && !item.isTwoWay && (
        <View style={[styles.badge, { backgroundColor: colors.secondary }]}>
          <Text style={styles.badgeText}>✅ Có thể dạy bạn</Text>
        </View>
      )}

      <View style={styles.avatarRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(item.name || 'N').charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardName}>{item.name || 'Chưa đặt tên'}</Text>
          <Text style={styles.cardSchool}>{item.school || 'Chưa cập nhật trường'}</Text>
        </View>
      </View>

      {(item.skillsToTeach || []).length > 0 && (
        <>
          <Text style={styles.skillLabel}>🎓 Có thể dạy:</Text>
          <View style={styles.tagRow}>
            {(item.skillsToTeach || []).map((s, i) => (
              <View key={i} style={styles.tag}><Text style={styles.tagText}>{s}</Text></View>
            ))}
          </View>
        </>
      )}
      {(item.skillsToLearn || []).length > 0 && (
        <>
          <Text style={styles.skillLabel}>📚 Muốn học:</Text>
          <View style={styles.tagRow}>
            {(item.skillsToLearn || []).map((s, i) => (
              <View key={i} style={[styles.tag, { backgroundColor: '#FFF3E0' }]}>
                <Text style={[styles.tagText, { color: '#E65100' }]}>{s}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {item.bio ? <Text style={styles.bio} numberOfLines={2}>{item.bio}</Text> : null}

      <TouchableOpacity style={styles.chatBtn} onPress={() => openChat(item)}>
        <Text style={styles.chatBtnText}>💬 Nhắn tin ngay</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />;

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍  Tìm theo tên, trường, kỹ năng..."
          value={search}
          onChangeText={handleSearch}
          clearButtonMode="while-editing"
        />
      </View>

      {filteredUsers.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>
            {search ? 'Không tìm thấy kết quả' : 'Chưa có sinh viên nào'}
          </Text>
          <Text style={styles.emptyText}>
            {search ? `Không có ai tên "${search}". Thử từ khác nhé!` : 'Hãy cập nhật hồ sơ để ghép cặp tốt hơn!'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={item => item.uid}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          ListHeaderComponent={
            <Text style={styles.resultCount}>
              {search ? `Tìm thấy ${filteredUsers.length} kết quả` : `${filteredUsers.length} sinh viên trong hệ thống`}
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchContainer: {
    padding: 12, backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.border,
    elevation: 2,
  },
  searchInput: {
    backgroundColor: colors.background, padding: 12, borderRadius: 12,
    borderWidth: 1, borderColor: colors.border, fontSize: 14,
  },
  resultCount: { fontSize: 13, color: colors.textLight, marginBottom: 12 },
  card: {
    backgroundColor: colors.surface, borderRadius: 14, padding: 16,
    marginBottom: 14, borderWidth: 1, borderColor: colors.border, elevation: 2,
  },
  twoWayCard: { borderColor: colors.primary, borderWidth: 2 },
  oneWayCard: { borderColor: colors.secondary, borderWidth: 1.5 },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 10 },
  badgeText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: colors.secondary,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 20 },
  cardName: { fontSize: 17, fontWeight: 'bold', color: colors.text },
  cardSchool: { fontSize: 13, color: colors.textLight },
  skillLabel: { fontSize: 13, fontWeight: '600', color: colors.secondary, marginTop: 8, marginBottom: 4 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: '#F0EFFF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tagText: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  bio: { fontSize: 13, color: colors.textLight, marginTop: 10, fontStyle: 'italic' },
  chatBtn: { backgroundColor: colors.primary, borderRadius: 10, padding: 11, alignItems: 'center', marginTop: 14 },
  chatBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 50, marginBottom: 15 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 8 },
  emptyText: { fontSize: 14, color: colors.textLight, textAlign: 'center' },
});
