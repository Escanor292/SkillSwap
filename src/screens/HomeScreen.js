import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView
} from 'react-native';
import { collection, getDocs, limit, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { AuthContext } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ skills: 0, schedules: 0, rating: 5.0 });
  const [loading, setLoading] = useState(true);
  const [profileIncomplete, setProfileIncomplete] = useState(false);

  useEffect(() => { 
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Load User Info & Stats
      const userSnap = await getDoc(doc(db, 'users', user.uid));
      const userData = userSnap.data() || {};
      
      // Check if profile is incomplete
      if (!userData.name || !userData.skillsToTeach || userData.skillsToTeach.length === 0) {
        setProfileIncomplete(true);
      } else {
        setProfileIncomplete(false);
      }

      const skillCount = (userData.skillsToTeach || []).length;
      const scheduleSnap = await getDocs(query(collection(db, 'schedules'), where('participants', 'array-contains', user.uid)));
      
      setStats({
        skills: skillCount,
        schedules: scheduleSnap.size,
        rating: 5.0
      });

      // 2. Load Random Users
      const usersQuery = query(collection(db, 'users'), limit(20));
      const snapshot = await getDocs(usersQuery);
      const allUsers = [];
      snapshot.forEach(doc => {
        if (doc.id !== user.uid) {
          allUsers.push({ id: doc.id, ...doc.data() });
        }
      });
      const shuffled = allUsers.sort(() => 0.5 - Math.random());
      setUsers(shuffled.slice(0, 5));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const renderStatCard = (icon, label, value, color) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Ionicons name={icon} size={24} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

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
      <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
    </TouchableOpacity>
  );

  if (loading && users.length === 0) return <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />;

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        keyExtractor={item => item.id}
        renderItem={renderUser}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={
          <>
            <Text style={styles.welcome}>Chào mừng, {(user.email || '').split('@')[0]}!</Text>
            <Text style={styles.subtitle}>Hôm nay bạn muốn học gì mới không?</Text>
            
            {profileIncomplete && (
              <TouchableOpacity 
                style={styles.warningBanner}
                onPress={() => navigation.navigate('Cá nhân')}
              >
                <Ionicons name="warning" size={20} color="#fff" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.warningTitle}>Hồ sơ chưa hoàn thiện!</Text>
                  <Text style={styles.warningText}>Cập nhật kỹ năng để bắt đầu ghép cặp ngay.</Text>
                </View>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </TouchableOpacity>
            )}

            <View style={styles.statsRow}>
              {renderStatCard('book', 'Kỹ năng dạy', stats.skills, '#6C63FF')}
              {renderStatCard('calendar', 'Lịch học', stats.schedules, '#FF6B6B')}
              {renderStatCard('star', 'Đánh giá', stats.rating.toFixed(1), '#FFD93D')}
            </View>

            <Text style={styles.header}>Gợi ý sinh viên phù hợp</Text>
          </>
        }
        onRefresh={loadData}
        refreshing={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  welcome: { fontSize: 24, fontWeight: 'bold', color: colors.text, paddingHorizontal: 0, marginTop: 20 },
  subtitle: { fontSize: 15, color: colors.textLight, marginBottom: 20 },
  warningBanner: {
    backgroundColor: '#FF6B6B', padding: 15, borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', marginBottom: 20,
    elevation: 4, shadowColor: '#FF6B6B', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 5,
  },
  warningTitle: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  warningText: { color: '#fff', fontSize: 12, opacity: 0.9 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25, gap: 10 },
  statCard: {
    flex: 1, backgroundColor: colors.surface, padding: 12, borderRadius: 12,
    borderLeftWidth: 4, elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2,
    alignItems: 'center'
  },
  statValue: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginTop: 5 },
  statLabel: { fontSize: 11, color: colors.textLight, marginTop: 2 },
  header: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 15 },
  card: {
    flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 15,
    padding: 15, marginBottom: 12, elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3,
    alignItems: 'center'
  },
  avatar: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: colors.secondary,
    justifyContent: 'center', alignItems: 'center', marginRight: 15,
  },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  school: { fontSize: 12, color: colors.textLight, marginVertical: 2 },
  skillRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  tag: { backgroundColor: '#F0EFFF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5, marginRight: 5 },
  tagText: { fontSize: 10, color: colors.primary, fontWeight: '600' },
});
