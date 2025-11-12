# 휴가 및 근태 신고 시스템

모바일 반응형 웹 기반 휴가 및 근태 신고 시스템입니다. 구성원들이 개인 모바일에서 접속하여 휴가 또는 근태를 신고할 수 있으며, 제출 시 자동으로 아웃룩 전사 메일로 발송됩니다.

## 주요 기능

### 1. 휴가 신고
- **휴가 종류**: 전일휴가, 반차휴가, 반반차휴가, 경조휴가
- **필수 항목**:
  - 신고자
  - 휴가일수 (드롭다운 선택 또는 직접 입력)
  - 시작/종료 일자
  - 시작/종료 시간
  - 경조휴가 여부

### 2. 근태 신고
- **근태 내용**: 출근지연, 외출, 조기퇴근, 당직
- **필수 항목**:
  - 신고자
  - 근태 내용 (드롭다운 선택)
  - 일자
  - 시작 시간 (종료 시간 선택 사항)
  - 사유

### 3. 이메일 자동 발송
- 제출 시 자동으로 아웃룩을 통해 전사 메일 발송
- HTML 형식의 깔끔한 이메일 템플릿
- 모든 필수 정보 포함

## 기술 스택

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js, Express
- **Email**: Nodemailer (Outlook/Office 365)
- **스타일링**: 모바일 반응형 디자인

## 설치 방법

### 1. 필수 요구사항
- Node.js (v14 이상)
- npm 또는 yarn

### 2. 프로젝트 설치

```bash
# 저장소 클론
git clone https://github.com/ywy0413-bot/Attendance-Records.git
cd Attendance-Records

# 의존성 설치
npm install
```

### 3. 환경 변수 설정

`.env.example` 파일을 `.env`로 복사하고 실제 정보를 입력합니다:

```bash
cp .env.example .env
```

`.env` 파일 내용:
```
EMAIL_USER=your-email@company.com
EMAIL_PASS=your-password
COMPANY_EMAIL=company-all@company.com
PORT=3000
```

**중요**: Outlook/Office 365 계정 설정
- 2단계 인증을 사용하는 경우, 앱 비밀번호를 생성하여 사용해야 합니다.
- [Microsoft 계정 보안](https://account.microsoft.com/security)에서 앱 비밀번호를 생성할 수 있습니다.

### 4. 서버 실행

```bash
# 개발 모드 (nodemon 사용)
npm run dev

# 프로덕션 모드
npm start
```

서버가 `http://localhost:3000`에서 실행됩니다.

## 사용 방법

### 모바일에서 접속
1. 브라우저에서 서버 주소로 접속 (예: `http://your-server-ip:3000`)
2. 메인 화면에서 "휴가 신고" 또는 "근태 신고" 선택
3. 필수 정보 입력
4. "제출" 버튼 클릭
5. 성공 메시지 확인 후 자동으로 메인 화면으로 이동

### 데스크톱에서도 사용 가능
- 반응형 디자인으로 모든 디바이스에서 사용 가능합니다.

## 프로젝트 구조

```
Attendance-Records/
├── index.html              # 메인 페이지
├── leave-form.html         # 휴가 신고 폼
├── attendance-form.html    # 근태 신고 폼
├── style.css              # 스타일시트
├── leave-form.js          # 휴가 신고 로직
├── attendance-form.js     # 근태 신고 로직
├── server.js              # Express 서버
├── package.json           # 프로젝트 설정
├── .env.example           # 환경 변수 예제
├── .gitignore            # Git 무시 파일
└── README.md             # 프로젝트 문서
```

## 보안 고려사항

1. **환경 변수**: 이메일 계정 정보는 반드시 환경 변수로 관리
2. **Git**: `.env` 파일은 절대 Git에 커밋하지 않도록 주의
3. **앱 비밀번호**: Outlook 계정의 2단계 인증 사용 시 앱 비밀번호 사용
4. **HTTPS**: 프로덕션 환경에서는 HTTPS 사용 권장
5. **방화벽**: 필요한 포트만 개방

## 배포 방법

### 로컬 네트워크에서 사용
1. 서버를 실행 중인 컴퓨터의 IP 주소 확인
2. 같은 네트워크의 모바일 기기에서 `http://[서버IP]:3000` 접속

### 클라우드 배포 (예: Heroku, AWS, Azure)
1. 환경 변수 설정
2. 포트 설정 확인 (`process.env.PORT`)
3. 배포 명령 실행

## 문제 해결

### 이메일이 발송되지 않는 경우
1. `.env` 파일의 이메일 설정 확인
2. Outlook/Office 365 계정의 2단계 인증 확인
3. 앱 비밀번호 사용 여부 확인
4. 방화벽/보안 소프트웨어 확인

### 모바일에서 접속이 안 되는 경우
1. 같은 네트워크에 연결되어 있는지 확인
2. 서버 IP 주소가 정확한지 확인
3. 방화벽에서 포트가 열려있는지 확인

## 라이선스

ISC

## 기여

이슈 및 풀 리퀘스트는 언제나 환영합니다!

## 연락처

질문이나 제안사항이 있으시면 이슈를 등록해주세요.
