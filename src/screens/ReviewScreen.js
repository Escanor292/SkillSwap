import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, ScrollView,
  KeyboardAvoidingView, Platform
} from 'react-native';
import {
  collection, addDoc, query, where, getDocs, onSnapshot
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { AuthContext } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';

const StarRating = ({ rating, onRate }) => (
  <View style={styles.starRow}>
    {[1, 2, 3, 4, 5].map(s => (
      <TouchableOpacity key={s} onPress={() => onRate && onRate(s)}>
        <Ionicons
          name={s <= rating ? 'star' : 'star-outline'}
          size={32}
          color={s <= rating ? '#FFD93D' : colors.textLight}
        />
      </TouchableOpacity>
    ))}
  </View>
);

export default function ReviewScreen() {
  const { user } = useContext(AuthContext);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [partners, setPartners] = useState([]); // List of people you've studied with

  // Form states
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [skill, setSkill] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // 1. Listen for ALL reviews to display on the wall
    const q = query(collection(db, 'reviews'));
    const unsub = onSnapshot(q, snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setReviews(list);
      setLoading(false);
    });

    loadPartners();
    return unsub;
  }, []);

  const loadPartners = async () => {
    try {
      // Find all accepted schedules involving the current user
      const q = query(
        collection(db, 'schedules'),
        where('participants', 'array-contains', user.uid),
        where('status', '==', 'accepted')
      );
      const snap = await getDocs(q);
      const uniquePartners = new Map();

      snap.forEach(d => {
        const data = d.data();
        const partnerId = data.creatorId === user.uid ? data.partnerId : data.creatorId;
        const partnerName = data.creatorId === user.uid ? data.partnerName : data.creatorName;
        if (partnerId && partnerName) {
          uniquePartners.set(partnerId, { uid: partnerId, name: partnerName });
        }
      });
      setPartners(Array.from(uniquePartners.values()));
    } catch (e) {
      console.error(e);
    }
  };

  const submitReview = async () => {
    if (!selectedPartner || !skill || !comment) {
      Alert.alert('Lỗi', 'Vui lòng chọn bạn học và điền đầy đủ nhận xét');
      return;
    }
    setSaving(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        senderId: user.uid,
        senderName: (user.email || '').split('@')[0],
        receiverId: selectedPartner.uid,
        receiverName: selectedPartner.name,
        skill,
        rating,
        comment,
        createdAt: new Date().toISOString(),
      });
      Alert.alert('Thành công', 'Cảm ơn bạn đã gửi đánh giá!');
      setShowForm(false);
      setSkill(''); setComment(''); setRating(5); setSelectedPartner(null);
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    } finally {
      setSaving(false);
    }
  };

  const renderReview = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.reviewer}>{item.senderName} ➜ {item.receiverName}</Text>
        <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>
      <Text style={styles.reviewSkill}>Kỹ năng: {item.skill}</Text>
      <StarRating rating={item.rating} />
      <Text style={styles.comment}>{item.comment}</Text>
    </View>
  );

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.container}>
        <TouchableOpacity 
          style={styles.addBtn} 
          onPress={() => {
            if (partners.length === 0) {
              Alert.alert('Thông báo', 'Bạn cần hoàn thành ít nhất một buổi học để có thể viết đánh giá!');
            } else {
              setShowForm(!showForm);
            }
          }}
        >
          <Text style={styles.addBtnText}>{showForm ? '✕ Đóng' : '+ Viết đánh giá mới'}</Text>
        </TouchableOpacity>

        {showForm && (
          <ScrollView style={styles.form}>
            <Text style={styles.label}>Chọn người bạn đã học cùng</Text>
            <View style={styles.partnerRow}>
              {partners.map(p => (
                <TouchableOpacity 
                  key={p.uid} 
                  style={[styles.partnerChip, selectedPartner?.uid === p.uid && styles.activeChip]}
                  onPress={() => setSelectedPartner(p)}
                >
                  <Text style={[styles.chipText, selectedPartner?.uid === p.uid && { color: '#fff' }]}>{p.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Kỹ năng đã học/dạy</Text>
            <TextInput style={styles.input} value={skill} onChangeText={setSkill} placeholder="VD: Guitar, Tiếng Anh..." />

            <Text style={styles.label}>Xếp hạng mức độ hài lòng</Text>
            <StarRating rating={rating} onRate={setRating} />

            <Text style={styles.label}>Nhận xét chi tiết</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              value={comment} onChangeText={setComment}
              placeholder="Chia sẻ trải nghiệm của bạn..."
              multiline numberOfLines={4}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={submitReview} disabled={saving}>
              <Text style={styles.saveBtnText}>{saving ? 'Đang gửi...' : 'Gửi đánh giá'}</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        <FlatList
          data={reviews}
          keyExtractor={i => i.id}
          renderItem={renderReview}
          contentContainerStyle={{ padding: 16 }}
          ListHeaderComponent={<Text style={styles.listHeader}>Cộng đồng đánh giá</Text>}
          ListEmptyComponent={<Text style={styles.empty}>Chưa có đánh giá nào.</Text>}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  addBtn: { backgroundColor: colors.primary, margin: 16, padding: 14, borderRadius: 12, alignItems: 'center' },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  form: { backgroundColor: colors.surface, paddingHorizontal: 16, paddingBottom: 10, maxHeight: 450 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginTop: 12, marginBottom: 5 },
  partnerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  partnerChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  activeChip: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.text },
  input: { backgroundColor: colors.background, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.border, fontSize: 14 },
  multiline: { height: 80, textAlignVertical: 'top' },
  starRow: { flexDirection: 'row', gap: 5, marginVertical: 8 },
  saveBtn: { backgroundColor: colors.secondary, padding: 14, borderRadius: 12, alignItems: 'center', marginVertical: 14 },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  listHeader: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 10 },
  card: { backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  reviewer: { fontWeight: 'bold', color: colors.primary, fontSize: 14 },
  date: { fontSize: 11, color: colors.textLight },
  reviewSkill: { fontSize: 13, color: colors.secondary, fontWeight: '600', marginBottom: 5 },
  comment: { fontSize: 14, color: colors.text, marginTop: 5, fontStyle: 'italic' },
  empty: { textAlign: 'center', color: colors.textLight, marginTop: 40 },
});
