import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity
} from 'react-native';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '../config/firebase';
import { AuthContext } from '../context/AuthContext';
import { colors } from '../theme/colors';

export default function HomeScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadRandomUsers(); }, []);

  const loadRandomUsers = async () => {
    try {
      const q = query(collection(db, 'users'), limit(20));
      const snapshot = await getDocs(q);
      const allUsers = [];
      snapshot.forEach(doc => {
        if (doc.id !== user.uid) {
          allUsers.push({ id: doc.id, ...doc.data() });
        }
      });
      // Shuffle array
      const shuffled = allUsers.sort(() => 0.5 - Math.random());
      setUsers(shuffled.slice(0, 5)); // Show 5 random users
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const renderUser = ({ item }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('Match')}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{(item.name || 'N').charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name || 'Sinh viên'}</Text>
        <Text style={styles.school} numberOfLines={1}>{item.school || 'Trường học'}</Text>
        <View style={styles.skillRow}>
          {(item.skillsToTeach || []).slice(0, 2).map((s, i) => (
            <View key={i} style={styles.tag}>
              <Text style={styles.tagText}>{s}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />;

  return (
    <View style={styles.container}>
      <Text style={styles.welcome}>Chào mừng bạn quay lại!</Text>
      <Text style={styles.subtitle}>Khám phá những sinh viên tài năng quanh bạn</Text>
      
      <FlatList
        data={users}
        keyExtractor={item => item.id}
        renderItem={renderUser}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={<Text style={styles.header}>Gợi ý cho bạn</Text>}
        onRefresh={loadRandomUsers}
        refreshing={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  welcome: { fontSize: 22, fontWeight: 'bold', color: colors.primary, paddingHorizontal: 16, marginTop: 20 },
  subtitle: { fontSize: 14, color: colors.textLight, paddingHorizontal: 16, marginBottom: 10 },
  header: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 15 },
  card: {
    flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 15,
    padding: 15, marginBottom: 15, elevation: 3, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
  },
  avatar: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: colors.secondary,
    justifyContent: 'center', alignItems: 'center', marginRight: 15,
  },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  info: { flex: 1, justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  school: { fontSize: 13, color: colors.textLight, marginVertical: 3 },
  skillRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 5 },
  tag: { backgroundColor: '#F0EFFF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginRight: 5 },
  tagText: { fontSize: 11, color: colors.primary, fontWeight: '600' },
});
