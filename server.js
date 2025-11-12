require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 정적 파일 제공
app.use(express.static(__dirname));

// Nodemailer 설정 (Outlook/Office 365)
// 실제 사용 시 환경 변수로 관리하는 것을 권장합니다
const transporter = nodemailer.createTransport({
    host: 'smtp.office365.com',
    port: 587,
    secure: false, // TLS 사용
    auth: {
        user: process.env.EMAIL_USER || 'your-email@company.com', // 실제 이메일로 변경 필요
        pass: process.env.EMAIL_PASS || 'your-password' // 실제 비밀번호로 변경 필요
    },
    tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false
    },
    connectionTimeout: 60000, // 60초 연결 타임아웃
    greetingTimeout: 30000, // 30초 greeting 타임아웃
    socketTimeout: 60000, // 60초 소켓 타임아웃
    debug: true, // 디버그 모드 활성화
    logger: true // 로깅 활성화
});

// 간단한 사용자 데이터베이스 (실제로는 데이터베이스를 사용해야 합니다)
// 형식: { email: pin }
const users = {
    'user1@company.com': '1234',
    'user2@company.com': '5678',
    'admin@company.com': '0000'
    // 실제 사용자를 여기에 추가하세요
};

// 로그인 API
app.post('/api/login', async (req, res) => {
    try {
        const { email, pin } = req.body;

        // 사용자 확인
        if (users[email] && users[email] === pin) {
            res.status(200).json({
                success: true,
                message: '로그인 성공',
                email: email
            });
        } else {
            res.status(401).json({
                success: false,
                message: '이메일 또는 PIN이 올바르지 않습니다.'
            });
        }
    } catch (error) {
        console.error('로그인 처리 중 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다: ' + error.message
        });
    }
});

