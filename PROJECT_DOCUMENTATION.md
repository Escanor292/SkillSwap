# 📱 TÀI LIỆU DỰ ÁN SKILLSWAP

## 🎯 TỔNG QUAN DỰ ÁN

**SkillSwap** là ứng dụng mobile kết nối sinh viên để trao đổi kỹ năng với nhau, giúp tiết kiệm chi phí học tập và xây dựng cộng đồng học tập hiệu quả.

### Thông tin cơ bản
- **Tên dự án**: SkillSwap
- **Phiên bản**: 1.0.0
- **Nền tảng**: React Native (Expo)
- **Backend**: Firebase (Firestore + Authentication)
- **Ngôn ngữ**: JavaScript (React)

---

## 🛠️ CÔNG NGHỆ SỬ DỤNG

### Frontend
- **React Native**: 0.83.6
- **Expo**: 55.0.24
- **React**: 19.2.0
- **React Navigation**: 7.x
  - @react-navigation/native
  - @react-navigation/stack
  - @react-navigation/bottom-tabs

### Backend & Database
- **Firebase**: 12.13.0
  - Firebase Authentication (Email/Password)
  - Cloud Firestore (NoSQL Database)
  - Real-time listeners

### Storage & State Management
- **AsyncStorage**: 2.2.0 (Local persistence)
- **React Context API**: Quản lý state authentication

### UI & Icons
- **Expo Vector Icons**: Ionicons
- **React Native Safe Area Context**: 5.6.0
- **React Native Screens**: 4.23.0

---

## 📁 CẤU TRÚC DỰ ÁN

```
SkillSwap/
├── App.js                          # Entry point
├── index.js                        # Register root component
├── app.json                        # Expo configuration
├── package.json                    # Dependencies
├── MATCHING_LOGIC.md              # Tài liệu thuật toán ghép cặp
├── PROJECT_DOCUMENTATION.md       # File này
│
├── assets/                         # Hình ảnh, icons
│   ├── icon.png
│   ├── splash-icon.png
│   ├── adaptive-icon.png
│   └── favicon.png
│
└── src/
    ├── config/
    │   └── firebase.js            # Firebase configuration
    │
    ├── context/
    │   └── AuthContext.js         # Authentication context
    │
    ├── navigation/
    │   ├── RootNavigator.js       # Root navigation logic
    │   ├── AuthNavigator.js       # Login/Register stack
    │   └── AppNavigator.js        # Main app tabs
    │
    ├── screens/
    │   ├── LoginScreen.js         # Đăng nhập
    │   ├── RegisterScreen.js      # Đăng ký
    │   ├── HomeScreen.js          # Trang chủ
    │   ├── MatchScreen.js         # Ghép cặp kỹ năng
    │   ├── ChatScreen.js          # Danh sách chat
    │   ├── ChatRoomScreen.js      # Phòng chat 1-1
    │   ├── ScheduleScreen.js      # Quản lý lịch học
    │   ├── ProfileScreen.js       # Hồ sơ cá nhân
    │   └── ReviewScreen.js        # Đánh giá
    │
    └── theme/
        └── colors.js              # Color palette
```

---

## 🔐 HỆ THỐNG XÁC THỰC

### Luồng Authentication

```
User chưa đăng nhập
    ↓
AuthNavigator (Login/Register)
    ↓
Firebase Authentication
    ↓
Tạo user document trong Firestore
    ↓
AuthContext cập nhật state
    ↓
AppNavigator (Main App)
```

### AuthContext API

```javascript
{
  isAuthenticated: boolean,    // Trạng thái đăng nhập
  user: Object,                // Firebase user object
  loading: boolean,            // Loading state
  login(email, password),      // Đăng nhập
  register(name, email, password), // Đăng ký
  logout()                     // Đăng xuất
}
```

### User Document Structure (Firestore)

```javascript
users/{uid} = {
  uid: string,
  name: string,
  email: string,
  school: string,              // Trường/Lớp
  bio: string,                 // Giới thiệu bản thân
  skillsToTeach: string[],     // Kỹ năng có thể dạy
  skillsToLearn: string[],     // Kỹ năng muốn học
  averageRating: number,       // Đánh giá trung bình
  createdAt: string            // ISO timestamp
}
```

---

## 📱 CÁC MÀN HÌNH CHÍNH

### 1. 🏠 HomeScreen - Trang chủ

**Chức năng:**
- Hiển thị thống kê cá nhân (số kỹ năng, lịch học, rating)
- Cảnh báo nếu hồ sơ chưa hoàn thiện
- Gợi ý 5 sinh viên ngẫu nhiên
- Pull-to-refresh để tải lại dữ liệu

**Dữ liệu hiển thị:**
- Số kỹ năng có thể dạy
- Số lịch học đã đặt
- Đánh giá trung bình (5.0 stars)

