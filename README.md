# 휴가 및 근태 신고 시스템

구성원들의 휴가와 근태 상황을 웹 페이지를 통해 신고하고 전사에 메일로 자동 공지하는 시스템입니다.

## 주요 기능

### 1. 휴가 신고
- **전일휴가**: 하루 전체 휴가
- **반차휴가**: 반일 휴가
- **반반차휴가**: 반일의 절반 휴가
- **경조휴가**: 경조사 관련 휴가 (결혼, 사망 등)

### 2. 근태 신고
- **출근지연**: 지각 신고
- **외출**: 근무 중 외출
- **조기퇴근**: 정규 퇴근 시간 전 퇴근
- **당직**: 당직 근무

## 기술 스택

- **프론트엔드**: HTML5, CSS3, JavaScript (Vanilla)
- **백엔드**: Node.js, Express
- **메일 발송**: Nodemailer

## 설치 방법

### 1. 사전 요구사항
- Node.js (v14 이상)
- npm 또는 yarn

### 2. 프로젝트 클론 및 설치

```bash
# 의존성 설치
npm install
```

### 3. 환경 변수 설정

`.env.example` 파일을 복사하여 `.env` 파일을 생성합니다:

```bash
cp .env.example .env
```

`.env` 파일을 열어 이메일 설정을 입력합니다:

```env
PORT=3000
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_TO=company-all@company.com
```

#### Gmail 사용 시 앱 비밀번호 생성 방법

1. Google 계정 설정으로 이동: https://myaccount.google.com/
2. "보안" 섹션으로 이동
3. "2단계 인증" 활성화 (필수)
4. "앱 비밀번호" 생성: https://myaccount.google.com/apppasswords
5. "앱 선택" → "메일" 선택
6. "기기 선택" → "기타" 선택 후 "휴가신고시스템" 입력
7. 생성된 16자리 비밀번호를 `EMAIL_PASSWORD`에 입력

#### 다른 이메일 서비스 사용 시

**Naver 메일**:
```env
EMAIL_SERVICE=naver
EMAIL_USER=your-email@naver.com
EMAIL_PASSWORD=your-password
```

**Outlook/Hotmail**:
```env
EMAIL_SERVICE=outlook
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

### 4. 서버 실행

```bash
# 프로덕션 모드
npm start

# 개발 모드 (nodemon 사용)
npm run dev
```

서버가 정상적으로 실행되면 다음 메시지가 표시됩니다:
```
서버가 포트 3000에서 실행 중입니다.
http://localhost:3000 에서 접속 가능합니다.
```

## 사용 방법

### 1. 웹 페이지 접속
브라우저에서 `http://localhost:3000` 로 접속합니다.

### 2. 휴가 신고
1. "휴가 신고" 탭 선택
2. 필수 항목 입력:
   - 신고자: 이름 입력
   - 휴가일수: 드롭다운에서 선택
   - 일자: 날짜 선택
   - 시간: 시간 선택
   - 경조휴가 선택 시: 경조휴가 종류 선택
3. "신고하기" 버튼 클릭
4. 이메일이 자동으로 전송됩니다

### 3. 근태 신고
1. "근태 신고" 탭 선택
2. 필수 항목 입력:
   - 신고자: 이름 입력
   - 근태내용: 드롭다운에서 선택
   - 일자: 날짜 선택
   - 시간: 시간 선택
   - 사유: 상세 사유 입력
3. "신고하기" 버튼 클릭
4. 이메일이 자동으로 전송됩니다

## 프로젝트 구조

```
leave-attendance-system/
├── public/
│   ├── index.html      # 메인 HTML 페이지
│   ├── style.css       # 스타일시트
│   └── script.js       # 클라이언트 JavaScript
├── server.js           # Express 서버 및 메일 발송 로직
├── package.json        # 프로젝트 의존성
├── .env.example        # 환경 변수 예시
├── .gitignore          # Git 무시 파일
└── README.md           # 프로젝트 문서
```

## API 엔드포인트

### POST `/api/submit-leave`
휴가 신고를 처리하고 이메일을 발송합니다.

**요청 본문**:
```json
{
  "reporter": "홍길동",
  "leaveType": "전일휴가",
  "date": "2024-01-15",
  "time": "09:00",
  "specialLeaveType": null
}
```

**응답**:
```json
{
  "success": true,
  "message": "휴가 신고가 성공적으로 전송되었습니다."
}
```

### POST `/api/submit-attendance`
근태 신고를 처리하고 이메일을 발송합니다.

**요청 본문**:
```json
{
  "reporter": "홍길동",
  "attendanceType": "출근지연",
  "date": "2024-01-15",
  "time": "10:30",
  "reason": "교통 체증으로 인한 지연"
}
```

**응답**:
```json
{
  "success": true,
  "message": "근태 신고가 성공적으로 전송되었습니다."
}
```

## 문제 해결

### 메일 발송 실패 시
1. `.env` 파일의 이메일 설정 확인
2. Gmail 사용 시 앱 비밀번호 사용 여부 확인
3. 2단계 인증 활성화 여부 확인
4. 네트워크 방화벽 설정 확인

### 포트 충돌 시
`.env` 파일에서 `PORT` 값을 변경합니다:
```env
PORT=8080
```

## 커스터마이징

### 수신자 이메일 여러 개 설정
`.env` 파일에서 쉼표로 구분하여 입력:
```env
EMAIL_TO=hr@company.com,admin@company.com,team@company.com
```

### 이메일 템플릿 수정
`server.js` 파일의 `emailBody` 변수를 수정하여 이메일 템플릿을 커스터마이징할 수 있습니다.

### 스타일 변경
`public/style.css` 파일을 수정하여 웹 페이지 디자인을 변경할 수 있습니다.

## 라이센스

ISC

## 기여

버그 리포트나 기능 제안은 이슈를 통해 제출해주세요.