// 휴가 신고 API
app.post('/api/leave', async (req, res) => {
    try {
        const {
            reporter,
            reporterName,
            reporterEnglishName,
            leaveType,
            leaveDays,
            startDate,
            endDate,
            startTime,
            endTime,
            reason
        } = req.body;

        // 시간 표시 형식
        const timeDisplay = `${startTime} ~ ${endTime}`;

        // 일자 표시 형식
        const dateDisplay = startDate === endDate
            ? startDate
            : `${startDate} ~ ${endDate}`;

        // 이메일 제목 생성: [휴가신고] EnglishName(StartDate, LeaveType, LeaveDays)
        const emailSubject = `[휴가신고] ${reporterEnglishName}(${startDate}, ${leaveType}, ${leaveDays}일)`;
        const emailBody = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Malgun Gothic', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border: 1px solid #e0e0e0; }
        .info-row { margin: 15px 0; padding: 10px; background: white; border-radius: 5px; }
        .label { font-weight: bold; color: #667eea; display: inline-block; width: 100px; }
        .value { display: inline-block; }
        .footer { background: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>휴가 신고서</h2>
        </div>
        <div class="content">
            <div class="info-row">
                <span class="label">1. 신고자:</span>
                <span class="value">${reporterEnglishName} (${reporterName}, ${reporter})</span>
            </div>
            <div class="info-row">
                <span class="label">2. 휴가 일수:</span>
                <span class="value">${leaveDays}일</span>
            </div>
            <div class="info-row">
                <span class="label">3. 일자:</span>
                <span class="value">${dateDisplay}</span>
            </div>
            <div class="info-row">
                <span class="label">4. 시간:</span>
                <span class="value">${timeDisplay}</span>
            </div>
            <div class="info-row">
                <span class="label">신고 일시:</span>
                <span class="value">${new Date().toLocaleString('ko-KR')}</span>
            </div>
        </div>
        <div class="footer">
            <p>본 메일은 휴가 신고 시스템에서 자동으로 발송된 메일입니다.</p>
        </div>
    </div>
</body>
</html>
        `;

        // 이메일 발송 - 테스트용 wyyu@envision.co.kr
        const mailOptions = {
            from: process.env.EMAIL_USER || 'your-email@company.com',
            to: 'wyyu@envision.co.kr', // 테스트 메일 주소
            subject: emailSubject,
            html: emailBody
        };

        console.log('이메일 발송 시도 중...');
        const info = await transporter.sendMail(mailOptions);
        console.log('이메일 발송 성공:', info.messageId);

        res.status(200).json({
            success: true,
            message: '휴가 신고가 성공적으로 제출되었습니다.'
        });

    } catch (error) {
        console.error('휴가 신고 처리 중 오류:', error);
        console.error('에러 상세:', {
            message: error.message,
            code: error.code,
            command: error.command,
            responseCode: error.responseCode,
            response: error.response
        });
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다: ' + error.message
        });
    }
});

// 근태 신고 API
app.post('/api/attendance', async (req, res) => {
    try {
        const {
            reporter,
            reporterName,
            reporterEnglishName,
            attendanceType,
            date,
            startTime,
            endTime,
            reason
        } = req.body;

        // 시간 표시 계산 (분 단위로 통일)
        let timeDisplay = startTime;
        let durationText = '';
        if (endTime) {
            const [startH, startM] = startTime.split(':').map(Number);
            const [endH, endM] = endTime.split(':').map(Number);
            const startMinutes = startH * 60 + startM;
            const endMinutes = endH * 60 + endM;
            const diffMinutes = endMinutes - startMinutes;
            timeDisplay = `${startTime} ~ ${endTime} (${diffMinutes}분)`;
            durationText = `${diffMinutes}분`;
        }

        // 이메일 제목 생성: [근태신고] EnglishName(Date, AttendanceType, Duration)
        const emailSubject = durationText
            ? `[근태신고] ${reporterEnglishName}(${date}, ${attendanceType}, ${durationText})`
            : `[근태신고] ${reporterEnglishName}(${date}, ${attendanceType})`;
        const emailBody = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Malgun Gothic', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border: 1px solid #e0e0e0; }
        .info-row { margin: 15px 0; padding: 10px; background: white; border-radius: 5px; }
        .label { font-weight: bold; color: #667eea; display: inline-block; width: 100px; }
        .value { display: inline-block; }
        .footer { background: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>근태 신고서</h2>
        </div>
        <div class="content">
            <div class="info-row">
                <span class="label">1. 신고자:</span>
                <span class="value">${reporterEnglishName} (${reporterName}, ${reporter})</span>
            </div>
            <div class="info-row">
                <span class="label">2. 근태 내용:</span>
                <span class="value">${attendanceType}</span>
            </div>
            <div class="info-row">
                <span class="label">3. 일자:</span>
                <span class="value">${date}</span>
            </div>
            <div class="info-row">
                <span class="label">4. 시간:</span>
                <span class="value">${timeDisplay}</span>
            </div>
            <div class="info-row">
                <span class="label">5. 사유:</span>
                <span class="value">${reason}</span>
            </div>
            <div class="info-row">
                <span class="label">신고 일시:</span>
                <span class="value">${new Date().toLocaleString('ko-KR')}</span>
            </div>
        </div>
        <div class="footer">
            <p>본 메일은 근태 신고 시스템에서 자동으로 발송된 메일입니다.</p>
        </div>
    </div>
</body>
</html>
        `;

        // 이메일 발송
        const mailOptions = {
            from: process.env.EMAIL_USER || 'your-email@company.com',
            to: process.env.COMPANY_EMAIL || 'company-all@company.com', // 전사 메일 주소
            subject: emailSubject,
            html: emailBody
        };

        console.log('이메일 발송 시도 중...');
        const info = await transporter.sendMail(mailOptions);
        console.log('이메일 발송 성공:', info.messageId);

        res.status(200).json({
            success: true,
            message: '근태 신고가 성공적으로 제출되었습니다.'
        });

    } catch (error) {
        console.error('근태 신고 처리 중 오류:', error);
        console.error('에러 상세:', {
            message: error.message,
            code: error.code,
            command: error.command,
            responseCode: error.responseCode,
            response: error.response
        });
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다: ' + error.message
        });
    }
});

// 메인 페이지 라우트 (로그인 페이지로 리다이렉트)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// SMTP 연결 테스트
transporter.verify(function(error, success) {
    if (error) {
        console.error('SMTP 연결 실패:', error);
        console.error('에러 상세:', {
            message: error.message,
            code: error.code,
            command: error.command
        });
    } else {
        console.log('SMTP 서버 연결 성공! 이메일 발송 준비 완료');
    }
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
    console.log('이메일 설정을 확인하세요!');
    console.log('EMAIL_USER:', process.env.EMAIL_USER);
});
