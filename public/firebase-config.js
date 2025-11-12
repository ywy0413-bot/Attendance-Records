// Firebase 설정 파일
// Firebase Console에서 프로젝트 생성 후 설정 정보를 여기에 입력하세요
// https://console.firebase.google.com/

const firebaseConfig = {
    apiKey: "AIzaSyD0u6iVHNBMy4xHh1Vho1__YbrSHbPVGeY",
    authDomain: "attendance-records-375b6.firebaseapp.com",
    projectId: "attendance-records-375b6",
    storageBucket: "attendance-records-375b6.firebasestorage.app",
    messagingSenderId: "138536201207",
    appId: "1:138536201207:web:de68358829abf8f7699cf2"
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);

// Firestore 데이터베이스 초기화
const db = firebase.firestore();

// 컬렉션 참조
const usersCollection = db.collection('users');
const leaveRecordsCollection = db.collection('leaveRecords');
const attendanceRecordsCollection = db.collection('attendanceRecords');
