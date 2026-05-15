import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, FlatList, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, Linking
} from 'react-native';
import {
  collection, addDoc, query, where, onSnapshot, orderBy
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
  const [skill, setSkill] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [mode, setMode] = useState('Online');
  const [location, setLocation] = useState('');
  const [videoLink, setVideoLink] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'schedules'),
      where('userAId', '==', user.uid)
    );
    const unsub = onSnapshot(q, snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setSchedules(list);
      setLoading(false);
    });
    return unsub;
  }, []);

  const createSchedule = async () => {
    if (!skill || !date || !time) {
      Alert.alert('Lỗi', 'Vui lòng điền kỹ năng, ngày và giờ');
      return;
    }
    setSaving(true);
    try {
      await addDoc(collection(db, 'schedules'), {
        userAId: user.uid,
        partnerName,
        skill,
        date,
        time,
        mode,
        location: mode === 'Offline' ? location : '',
        videoCallLink: mode === 'Online' ? videoLink : '',
        status: 'upcoming',
        createdAt: new Date().toISOString(),
      });
      Alert.alert('Thành công', 'Đã tạo lịch học!');
      setShowForm(false);
      setSkill(''); setPartnerName(''); setDate(''); setTime('');
      setLocation(''); setVideoLink('');
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    } finally {
      setSaving(false);
    }
  };

  const openLink = (url) => {
    if (!url) return;
    Linking.openURL(url).catch(err => Alert.alert('Lỗi', 'Không thể mở liên kết này'));
  };

  const renderSchedule = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardSkill}>{item.skill}</Text>
        <View style={[styles.modeBadge, item.mode === 'Online' ? styles.online : styles.offline]}>
          <Text style={styles.modeText}>{item.mode}</Text>
        </View>
      </View>
      <Text style={styles.cardText}>👤 {item.partnerName || 'Chưa xác định'}</Text>
      <Text style={styles.cardText}>📅 {item.date} — ⏰ {item.time}</Text>
      {item.mode === 'Online' && item.videoCallLink
        ? (
          <TouchableOpacity onPress={() => openLink(item.videoCallLink)}>
            <Text style={[styles.cardLink, { textDecorationLine: 'underline' }]}>
              🔗 Tham gia: {item.videoCallLink}
            </Text>
          </TouchableOpacity>
        )
        : null}
      {item.mode === 'Offline' && item.location
        ? <Text style={styles.cardText}>📍 {item.location}</Text>
        : null}
    </View>
  );

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.container}>
        {/* Add button */}
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(!showForm)}>
          <Text style={styles.addBtnText}>{showForm ? '✕ Đóng' : '+ Tạo lịch học'}</Text>
        </TouchableOpacity>

        {showForm && (
          <ScrollView style={styles.form}>
            <Text style={styles.label}>Kỹ năng trao đổi</Text>
            <TextInput style={styles.input} value={skill} onChangeText={setSkill} placeholder="VD: Guitar, Python..." />

            <Text style={styles.label}>Tên người cùng học</Text>
            <TextInput style={styles.input} value={partnerName} onChangeText={setPartnerName} placeholder="Nhập tên" />

            <Text style={styles.label}>Ngày (DD/MM/YYYY)</Text>
            <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="VD: 20/05/2026" />

            <Text style={styles.label}>Giờ (HH:MM)</Text>
            <TextInput style={styles.input} value={time} onChangeText={setTime} placeholder="VD: 14:30" />

            <Text style={styles.label}>Hình thức</Text>
            <View style={styles.modeRow}>
              {MODES.map(m => (
                <TouchableOpacity
                  key={m}
                  style={[styles.modeOption, mode === m && styles.modeActive]}
                  onPress={() => setMode(m)}
                >
                  <Text style={[styles.modeOptionText, mode === m && { color: '#fff' }]}>{m}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {mode === 'Online' && (
              <>
                <Text style={styles.label}>Link video call</Text>
                <TextInput style={styles.input} value={videoLink} onChangeText={setVideoLink} placeholder="https://meet.google.com/..." />
              </>
            )}
            {mode === 'Offline' && (
              <>
                <Text style={styles.label}>Địa điểm</Text>
                <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="VD: Thư viện trường, Café A..." />
              </>
            )}

            <TouchableOpacity style={styles.saveBtn} onPress={createSchedule} disabled={saving}>
              <Text style={styles.saveBtnText}>{saving ? 'Đang lưu...' : 'Tạo lịch'}</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        <FlatList
          data={schedules}
          keyExtractor={i => i.id}
          renderItem={renderSchedule}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <Text style={styles.empty}>Chưa có lịch học nào. Hãy tạo lịch học đầu tiên!</Text>
          }
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  addBtn: {
    backgroundColor: colors.primary, margin: 16, padding: 14,
    borderRadius: 12, alignItems: 'center',
  },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  form: { backgroundColor: colors.surface, paddingHorizontal: 16, paddingBottom: 10 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginTop: 12, marginBottom: 5 },
  input: {
    backgroundColor: colors.background, padding: 12, borderRadius: 10,
    borderWidth: 1, borderColor: colors.border, fontSize: 14,
  },
  modeRow: { flexDirection: 'row', gap: 10 },
  modeOption: {
    flex: 1, padding: 12, borderRadius: 10,
    borderWidth: 1.5, borderColor: colors.border, alignItems: 'center',
  },
  modeActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  modeOptionText: { fontWeight: '600', color: colors.text },
  saveBtn: {
    backgroundColor: colors.secondary, padding: 14, borderRadius: 12,
    alignItems: 'center', marginVertical: 14,
  },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  card: {
    backgroundColor: colors.surface, borderRadius: 14, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: colors.border, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardSkill: { fontSize: 17, fontWeight: 'bold', color: colors.primary },
  modeBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  online: { backgroundColor: '#E8F5E9' },
  offline: { backgroundColor: '#FFF3E0' },
  modeText: { fontWeight: '600', fontSize: 12 },
  cardText: { fontSize: 14, color: colors.text, marginTop: 4 },
  cardLink: { fontSize: 13, color: colors.secondary, marginTop: 4 },
  empty: { textAlign: 'center', color: colors.textLight, marginTop: 40, fontSize: 15 },
});
