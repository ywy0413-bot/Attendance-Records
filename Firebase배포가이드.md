# Firebase 배포 가이드

이 가이드는 휴가 및 근태 신고 시스템을 Firebase에 배포하는 방법을 설명합니다.

## 1. Firebase 프로젝트 생성

### 1.1 Firebase Console 접속
https://console.firebase.google.com/ 접속

### 1.2 새 프로젝트 생성
1. "프로젝트 추가" 클릭
2. 프로젝트 이름 입력 (예: attendance-records)
3. Google Analytics 활성화 (선택사항)
4. 프로젝트 생성 완료

## 2. Firebase 설정

### 2.1 Firestore 데이터베이스 생성
1. Firebase Console에서 "Firestore Database" 선택
2. "데이터베이스 만들기" 클릭
3. 프로덕션 모드 또는 테스트 모드 선택
4. 위치 선택 (asia-northeast3 - 서울 권장)

### 2.2 웹 앱 추가
1. 프로젝트 설정 (톱니바퀴 아이콘) 클릭
2. "내 앱" 섹션에서 웹 아이콘 (</>) 클릭
3. 앱 닉네임 입력
4. "Firebase Hosting 설정" 체크
5. 앱 등록

### 2.3 Firebase 구성 정보 복사
웹 앱 등록 후 표시되는 구성 정보를 복사합니다:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

이 정보를 [firebase-config.js](firebase-config.js) 파일에 붙여넣습니다.

## 3. Firebase CLI 설치 및 설정

### 3.1 Node.js 및 npm 설치 확인
```bash
node --version
npm --version
```

### 3.2 Firebase CLI 설치
```bash
npm install -g firebase-tools
```

### 3.3 Firebase 로그인
```bash
firebase login
```
브라우저가 열리면 Google 계정으로 로그인합니다.

### 3.4 Firebase 프로젝트 초기화
프로젝트 디렉토리에서 실행:
```bash
firebase init
```

선택 사항:
- **Hosting**: 정적 파일 호스팅
- **Firestore**: 데이터베이스 규칙 및 인덱스

설정:
- 기존 프로젝트 선택
- public 디렉토리: `public`
- SPA 설정: `No`
- 자동 빌드: `No`

## 4. 파일 구조 준비

### 4.1 public 폴더 생성 및 파일 복사
```bash
mkdir public
```

다음 파일들을 `public` 폴더로 복사:
- index.html
- login.html
- leave-form.html
- attendance-form.html
- admin.html
- style.css
- auth.js
- login-firebase.js (login.js 대신 사용)
- leave-form.js
- attendance-form.js
- admin.js
- firebase-config.js

### 4.2 login.html 수정
`public/login.html` 파일에서 Firebase SDK 추가:

```html
<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>

<script src="firebase-config.js"></script>
<script src="login-firebase.js"></script>
```

## 5. 관리자 계정 생성

### 5.1 Firebase Console에서 Firestore 열기
1. Firestore Database 선택
2. "컬렉션 시작" 클릭
3. 컬렉션 ID: `users`

### 5.2 관리자 문서 추가
첫 번째 관리자 계정 수동 추가:

**문서 ID**: admin@company.com

**필드**:
- email (string): admin@company.com
- name (string): 관리자
- pin (string): 0000
- department (string): 관리팀
- createdAt (timestamp): 현재 시간

## 6. Firebase 배포

### 6.1 배포 실행
```bash
firebase deploy
```

### 6.2 배포 확인
배포가 완료되면 Hosting URL이 표시됩니다:
```
Hosting URL: https://YOUR_PROJECT_ID.web.app
```

## 7. 접속 및 테스트

### 7.1 모바일에서 접속
```
https://YOUR_PROJECT_ID.web.app
```

### 7.2 로그인 테스트
- 이메일: admin@company.com
- PIN: 0000

### 7.3 관리자 페이지에서 사용자 추가
로그인 후 관리자 페이지에서 새 사용자를 추가할 수 있습니다.

## 8. 이메일 발송 설정 (옵션)

Firebase에서 이메일을 발송하려면 Firebase Functions를 사용해야 합니다.

### 8.1 Firebase Functions 설정
```bash
firebase init functions
```

### 8.2 Nodemailer 설치
```bash
cd functions
npm install nodemailer
```

### 8.3 환경 변수 설정
```bash
firebase functions:config:set gmail.email="your-email@company.com" gmail.password="your-app-password"
```

### 8.4 Functions 배포
```bash
firebase deploy --only functions
```

## 9. 도메인 연결 (옵션)

사용자 정의 도메인을 연결하려면:
1. Firebase Console → Hosting → 도메인 추가
2. 도메인 입력 및 확인
3. DNS 레코드 추가

## 10. 보안 강화

### 10.1 Firestore 규칙 강화
[firestore.rules](firestore.rules) 파일 수정:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null &&
                      request.auth.token.email in ['admin@company.com', 'manager@company.com'];
    }
  }
}
```

### 10.2 Firebase Authentication 추가
더 강력한 보안을 위해 Firebase Authentication 사용을 권장합니다.

## 문제 해결

### 배포 오류
```bash
firebase deploy --debug
```

### Firestore 규칙 테스트
Firebase Console → Firestore → 규칙 → 시뮬레이터

### 로그 확인
```bash
firebase functions:log
```

## 업데이트

코드를 수정한 후:
```bash
firebase deploy
```

특정 서비스만 배포:
```bash
firebase deploy --only hosting
firebase deploy --only firestore
firebase deploy --only functions
```

## 비용

- Firebase Spark 플랜 (무료):
  - Hosting: 10GB/월
  - Firestore: 1GB 저장공간, 50,000 읽기/일
  - Functions: 125,000 호출/월

대부분의 소규모 조직에서는 무료 플랜으로 충분합니다.

## 지원

문제가 발생하면 Firebase 문서를 참조하세요:
https://firebase.google.com/docs