**UI Components:**
- Welcome banner với tên user
- 3 stat cards (Skills, Schedules, Rating)
- Warning banner (nếu profile chưa đầy đủ)
- Danh sách user cards

---

### 2. 🤝 MatchScreen - Ghép cặp kỹ năng

**Thuật toán ghép cặp:**

#### Ghép cặp 1 chiều (One-way Match)
```
User B có thể dạy thứ User A muốn học
Điều kiện: B.skillsToTeach ∩ A.skillsToLearn ≠ ∅
Badge: ✅ "Có thể dạy bạn"
```

#### Ghép cặp 2 chiều (Two-way Match) ⭐ Ưu tiên
```
User B có thể dạy A VÀ A có thể dạy B
Điều kiện: 
  - B.skillsToTeach ∩ A.skillsToLearn ≠ ∅
  - A.skillsToTeach ∩ B.skillsToLearn ≠ ∅
Badge: 🔄 "Match 2 chiều"
```

**Chức năng:**
- Tìm kiếm theo tên, trường, kỹ năng
- Sắp xếp: 2-way match → 1-way match → others
- Hiển thị kỹ năng dạy/học của mỗi người
- Nút "💬 Nhắn tin ngay" để bắt đầu chat

**Lợi ích ghép cặp 2 chiều:**
- Trao đổi công bằng (win-win)
- Cam kết cao hơn
- Tiết kiệm chi phí
- Xây dựng mối quan hệ bền vững

---

### 3. 💬 ChatScreen - Danh sách tin nhắn

**Chức năng:**
- Hiển thị tất cả cuộc trò chuyện
- Real-time updates (Firestore onSnapshot)
- Sắp xếp theo thời gian cập nhật mới nhất
- Hiển thị tin nhắn cuối cùng

**Data Structure:**
```javascript
chats/{chatId} = {
  participants: [uid1, uid2],
  lastMessage: string,
  updatedAt: string
}
```

---

### 4. 💭 ChatRoomScreen - Phòng chat 1-1

**Chức năng:**
- Chat real-time giữa 2 người
- Tự động scroll xuống tin mới nhất
- Phân biệt tin của mình (bên phải) vs người khác (bên trái)
- Input multiline

**Data Structure:**
```javascript
messages/{messageId} = {
  chatId: string,
  senderId: string,
  text: string,
  createdAt: string
}
```

**Real-time Listener:**
```javascript
query(
  collection(db, 'messages'),
  where('chatId', '==', chatId)
)
```

---

### 5. 📅 ScheduleScreen - Quản lý lịch học

**Chức năng chính:**

#### A. Tạo lời mời học tập
- Tìm kiếm và chọn bạn học
- Nhập kỹ năng trao đổi
- Chọn ngày/giờ
- Chọn hình thức: Online (Jitsi) hoặc Offline (địa điểm)

#### B. Quản lý lịch học
- Lịch đã gửi (status: pending)
- Lời mời nhận được (có thể accept/reject)
- Lịch đã xác nhận (status: accepted)

#### C. Tham gia buổi học
- Nút "📹 Vào buổi học ngay" (chỉ hiện khi accepted + Online)
- Tự động mở Jitsi Meet với room ID duy nhất
- Format: `https://meet.jit.si/SkillSwap_{scheduleId}`

**Data Structure:**
```javascript
schedules/{scheduleId} = {
  creatorId: string,
  creatorName: string,
  partnerId: string,
  partnerName: string,
  participants: [uid1, uid2],
  skill: string,
  date: string,              // "20/05/2026"
  time: string,              // "14:30"
  mode: "Online" | "Offline",
  location: string,          // Chỉ có khi Offline
  status: "pending" | "accepted" | "rejected",
  createdAt: string
}
```

**Status Flow:**
```
pending → accepted (Chấp nhận)
        → rejected (Từ chối)
```

---

### 6. ⭐ ReviewScreen - Đánh giá

**Chức năng:**

#### A. Viết đánh giá
- Chỉ có thể đánh giá người đã học cùng (accepted schedule)
- Chọn bạn từ danh sách partners
- Nhập kỹ năng đã học/dạy
- Xếp hạng 1-5 sao
- Viết nhận xét chi tiết

#### B. Review Wall
- Hiển thị tất cả đánh giá từ cộng đồng
- Sắp xếp theo mới nhất
- Hiển thị: Người đánh giá → Người nhận, kỹ năng, rating, comment

**Data Structure:**
```javascript
reviews/{reviewId} = {
  senderId: string,
  senderName: string,
  receiverId: string,
  receiverName: string,
  skill: string,
  rating: number,            // 1-5
  comment: string,
  createdAt: string
}
```

---

### 7. 👤 ProfileScreen - Hồ sơ cá nhân

