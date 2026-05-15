import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, FlatList, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, Linking
} from 'react-native';
import {
  collection, addDoc, query, where, onSnapshot, doc, updateDoc, getDocs
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { AuthContext } from '../context/AuthContext';
import { colors } from '../theme/colors';

const MODES = ['Online', 'Offline'];

export default function ScheduleScreen() {
  const { user } = useContext(AuthContext);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form states
  const [skill, setSkill] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [mode, setMode] = useState('Online');
  const [location, setLocation] = useState('');
  const [saving, setSaving] = useState(false);

  // Search partner states
  const [partnerSearch, setPartnerSearch] = useState('');
  const [allSystemUsers, setAllSystemUsers] = useState([]);
  const [partnerResults, setPartnerResults] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState(null);

  useEffect(() => {
    // Watch schedules where I am either the creator or the partner
    const q = query(
      collection(db, 'schedules'),
      where('participants', 'array-contains', user.uid)
    );
    const unsub = onSnapshot(q, snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setSchedules(list);
      setLoading(false);
    });

    // Preload all users once for local partner search
    getDocs(collection(db, 'users')).then(snap => {
      const list = [];
      snap.forEach(d => {
        if (d.id !== user.uid) list.push({ uid: d.id, ...d.data() });
      });
      setAllSystemUsers(list);
    }).catch(console.error);

    return unsub;
  }, []);

  const searchUsers = (text) => {
    setPartnerSearch(text);
    if (text.trim().length < 1) {
      setPartnerResults([]);
      return;
    }
    const q = text.toLowerCase();
    const results = allSystemUsers.filter(u =>
      (u.name || '').toLowerCase().includes(q) ||
      (u.school || '').toLowerCase().includes(q)
    ).slice(0, 5);
    setPartnerResults(results);
  };

  const createSchedule = async () => {
    if (!skill || !date || !time || !selectedPartner) {
      Alert.alert('Lỗi', 'Vui lòng điền đủ thông tin và chọn bạn học');
      return;
    }
    setSaving(true);
    try {
      await addDoc(collection(db, 'schedules'), {
        creatorId: user.uid,
        creatorName: (user.email || '').split('@')[0], // Fallback if name not in auth
        partnerId: selectedPartner.uid,
        partnerName: selectedPartner.name,
        participants: [user.uid, selectedPartner.uid],
        skill,
        date,
        time,
        mode,
        location: mode === 'Offline' ? location : '',
        status: 'pending', // Important: status is pending initially
        createdAt: new Date().toISOString(),
      });
      Alert.alert('Thành công', 'Đã gửi lời mời học tập!');
      setShowForm(false);
      resetForm();
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setSkill(''); setDate(''); setTime(''); setLocation('');
    setPartnerSearch(''); setPartnerResults([]); setSelectedPartner(null);
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, 'schedules', id), { status: newStatus });
      Alert.alert('Thông báo', newStatus === 'accepted' ? 'Đã chấp nhận lời mời' : 'Đã từ chối');
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    }
  };

  const openLink = (url) => {
    if (!url) return;
    Linking.openURL(url).catch(err => Alert.alert('Lỗi', 'Không thể mở liên kết này'));
  };

  const renderSchedule = ({ item }) => {
    const isIncoming = item.partnerId === user.uid && item.status === 'pending';
    const isAccepted = item.status === 'accepted';

    return (
      <View style={[styles.card, item.status === 'pending' && styles.pendingCard]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardSkill}>{item.skill}</Text>
          <View style={[styles.statusBadge, 
            item.status === 'accepted' ? styles.accepted : 
            item.status === 'pending' ? styles.pending : styles.rejected]}>
            <Text style={styles.statusText}>
              {item.status === 'accepted' ? 'Đã xác nhận' : 
               item.status === 'pending' ? 'Đang chờ' : 'Đã từ chối'}
            </Text>
          </View>
        </View>

        <Text style={styles.cardText}>👤 {item.creatorId === user.uid ? `Bạn học cùng: ${item.partnerName}` : `Từ: ${item.creatorName}`}</Text>
        <Text style={styles.cardText}>📅 {item.date} — ⏰ {item.time} ({item.mode})</Text>
        
        {item.mode === 'Offline' && item.location && <Text style={styles.cardText}>📍 {item.location}</Text>}

        {isAccepted && item.mode === 'Online' && (
          <TouchableOpacity 
            style={styles.joinBtn} 
            onPress={() => openLink(`https://meet.jit.si/SkillSwap_${item.id}`)}
          >
            <Text style={styles.joinBtnText}>📹 Vào buổi học ngay</Text>
          </TouchableOpacity>
        )}

        {isIncoming && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={[styles.actionBtn, styles.acceptBtn]} onPress={() => updateStatus(item.id, 'accepted')}>
              <Text style={styles.actionBtnText}>Chấp nhận</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => updateStatus(item.id, 'rejected')}>
              <Text style={styles.actionBtnText}>Từ chối</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(!showForm)}>
          <Text style={styles.addBtnText}>{showForm ? '✕ Đóng' : '+ Gửi lời mời học tập'}</Text>
        </TouchableOpacity>

        {showForm && (
          <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Tìm bạn học cùng</Text>
            {selectedPartner ? (
              <View style={styles.selectedPartner}>
                <Text style={styles.selectedPartnerText}>🤝 {selectedPartner.name}</Text>
                <TouchableOpacity onPress={() => setSelectedPartner(null)}>
                  <Text style={{ color: colors.secondary, fontWeight: 'bold' }}>Thay đổi</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <TextInput 
                  style={styles.input} 
                  value={partnerSearch} 
                  onChangeText={searchUsers} 
                  placeholder="Gõ tên để tìm kiếm..." 
                />
                {partnerResults.map(p => (
                  <TouchableOpacity key={p.uid} style={styles.resultItem} onPress={() => setSelectedPartner(p)}>
                    <Text style={styles.resultText}>{p.name} ({p.school})</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}

            <Text style={styles.label}>Kỹ năng trao đổi</Text>
            <TextInput style={styles.input} value={skill} onChangeText={setSkill} placeholder="VD: Guitar, Python..." />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Ngày</Text>
                <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="20/05/2026" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Giờ</Text>
                <TextInput style={styles.input} value={time} onChangeText={setTime} placeholder="14:30" />
              </View>
            </View>

            <Text style={styles.label}>Hình thức</Text>
            <View style={styles.modeRow}>
              {MODES.map(m => (
                <TouchableOpacity key={m} style={[styles.modeOption, mode === m && styles.modeActive]} onPress={() => setMode(m)}>
                  <Text style={[styles.modeOptionText, mode === m && { color: '#fff' }]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {mode === 'Offline' && (
              <TextInput style={[styles.input, { marginTop: 10 }]} value={location} onChangeText={setLocation} placeholder="Địa điểm (Thư viện...)" />
            )}

            <TouchableOpacity style={styles.saveBtn} onPress={createSchedule} disabled={saving}>
              <Text style={styles.saveBtnText}>{saving ? 'Đang gửi...' : 'Gửi lời mời'}</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        <FlatList
          data={schedules}
          keyExtractor={i => i.id}
          renderItem={renderSchedule}
          contentContainerStyle={{ padding: 16 }}
          ListHeaderComponent={<Text style={styles.listHeader}>Danh sách lịch học & Lời mời</Text>}
          ListEmptyComponent={<Text style={styles.empty}>Chưa có lịch học nào.</Text>}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  addBtn: { backgroundColor: colors.primary, margin: 16, padding: 14, borderRadius: 12, alignItems: 'center' },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  form: { backgroundColor: colors.surface, paddingHorizontal: 16, paddingBottom: 10, maxHeight: 400 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginTop: 12, marginBottom: 5 },
  input: { backgroundColor: colors.background, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.border, fontSize: 14 },
  resultItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  resultText: { fontSize: 14, color: colors.text },
  selectedPartner: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, backgroundColor: '#F0EFFF', borderRadius: 10, alignItems: 'center' },
  selectedPartnerText: { fontWeight: 'bold', color: colors.primary },
  modeRow: { flexDirection: 'row', gap: 10 },
  modeOption: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center' },
  modeActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  modeOptionText: { fontWeight: '600', color: colors.text },
  saveBtn: { backgroundColor: colors.secondary, padding: 14, borderRadius: 12, alignItems: 'center', marginVertical: 14 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  listHeader: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 10 },
  card: { backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  pendingCard: { borderStyle: 'dashed', borderColor: colors.secondary },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardSkill: { fontSize: 17, fontWeight: 'bold', color: colors.primary },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  accepted: { backgroundColor: '#E8F5E9' },
  pending: { backgroundColor: '#FFF3E0' },
  rejected: { backgroundColor: '#FFEBEE' },
  statusText: { fontWeight: '600', fontSize: 12 },
  cardText: { fontSize: 14, color: colors.text, marginTop: 4 },
  joinBtn: { backgroundColor: '#4CAF50', borderRadius: 8, padding: 10, alignItems: 'center', marginTop: 12 },
  joinBtnText: { color: '#fff', fontWeight: 'bold' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 15 },
  actionBtn: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center' },
  acceptBtn: { backgroundColor: '#4CAF50' },
  rejectBtn: { backgroundColor: '#F44336' },
  actionBtnText: { color: '#fff', fontWeight: 'bold' },
  empty: { textAlign: 'center', color: colors.textLight, marginTop: 40 },
});
