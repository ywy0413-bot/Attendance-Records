# Firebase 배포 가이드

이 문서는 휴가 및 근태 신고 시스템을 Firebase에 배포하는 방법을 설명합니다.

## 사전 준비

### 1. Firebase CLI 설치

```bash
npm install -g firebase-tools
```

### 2. Firebase 로그인

```bash
firebase login
```

## Firebase 프로젝트 설정

### 1. Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름 입력 (예: `leave-attendance-system`)
4. 프로젝트 생성 완료

### 2. Firebase 프로젝트 연결

프로젝트 루트 디렉토리에서 실행:

```bash
firebase use --add
```

생성한 프로젝트를 선택하고 별칭(alias)을 입력합니다 (예: `default`).

또는 `.firebaserc` 파일을 직접 수정:

```json
{
  "projects": {
    "default": "your-project-id"
  }
}
```

### 3. Firebase Blaze 플랜 업그레이드

Firebase Functions에서 외부 API(메일 발송)를 사용하려면 Blaze 플랜(종량제)이 필요합니다.

1. [Firebase Console](https://console.firebase.google.com/) → 프로젝트 선택
2. 왼쪽 하단 "업그레이드" 클릭
3. Blaze 플랜 선택 및 결제 정보 등록

참고: 무료 할당량이 충분히 제공되므로 소규모 사용 시 비용이 발생하지 않을 수 있습니다.

## 이메일 설정

### 1. Gmail 앱 비밀번호 생성 (Gmail 사용 시)

1. [Google 계정](https://myaccount.google.com/) 접속
2. "보안" → "2단계 인증" 활성화 (필수)
3. "앱 비밀번호" 생성: https://myaccount.google.com/apppasswords
4. "앱 선택" → "메일", "기기 선택" → "기타" 입력
5. 생성된 16자리 비밀번호 복사

### 2. Firebase Functions 환경 변수 설정

```bash
# 이메일 서비스 설정 (gmail, naver, outlook 등)
firebase functions:config:set email.service="gmail"

# 발신 이메일 주소
firebase functions:config:set email.user="your-email@gmail.com"

# 이메일 비밀번호 또는 앱 비밀번호
firebase functions:config:set email.password="your-app-password"

# 수신 이메일 주소 (전사 공지를 받을 이메일, 쉼표로 구분 가능)
firebase functions:config:set email.to="company-all@company.com"
```

### 3. 설정 확인

```bash
firebase functions:config:get
```

출력 예시:
```json
{
  "email": {
    "service": "gmail",
    "user": "your-email@gmail.com",
    "password": "your-app-password",
    "to": "company-all@company.com"
  }
}
```

## 배포

### 1. Functions 의존성 설치

```bash
cd functions
npm install
cd ..
```

### 2. Firebase에 배포

```bash
# 전체 배포 (Hosting + Functions)
firebase deploy

# 또는 개별 배포
firebase deploy --only hosting  # 프론트엔드만
firebase deploy --only functions  # Functions만
```

### 3. 배포 완료

배포가 완료되면 다음과 같은 URL이 표시됩니다:

```
✔  Deploy complete!

Hosting URL: https://your-project-id.web.app
```

이 URL을 통해 어디서든 (PC, 모바일) 접속할 수 있습니다!

## 로컬 테스트 (선택사항)

배포 전 로컬에서 테스트하려면:

### 1. Functions 환경 변수 로컬 설정

```bash
cd functions
```

`.runtimeconfig.json` 파일 생성:

```json
{
  "email": {
    "service": "gmail",
    "user": "your-email@gmail.com",
    "password": "your-app-password",
    "to": "company-all@company.com"
  }
}
```

**주의**: `.runtimeconfig.json` 파일은 절대 Git에 커밋하지 마세요! (`.gitignore`에 포함되어 있습니다)

### 2. Firebase Emulator 실행

```bash
# 프로젝트 루트에서
firebase emulators:start
```

브라우저에서 `http://localhost:5000` 접속하여 테스트

## 업데이트

코드를 수정한 후 다시 배포:

```bash
firebase deploy
```

## 비용 관리

### 무료 할당량 (Blaze 플랜)

- **Cloud Functions**:
  - 호출 횟수: 2백만 회/월
  - 컴퓨팅 시간: 40만 GB-초/월
  - 네트워크: 5GB/월

- **Hosting**:
  - 저장 공간: 10GB
  - 전송량: 360MB/일

소규모 팀에서 사용하기에 무료 할당량으로 충분합니다.

### 비용 확인

[Firebase Console](https://console.firebase.google.com/) → 프로젝트 → 사용량 및 결제

## 문제 해결

### Functions 로그 확인

```bash
firebase functions:log
```

또는 [Firebase Console](https://console.firebase.google.com/) → Functions → 로그

### 환경 변수 재설정

잘못된 환경 변수 수정:

```bash
firebase functions:config:unset email
firebase functions:config:set email.service="gmail"
# ... 나머지 설정
firebase deploy --only functions
```

### CORS 오류

이미 `cors` 패키지가 설정되어 있어 문제없어야 하지만, 문제 발생 시 Firebase Console에서 확인하세요.

## 도메인 연결 (선택사항)

커스텀 도메인을 연결하려면:

1. [Firebase Console](https://console.firebase.google.com/) → Hosting
2. "도메인 추가" 클릭
3. 안내에 따라 DNS 설정

## 보안

- 환경 변수에 저장된 이메일 비밀번호는 Firebase Functions 내부에 암호화되어 저장됩니다.
- `.env` 파일이나 `.runtimeconfig.json` 파일을 Git에 커밋하지 마세요.
- 정기적으로 이메일 앱 비밀번호를 재생성하는 것을 권장합니다.

## 추가 기능

### Firestore 연동 (선택사항)

신고 내역을 데이터베이스에 저장하려면:

1. Firebase Console → Firestore Database 활성화
2. `functions/index.js`에서 Firestore 코드 추가
3. 재배포

예시 코드:
```javascript
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

// 휴가 신고 저장
await db.collection('leaves').add({
    reporter,
    leaveType,
    date,
    time,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
});
```

## 지원

문제가 발생하면:
1. Firebase Functions 로그 확인
2. 브라우저 개발자 도구 콘솔 확인
3. Firebase 공식 문서: https://firebase.google.com/docs