**Chức năng:**
- Chỉnh sửa thông tin cá nhân
- Cập nhật kỹ năng dạy/học
- Đăng xuất

**Form Fields:**
- Họ và tên
- Trường/Lớp
- Giới thiệu bản thân (multiline)
- Kỹ năng có thể dạy (comma-separated)
- Kỹ năng muốn học (comma-separated)

**Validation:**
- HomeScreen sẽ cảnh báo nếu:
  - Chưa có tên
  - Chưa có kỹ năng dạy

---

## 🗄️ CẤU TRÚC DATABASE (FIRESTORE)

### Collections Overview

```
firestore/
├── users/              # Thông tin người dùng
├── chats/              # Metadata cuộc trò chuyện
├── messages/           # Tin nhắn chi tiết
├── schedules/          # Lịch học & lời mời
└── reviews/            # Đánh giá
```

### Indexes Required

```javascript
// messages collection
chatId (Ascending) + createdAt (Ascending)

// schedules collection
participants (Array) + status (Ascending)

// chats collection
participants (Array) + updatedAt (Descending)
```

---

## 🎨 THEME & STYLING

### Color Palette (src/theme/colors.js)

```javascript
{
  primary: '#6C63FF',      // Purple - Main brand color
  secondary: '#4A90E2',    // Blue - Secondary actions
  background: '#F8F9FA',   // Light gray - App background
  surface: '#FFFFFF',      // White - Cards, inputs
  text: '#333333',         // Dark gray - Main text
  textLight: '#888888',    // Light gray - Secondary text
  border: '#E0E0E0',       // Light gray - Borders
  error: '#FF5252',        // Red - Errors, logout
  success: '#4CAF50',      // Green - Success, accept
  warning: '#FFC107'       // Yellow - Warnings
}
```

### Design Principles
- **Card-based UI**: Elevation, rounded corners (12-15px)
- **Consistent spacing**: 12-16px padding
- **Icon-first**: Ionicons cho mọi action
- **Status colors**: Badge với màu sắc phân biệt
- **Responsive**: Safe area handling

---

## 🔄 LUỒNG SỬ DỤNG ĐIỂN HÌNH

### Kịch bản 1: Tìm bạn học và trao đổi kỹ năng

```
1. Đăng ký/Đăng nhập
   ↓
2. Vào Profile → Cập nhật kỹ năng
   - Kỹ năng dạy: "Python, Web Development"
   - Kỹ năng học: "Guitar, Tiếng Anh"
   ↓
3. Vào Match → Tìm bạn phù hợp
   - Hệ thống hiển thị match 2 chiều ở đầu
   - Tìm thấy: Huy (dạy Guitar, muốn học Python) 🔄
   ↓
4. Nhấn "Nhắn tin ngay" → Chat với Huy
   - Trao đổi thời gian, nội dung học
   ↓
5. Vào Schedule → Tạo lời mời
   - Chọn bạn: Huy
   - Kỹ năng: Python
   - Ngày: 20/05/2026, Giờ: 14:30
   - Hình thức: Online
   ↓
6. Huy nhận lời mời → Accept
   ↓
7. Đến giờ học → Nhấn "Vào buổi học ngay"
   - Tự động mở Jitsi Meet
   - Cả hai vào cùng phòng
   ↓
8. Sau buổi học → Viết Review
   - Rating: 5 sao
   - Comment: "Giáo viên rất giỏi!"
```

### Kịch bản 2: Nhận lời mời và tham gia học

```
1. Nhận thông báo lời mời học (trong Schedule)
   ↓
2. Xem chi tiết: Kỹ năng, Ngày/Giờ, Hình thức
   ↓
3. Chấp nhận hoặc Từ chối
   ↓
4. Nếu Accept → Lịch chuyển sang "Đã xác nhận"
   ↓
5. Đến giờ → Vào buổi học
```

---

## 🚀 TÍNH NĂNG NỔI BẬT

### 1. ✅ Thuật toán ghép cặp thông minh
- Ưu tiên match 2 chiều (win-win)
- Badge đặc biệt để dễ nhận biết
- Tìm kiếm và filter linh hoạt

### 2. 📹 Video Call tự động (Jitsi Meet)
- Không cần tạo link thủ công
- Mỗi buổi học có room ID riêng
- One-click join
- Bảo mật và riêng tư

### 3. 💬 Real-time Chat
- Firestore listeners
- Cập nhật tức thì
- UI phân biệt rõ ràng

### 4. 📅 Quản lý lịch học
- Gửi/Nhận lời mời
- Accept/Reject
- Theo dõi status

### 5. ⭐ Hệ thống đánh giá
- 5-star rating
- Review wall cộng đồng
- Chỉ review người đã học cùng

### 6. 🔍 Tìm kiếm thông minh
- Search theo tên, trường, kỹ năng
- Filter real-time
- Kết quả tức thì

