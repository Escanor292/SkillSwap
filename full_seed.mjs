import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, addDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCy2eoA2CwcnTyuf-OypCDct33GzevuFw4",
  authDomain: "applab7-d4d61.firebaseapp.com",
  projectId: "applab7-d4d61",
  storageBucket: "applab7-d4d61.firebasestorage.app",
  messagingSenderId: "274019733052",
  appId: "1:274019733052:web:6f29297ee6a95ec4a7bd39",
  measurementId: "G-YXWF51NH79"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const users = [
  { uid: 'u1', name: 'Nguyễn Văn A', school: 'ĐH Bách Khoa', skillsToTeach: ['Python', 'Guitar'], skillsToLearn: ['Tiếng Anh', 'Vẽ'] },
  { uid: 'u2', name: 'Trần Thị B', school: 'ĐH Ngoại Thương', skillsToTeach: ['Tiếng Anh', 'Piano'], skillsToLearn: ['Python', 'Code'] },
  { uid: 'u3', name: 'Lê Hoàng C', school: 'ĐH Kiến Trúc', skillsToTeach: ['Vẽ', 'Photoshop'], skillsToLearn: ['Tiếng Anh', 'Guitar'] },
  { uid: 'u4', name: 'Phạm Minh D', school: 'ĐH Sư Phạm', skillsToTeach: ['Toán', 'Vật Lý'], skillsToLearn: ['Piano', 'Yoga'] },
  { uid: 'u5', name: 'Đặng Thu E', school: 'ĐH Y Dược', skillsToTeach: ['Yoga', 'Nấu ăn'], skillsToLearn: ['Toán', 'Vẽ'] },
];

async function fullSeed() {
  console.log('--- Bắt đầu nạp dữ liệu toàn diện ---');

  // 1. Seed Users
  for (const u of users) {
    await setDoc(doc(db, 'users', u.uid), {
      ...u,
      bio: `Chào mọi người, mình là ${u.name} từ ${u.school}. Rất vui được trao đổi kiến thức!`,
      createdAt: new Date().toISOString()
    });
    console.log(`✅ Đã tạo User: ${u.name}`);
  }

  // 2. Seed Schedules (Lịch học)
  const schedules = [
    {
      id: 's1',
      creatorId: 'u1', creatorName: 'Nguyễn Văn A',
      partnerId: 'u2', partnerName: 'Trần Thị B',
      participants: ['u1', 'u2'],
      skill: 'Python & Tiếng Anh',
      date: '25/05/2026', time: '19:30',
      mode: 'Online', status: 'accepted',
      createdAt: new Date().toISOString()
    },
    {
      id: 's2',
      creatorId: 'u3', creatorName: 'Lê Hoàng C',
      partnerId: 'u1', partnerName: 'Nguyễn Văn A',
      participants: ['u1', 'u3'],
      skill: 'Vẽ chân dung',
      date: '28/05/2026', time: '09:00',
      mode: 'Offline', location: 'Thư viện trung tâm',
      status: 'pending',
      createdAt: new Date().toISOString()
    }
  ];

  for (const s of schedules) {
    await setDoc(doc(db, 'schedules', s.id), s);
    console.log(`✅ Đã tạo Lịch học: ${s.skill}`);
  }

  // 3. Seed Reviews (Đánh giá)
  const reviews = [
    {
      senderId: 'u2', senderName: 'Trần Thị B',
      receiverId: 'u1', receiverName: 'Nguyễn Văn A',
      skill: 'Python', rating: 5,
      comment: 'Anh A dạy rất nhiệt tình, dễ hiểu. Rất đáng học!',
      createdAt: new Date().toISOString()
    },
    {
      senderId: 'u1', senderName: 'Nguyễn Văn A',
      receiverId: 'u3', receiverName: 'Lê Hoàng C',
      skill: 'Vẽ', rating: 4,
      comment: 'Bạn C có kỹ thuật vẽ rất tốt, tuy nhiên buổi học hơi ngắn.',
      createdAt: new Date().toISOString()
    }
  ];

  for (const r of reviews) {
    await addDoc(collection(db, 'reviews'), r);
    console.log(`✅ Đã tạo Đánh giá từ ${r.senderName}`);
  }

  // 4. Seed Chat Rooms
  const chatId = 'u1_u2';
  await setDoc(doc(db, 'chats', chatId), {
    participants: ['u1', 'u2'],
    lastMessage: 'Hẹn gặp bạn vào buổi học tối nay nhé!',
    updatedAt: new Date().toISOString()
  });
  console.log('✅ Đã tạo Chat Room giữa A và B');

  console.log('--- HOÀN THÀNH NẠP DỮ LIỆU ---');
  process.exit(0);
}

fullSeed();
