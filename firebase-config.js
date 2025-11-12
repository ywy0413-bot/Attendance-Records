// Firebase 설정 파일
// Firebase Console에서 프로젝트 생성 후 설정 정보를 여기에 입력하세요
// https://console.firebase.google.com/

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);

// Firestore 데이터베이스 초기화
const db = firebase.firestore();

// 컬렉션 참조
const usersCollection = db.collection('users');
const leaveRecordsCollection = db.collection('leaveRecords');
const attendanceRecordsCollection = db.collection('attendanceRecords');
