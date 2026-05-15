import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { AuthContext } from '../context/AuthContext';
import { colors } from '../theme/colors';

export default function ProfileScreen() {
  const { user, logout } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [school, setSchool] = useState('');
  const [bio, setBio] = useState('');
  const [skillsToTeach, setSkillsToTeach] = useState('');
  const [skillsToLearn, setSkillsToLearn] = useState('');

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        const d = snap.data();
        setName(d.name || '');
        setSchool(d.school || '');
        setBio(d.bio || '');
        setSkillsToTeach((d.skillsToTeach || []).join(', '));
        setSkillsToLearn((d.skillsToLearn || []).join(', '));
      }
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name,
        school,
        bio,
        skillsToTeach: skillsToTeach.split(',').map(s => s.trim()).filter(Boolean),
        skillsToLearn: skillsToLearn.split(',').map(s => s.trim()).filter(Boolean),
      });
      Alert.alert('Thành công', 'Hồ sơ đã được cập nhật!');
    } catch (e) {
      Alert.alert('Lỗi', e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>Hồ sơ cá nhân</Text>

      <Text style={styles.label}>Họ và tên</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Nhập họ và tên" />

      <Text style={styles.label}>Trường / Lớp</Text>
      <TextInput style={styles.input} value={school} onChangeText={setSchool} placeholder="VD: ĐH Bách Khoa - CNTT K22" />

      <Text style={styles.label}>Giới thiệu bản thân</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={bio} onChangeText={setBio}
        placeholder="Mô tả ngắn về bạn..."
        multiline numberOfLines={3}
      />

      <Text style={styles.label}>Kỹ năng có thể dạy (phân cách bằng dấu phẩy)</Text>
      <TextInput style={styles.input} value={skillsToTeach} onChangeText={setSkillsToTeach} placeholder="VD: Guitar, Tiếng Anh, Python" />

      <Text style={styles.label}>Kỹ năng muốn học (phân cách bằng dấu phẩy)</Text>
      <TextInput style={styles.input} value={skillsToLearn} onChangeText={setSkillsToLearn} placeholder="VD: Vẽ, Thiết kế, Nấu ăn" />

      <TouchableOpacity style={styles.saveBtn} onPress={saveProfile} disabled={saving}>
        <Text style={styles.btnText}>{saving ? 'Đang lưu...' : 'Lưu hồ sơ'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.btnText}>Đăng xuất</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: colors.background },
  title: { fontSize: 24, fontWeight: 'bold', color: colors.primary, marginBottom: 10, marginTop: 10 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginTop: 14, marginBottom: 6 },
  input: {
    backgroundColor: colors.surface, padding: 13, borderRadius: 10,
    borderWidth: 1, borderColor: colors.border, fontSize: 15,
  },
  multiline: { height: 80, textAlignVertical: 'top' },
  saveBtn: {
    backgroundColor: colors.primary, padding: 15, borderRadius: 10,
    alignItems: 'center', marginTop: 24,
  },
  logoutBtn: {
    backgroundColor: colors.error, padding: 15, borderRadius: 10,
    alignItems: 'center', marginTop: 12,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
