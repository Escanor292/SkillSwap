import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, FlatList, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, Linking, Modal
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
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [dateText, setDateText] = useState('');
  const [timeText, setTimeText] = useState('');
  const [showDateModal, setShowDateModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
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

  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatTime = (date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const selectDate = (day, month, year) => {
    const newDate = new Date(year, month - 1, day);
    setSelectedDate(newDate);
    setDateText(formatDate(newDate));
    setShowDateModal(false);
  };

  const selectTime = (hours, minutes) => {
    const newTime = new Date();
    newTime.setHours(hours);
    newTime.setMinutes(minutes);
    setSelectedTime(newTime);
    setTimeText(formatTime(newTime));
    setShowTimeModal(false);
  };

  const parseDateText = () => {
    if (!dateText.trim()) {
      setDateText(formatDate(selectedDate));
      return;
    }
    
    const parts = dateText.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      const year = parseInt(parts[2]);
      
      if (!isNaN(day) && !isNaN(month) && !isNaN(year) && 
          day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2024) {
        const newDate = new Date(year, month - 1, day);
        setSelectedDate(newDate);
        setDateText(formatDate(newDate));
      } else {
        Alert.alert('Lỗi', 'Ngày không hợp lệ. Vui lòng nhập theo định dạng DD/MM/YYYY');
        setDateText(formatDate(selectedDate));
      }
    } else {
      Alert.alert('Lỗi', 'Vui lòng nhập theo định dạng DD/MM/YYYY (VD: 20/05/2026)');
      setDateText(formatDate(selectedDate));
    }
  };

  const parseTimeText = () => {
    if (!timeText.trim()) {
      setTimeText(formatTime(selectedTime));
      return;
    }
    
    const parts = timeText.split(':');
    if (parts.length === 2) {
      const hours = parseInt(parts[0]);
      const minutes = parseInt(parts[1]);
      
      if (!isNaN(hours) && !isNaN(minutes) && 
          hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        const newTime = new Date(selectedTime);
        newTime.setHours(hours);
        newTime.setMinutes(minutes);
        setSelectedTime(newTime);
        setTimeText(formatTime(newTime));
      } else {
        Alert.alert('Lỗi', 'Giờ không hợp lệ. Vui lòng nhập theo định dạng HH:MM (00-23:00-59)');
        setTimeText(formatTime(selectedTime));
      }
    } else {
      Alert.alert('Lỗi', 'Vui lòng nhập theo định dạng HH:MM (VD: 14:30)');
      setTimeText(formatTime(selectedTime));
    }
  };

  const createSchedule = async () => {
    if (!skill || !selectedPartner) {
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
        date: formatDate(selectedDate),
        time: formatTime(selectedTime),
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
    setSkill(''); 
    const now = new Date();
    setSelectedDate(now);
    setSelectedTime(now);
    setDateText(formatDate(now));
    setTimeText(formatTime(now));
    setLocation('');
    setPartnerSearch(''); 
    setPartnerResults([]); 
    setSelectedPartner(null);
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
                <TouchableOpacity 
                  style={styles.dateTimeButton} 
                  onPress={() => setShowDateModal(true)}
                >
                  <Text style={styles.dateTimeText}>📅 Chọn từ danh sách</Text>
                </TouchableOpacity>
                <TextInput 
                  style={[styles.input, { marginTop: 8 }]}
                  value={dateText}
                  onChangeText={setDateText}
                  onFocus={() => {
                    if (!dateText) setDateText(formatDate(selectedDate));
                  }}
                  onBlur={parseDateText}
                  placeholder="DD/MM/YYYY (VD: 20/05/2026)"
                  keyboardType="numbers-and-punctuation"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Giờ</Text>
                <TouchableOpacity 
                  style={styles.dateTimeButton} 
                  onPress={() => setShowTimeModal(true)}
                >
                  <Text style={styles.dateTimeText}>⏰ Chọn từ danh sách</Text>
                </TouchableOpacity>
                <TextInput 
                  style={[styles.input, { marginTop: 8 }]}
                  value={timeText}
                  onChangeText={setTimeText}
                  onFocus={() => {
                    if (!timeText) setTimeText(formatTime(selectedTime));
                  }}
                  onBlur={parseTimeText}
                  placeholder="HH:MM (VD: 14:30)"
                  keyboardType="numbers-and-punctuation"
                />
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

        {/* Date Picker Modal */}
        <Modal visible={showDateModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Chọn ngày</Text>
              <ScrollView style={{ maxHeight: 300 }}>
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                  <TouchableOpacity
                    key={day}
                    style={styles.modalItem}
                    onPress={() => {
                      const today = new Date();
                      selectDate(day, today.getMonth() + 1, today.getFullYear());
                    }}
                  >
                    <Text style={styles.modalItemText}>
                      {String(day).padStart(2, '0')}/{String(new Date().getMonth() + 1).padStart(2, '0')}/{new Date().getFullYear()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowDateModal(false)}>
                <Text style={styles.modalCloseBtnText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Time Picker Modal */}
        <Modal visible={showTimeModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Chọn giờ</Text>
              <ScrollView style={{ maxHeight: 300 }}>
                {Array.from({ length: 24 }, (_, h) => 
                  [0, 30].map(m => (
                    <TouchableOpacity
                      key={`${h}-${m}`}
                      style={styles.modalItem}
                      onPress={() => selectTime(h, m)}
                    >
                      <Text style={styles.modalItemText}>
                        {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))
                ).flat()}
              </ScrollView>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowTimeModal(false)}>
                <Text style={styles.modalCloseBtnText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  dateTimeButton: { 
    backgroundColor: colors.background, 
    padding: 12, 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateTimeText: { 
    fontSize: 14, 
    color: colors.text, 
    fontWeight: '600' 
  },
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '70%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 15, textAlign: 'center' },
  modalItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalItemText: { fontSize: 16, color: colors.text, textAlign: 'center' },
  modalCloseBtn: { backgroundColor: colors.error, padding: 14, borderRadius: 10, marginTop: 10, alignItems: 'center' },
  modalCloseBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
});
