# SkillSwap

SkillSwap is a 1-1 skill exchange platform for students. It allows users to list skills they can teach and skills they want to learn, and matches them with suitable partners.

## Tech Stack
- Frontend: React Native (Expo)
- Backend: Firebase
  - Firebase Authentication (Email/Password)
  - Cloud Firestore (Users, Matches, Chats, Schedules, Reviews)
- Navigation: React Navigation

## Setup & Run Instructions

### Prerequisites
- Node.js installed
- npm or yarn installed
- Expo CLI installed globally (`npm install -g expo-cli`)
- A Firebase project

### Installation

1. Clone the repository:
   ```bash
   git clone <repository_url>
   cd SkillSwap
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Firebase Configuration:
   - Go to `src/config/firebase.js`
   - Replace the mock `firebaseConfig` object with your actual Firebase project configuration.
   - Make sure Authentication (Email/Password) and Firestore are enabled in your Firebase Console.

4. Run the app:
   ```bash
   npm start
   # or
   npx expo start
   ```
   Press `a` to open in Android Emulator, or scan the QR code with the Expo Go app on your physical device.

## Completed Features
- Setup React Native Expo project structure.
- Navigation flow (Auth Stack, App Bottom Tabs).
- UI Screens (Login, Register, Home, Profile, Match, Chat, Schedule, Review).
- Mock Authentication logic.
- Theme configuration (Purple/Blue).
