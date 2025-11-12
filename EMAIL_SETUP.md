# 이메일 발송 기능 설정 가이드

## 개요
휴가 신고 시 자동으로 이메일을 발송하려면 로컬에서 이메일 서버를 실행해야 합니다.
Firebase 호스팅은 정적 파일만 제공하므로, 이메일 발송을 위해서는 별도의 서버가 필요합니다.

## 설정 방법

### 1. 환경 변수 파일 생성
```bash
# .env.example 파일을 .env로 복사
copy .env.example .env
```

### 2. .env 파일 편집
```
EMAIL_USER=your-email@envision.co.kr
EMAIL_PASS=your-password
COMPANY_EMAIL=wyyu@envision.co.kr
PORT=3000
```

**중요:** Office 365 계정의 경우 앱 비밀번호를 사용해야 할 수 있습니다.

### 3. 패키지 설치
```bash
npm install
```

### 4. 이메일 서버 실행
```bash
npm start
```

서버가 http://localhost:3000 에서 실행됩니다.

## 사용 방법

1. 이메일 서버를 실행한 상태에서
2. Firebase 호스팅 URL (https://attendance-records-375b6.web.app)에서 휴가 신고
3. 신고가 완료되면 자동으로 wyyu@envision.co.kr로 이메일이 발송됩니다

## 이메일 형식

**제목:** [휴가신고] 영어이름(시작일, 휴가종류, 휴가일수)
**예시:** [휴가신고] Hong Gildong(2024-01-15, 전일휴가, 1일)

**본문:** HTML 형식의 휴가 신고서 (모든 입력 정보 포함)

## 문제 해결

### 이메일이 발송되지 않는 경우
1. server.js가 실행 중인지 확인
2. .env 파일의 이메일 계정 정보가 정확한지 확인
3. Office 365 보안 설정에서 "앱 비밀번호" 사용 필요 여부 확인
4. 브라우저 콘솔에서 오류 메시지 확인

### CORS 오류가 발생하는 경우
server.js에서 CORS가 이미 활성화되어 있습니다. 그래도 문제가 있다면:
- 브라우저 캐시 삭제
- 시크릿 모드에서 테스트

## 참고사항

- 이메일 발송 실패 시에도 Firestore에 휴가 신고는 정상적으로 저장됩니다
- 이메일 서버를 중지하려면 터미널에서 Ctrl+C를 누르세요
- 프로덕션 환경에서는 이메일 서버를 별도 호스팅(Heroku, Render 등)에 배포하는 것을 권장합니다
