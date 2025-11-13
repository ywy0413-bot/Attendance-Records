require('dotenv').config();
const express = require('express');
const sgMail = require('@sendgrid/mail');
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

// SendGrid 설정
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// 발신자 이메일 (SendGrid에서 인증한 이메일)
const FROM_EMAIL = process.env.FROM_EMAIL || 'env2760@naver.com';
// 수신자 이메일 (실제 알림을 받을 이메일)
const TO_EMAIL = process.env.TO_EMAIL || 'gwp@envision.co.kr';

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
        <div class="content">
            <div class="info-row">
                <span class="label">1. 신고자:</span>
                <span class="value">${reporterEnglishName}</span>
            </div>
            <div class="info-row">
                <span class="label">2. 휴가일수:</span>
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
        </div>
        <div class="footer">
            <p>본 메일은 휴가 신고 시스템에서 자동으로 발송된 메일입니다.</p>
        </div>
    </div>
</body>
</html>
        `;

        // SendGrid 이메일 발송
        const msg = {
            to: TO_EMAIL,
            from: {
                email: FROM_EMAIL,
                name: reporterEnglishName
            },
            subject: emailSubject,
            html: emailBody
        };

        console.log('이메일 발송 시도 중...');
        await sgMail.send(msg);
        console.log('이메일 발송 성공');

        res.status(200).json({
            success: true,
            message: '휴가 신고가 성공적으로 제출되었습니다.'
        });

    } catch (error) {
        console.error('휴가 신고 처리 중 오류:', error);
        if (error.response) {
            console.error('SendGrid 에러:', error.response.body);
        }
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

        // 이메일 제목 생성: [근태공유] EnglishName(Date, AttendanceType, Duration)
        const emailSubject = durationText
            ? `[근태공유] ${reporterEnglishName}(${date}, ${attendanceType}, ${durationText})`
            : `[근태공유] ${reporterEnglishName}(${date}, ${attendanceType})`;
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
        <div class="content">
            <div class="info-row">
                <span class="label">1. 신고자:</span>
                <span class="value">${reporterEnglishName}</span>
            </div>
            <div class="info-row">
                <span class="label">2. 근태공유:</span>
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
        </div>
        <div class="footer">
            <p>본 메일은 근태 신고 시스템에서 자동으로 발송된 메일입니다.</p>
        </div>
    </div>
</body>
</html>
        `;

        // SendGrid 이메일 발송
        const msg = {
            to: TO_EMAIL,
            from: {
                email: FROM_EMAIL,
                name: reporterEnglishName
            },
            subject: emailSubject,
            html: emailBody
        };

        console.log('이메일 발송 시도 중...');
        await sgMail.send(msg);
        console.log('이메일 발송 성공');

        res.status(200).json({
            success: true,
            message: '근태 신고가 성공적으로 제출되었습니다.'
        });

    } catch (error) {
        console.error('근태 신고 처리 중 오류:', error);
        if (error.response) {
            console.error('SendGrid 에러:', error.response.body);
        }
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다: ' + error.message
        });
    }
});

// 헬스체크 엔드포인트
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// SendGrid 상태 확인 엔드포인트
app.get('/api/smtp-status', async (req, res) => {
    res.status(200).json({
        status: 'ready',
        message: 'SendGrid 설정 완료',
        config: {
            service: 'SendGrid',
            apiKey: process.env.SENDGRID_API_KEY ? '설정됨' : '미설정',
            fromEmail: process.env.FROM_EMAIL ? '설정됨' : '미설정',
            toEmail: process.env.TO_EMAIL ? '설정됨' : '미설정'
        }
    });
});

// 메인 페이지 라우트 (로그인 페이지로 리다이렉트)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
    console.log('SendGrid 이메일 설정을 확인하세요!');
    console.log('SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? '설정됨' : '미설정');
    console.log('FROM_EMAIL:', process.env.FROM_EMAIL || 'noreply@yourdomain.com');
    console.log('TO_EMAIL:', process.env.TO_EMAIL || 'wyyu@envision.co.kr');
});