### 7. 🎯 Profile completion tracking
- Cảnh báo nếu thiếu thông tin
- Hướng dẫn hoàn thiện hồ sơ

---

## 🔧 CÀI ĐẶT & CHẠY DỰ ÁN

### Yêu cầu hệ thống
- Node.js 16+
- npm hoặc yarn
- Expo CLI
- Firebase project

### Cài đặt

```bash
# Clone repository
git clone <repository-url>
cd SkillSwap

# Cài đặt dependencies
npm install

# Chạy ứng dụng
npm start

# Chạy trên Android
npm run android

# Chạy trên iOS
npm run ios

# Chạy trên Web
npm run web
```

### Cấu hình Firebase

1. Tạo Firebase project tại https://console.firebase.google.com
2. Enable Authentication (Email/Password)
3. Tạo Firestore Database
4. Copy config vào `src/config/firebase.js`

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

---

## 📊 FIRESTORE SECURITY RULES

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    // Chats collection
    match /chats/{chatId} {
      allow read, write: if request.auth != null && 
        request.auth.uid in resource.data.participants;
    }
    
    // Messages collection
    match /messages/{messageId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.senderId;
    }
    
    // Schedules collection
    match /schedules/{scheduleId} {
      allow read: if request.auth != null && 
        request.auth.uid in resource.data.participants;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        request.auth.uid in resource.data.participants;
    }
    
    // Reviews collection
    match /reviews/{reviewId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.senderId;
    }
  }
}
```

---

## 🐛 XỬ LÝ LỖI & EDGE CASES

### Authentication
- ✅ Validate email format
- ✅ Kiểm tra password strength
- ✅ Handle Firebase auth errors
- ✅ Loading states

### Matching
- ✅ Handle empty skills arrays
- ✅ Case-insensitive comparison
- ✅ Show all users even if no match

### Chat
- ✅ Create chat document if not exists
- ✅ Handle empty message list
- ✅ Trim whitespace before sending

### Schedule
- ✅ Validate all required fields
- ✅ Check partner selection
- ✅ Handle accept/reject properly
- ✅ Only show join button when accepted + online

### Review
- ✅ Only allow review for accepted schedules
- ✅ Load partners from schedules
- ✅ Validate rating 1-5

---

## 🔮 TÍNH NĂNG TƯƠNG LAI

### Phase 2
- [ ] Push notifications
- [ ] In-app notifications
- [ ] User avatars (upload ảnh)
- [ ] Advanced search filters
- [ ] Skill categories

### Phase 3
- [ ] Group learning sessions
- [ ] Calendar integration
- [ ] Payment system (optional)
- [ ] Skill verification
- [ ] Achievement badges

### Phase 4
- [ ] AI-powered matching
- [ ] Video call recording
- [ ] Learning progress tracking
- [ ] Recommendation system
- [ ] Social features (follow, like)

---

## 📈 METRICS & ANALYTICS

### Key Metrics to Track
- Số lượng users đăng ký
- Số lượng matches thành công
- Số buổi học hoàn thành
- Average rating
- Chat engagement
- Schedule acceptance rate

### Suggested Tools
- Firebase Analytics
- Google Analytics
- Mixpanel
- Amplitude

---

## 🤝 ĐÓNG GÓP

### Quy trình
1. Fork repository
2. Tạo branch mới (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

### Code Style
- ESLint configuration
- Prettier formatting
- Meaningful variable names
- Comments cho logic phức tạp

---

## 📝 CHANGELOG

### Version 1.0.0 (Current)
- ✅ Authentication system
- ✅ User profiles
- ✅ Smart matching algorithm
- ✅ Real-time chat
- ✅ Schedule management
- ✅ Jitsi Meet integration
- ✅ Review system
- ✅ Search & filter

---

## 📞 LIÊN HỆ & HỖ TRỢ

### Team
- **Project Lead**: [Tên]
- **Developers**: [Tên team members]
- **Designer**: [Tên]

### Support
- Email: support@skillswap.com
- GitHub Issues: [Repository URL]
- Documentation: [Docs URL]

---

## 📄 LICENSE

[Chọn license phù hợp: MIT, Apache 2.0, etc.]

---

## 🙏 CREDITS

### Technologies
- React Native & Expo Team
- Firebase Team
- React Navigation Team
- Jitsi Meet (Open Source Video Conferencing)

### Inspiration
- Tinder (Matching UI/UX)
- WhatsApp (Chat interface)
- Calendly (Scheduling)

---

**Cập nhật lần cuối**: 16/05/2026
**Phiên bản tài liệu**: 1.0.0

---

*Tài liệu này được tạo tự động và cập nhật thường xuyên. Nếu có thắc mắc hoặc đóng góp, vui lòng liên hệ team phát triển.*
