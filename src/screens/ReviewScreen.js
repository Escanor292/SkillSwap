import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, ScrollView,
  KeyboardAvoidingView, Platform
} from 'react-native';
import {
  collection, addDoc, query, where, onSnapshot, orderBy, doc, updateDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { AuthContext } from '../context/AuthContext';
import { colors } from '../theme/colors';

// Star Rating component
function StarRating({ rating, onRate }) {
  return (
    <View style={{ flexDirection: 'row', marginVertical: 8 }}>
      {[1, 2, 3, 4, 5].map(star => (
        <TouchableOpacity key={star} onPress={() => onRate && onRate(star)}>
          <Text style={{ fontSize: 32, color: star <= rating ? '#FFC107' : '#ccc', marginRight: 4 }}>★</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function ReviewScreen() {
  const { user } = useContext(AuthContext);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [receiverName, setReceiverName] = useState('');
  const [skill, setSkill] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Listen to reviews given by current user
    const q = query(
      collection(db, 'reviews'),
      where('reviewerId', '==', user.uid)
    );
    const unsub = onSnapshot(q, snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setReviews(list);
      setLoading(false);
    });
    return unsub;
  }, []);

  const submitReview = async () => {
    if (!receiverName || !comment) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ tên và nhận xét');
      return;
    }
    setSaving(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        reviewerId: user.uid,
        receiverName,
        skill,
        rating,
        comment,
        createdAt: new Date().toISOString(),
      });
      Alert.alert('Thành công', 'Đánh giá đã được gửi!');
      setShowForm(false);
      setReceiverName(''); setSkill(''); setRating(5); setComment('');
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    } finally {
      setSaving(false);
    }
  };

  const renderStars = (r) => '★'.repeat(r) + '☆'.repeat(5 - r);

  const renderReview = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardName}>{item.receiverName}</Text>
        <Text style={styles.stars}>{renderStars(item.rating)}</Text>
      </View>
      {item.skill ? <Text style={styles.skill}>Kỹ năng: {item.skill}</Text> : null}
      <Text style={styles.comment}>"{item.comment}"</Text>
      <Text style={styles.date}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : ''}</Text>
    </View>
  );

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.container}>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(!showForm)}>
          <Text style={styles.addBtnText}>{showForm ? '✕ Đóng' : '+ Viết đánh giá'}</Text>
        </TouchableOpacity>

        {showForm && (
          <ScrollView style={styles.form}>
            <Text style={styles.label}>Tên người được đánh giá</Text>
            <TextInput style={styles.input} value={receiverName} onChangeText={setReceiverName} placeholder="Nhập tên" />

            <Text style={styles.label}>Kỹ năng đã trao đổi</Text>
            <TextInput style={styles.input} value={skill} onChangeText={setSkill} placeholder="VD: Guitar, Python..." />

            <Text style={styles.label}>Xếp hạng</Text>
            <StarRating rating={rating} onRate={setRating} />

            <Text style={styles.label}>Nhận xét</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              value={comment} onChangeText={setComment}
              placeholder="Viết nhận xét của bạn..."
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
          ListEmptyComponent={
            <Text style={styles.empty}>Chưa có đánh giá nào. Hãy viết đánh giá đầu tiên!</Text>
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
  multiline: { height: 100, textAlignVertical: 'top' },
  saveBtn: {
    backgroundColor: colors.secondary, padding: 14, borderRadius: 12,
    alignItems: 'center', marginVertical: 14,
  },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  card: {
    backgroundColor: colors.surface, borderRadius: 14, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: colors.border, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardName: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  stars: { fontSize: 18, color: '#FFC107' },
  skill: { fontSize: 13, color: colors.secondary, marginTop: 4 },
  comment: { fontSize: 14, color: colors.text, fontStyle: 'italic', marginTop: 6 },
  date: { fontSize: 11, color: colors.textLight, marginTop: 6 },
  empty: { textAlign: 'center', color: colors.textLight, marginTop: 40, fontSize: 15 },
});
