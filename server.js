require('dotenv').config();
const express = require('express');
const sgMail = require('@sendgrid/mail');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const admin = require('firebase-admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Firebase Admin SDK 초기화
let db = null;
try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        db = admin.firestore();
        console.log('✓ Firebase Admin SDK 초기화 성공');
    } else {
        console.log('⚠ FIREBASE_SERVICE_ACCOUNT 환경변수가 설정되지 않음 - Webhook 기능 비활성화');
    }
} catch (error) {
    console.error('✗ Firebase Admin SDK 초기화 실패:', error.message);
}

// 미들웨어 설정
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 정적 파일 제공
app.use(express.static(__dirname));

// SendGrid 설정
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// 발신자 이메일 (SendGrid에서 인증한 이메일)
const FROM_EMAIL = process.env.FROM_EMAIL || 'gwp@envision.co.kr';
// 수신자 이메일 (실제 알림을 받을 이메일)
const TO_EMAIL = process.env.TO_EMAIL || 'envision@envision.co.kr';

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
    console.log('▶ 휴가 신고 API 요청 수신');
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
            reason,
            isResend
        } = req.body;

        // 일자 표시 형식
        const dateDisplay = startDate === endDate
            ? startDate
            : `${startDate} ~ ${endDate}`;

        // 시간 항목 (전일휴가는 제외)
        const timeRow = leaveType === '전일휴가' ? '' : `
            <div class="info-row">
                <span class="label">4. 시간:</span>
                <span class="value">${startTime} ~ ${endTime}</span>
            </div>`;

        // 공유사항 항목 (공유사항이 있을 경우에만 표시)
        const reasonRow = reason ? `
            <div class="info-row" style="background: #fff9e6; border-left: 3px solid #667eea; padding: 15px;">
                <div style="font-weight: bold; color: #667eea; margin-bottom: 8px;">* 공유사항</div>
                <div style="color: #333; white-space: pre-wrap;">${reason}</div>
            </div>` : '';

        // 이메일 제목 생성 (경조휴가는 별도 제목)
        const emailTitle = leaveType === '경조휴가' ? '[경조휴가]' : '[휴가신고]';
        const emailSubject = `${emailTitle} ${reporterEnglishName}(${startDate}, ${leaveType}, ${leaveDays}일)`;
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
            </div>${timeRow}${reasonRow}
        </div>
        <div class="footer">
            <p>본 메일은 휴가/근태 신고 시스템에서 자동으로 발송된 메일입니다.</p>
            ${isResend ? '<p style="color: #f44336; font-weight: bold;">* 본 메일은 관리자에 의해 재발송된 메일이니 참고 부탁드립니다.</p>' : ''}
            <p><a href="https://attendance-records-375b6.web.app" style="color: #667eea; text-decoration: none; font-weight: bold;">휴가/근태 신고 시스템 바로가기</a></p>
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

        console.log('=== 휴가신고 이메일 발송 시도 ===');
        console.log('FROM:', FROM_EMAIL);
        console.log('TO:', TO_EMAIL);
        console.log('SUBJECT:', emailSubject);
        await sgMail.send(msg);
        console.log('✓ 휴가신고 이메일 발송 성공');

        res.status(200).json({
            success: true,
            message: '휴가 신고가 성공적으로 제출되었습니다.'
        });

    } catch (error) {
        console.error('✗ 휴가 신고 처리 중 오류:', error);
        console.error('에러 메시지:', error.message);
        if (error.response) {
            console.error('SendGrid 에러 상태:', error.response.statusCode);
            console.error('SendGrid 에러 응답:', JSON.stringify(error.response.body, null, 2));
        }
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다: ' + error.message
        });
    }
});

// 근태 신고 API
app.post('/api/attendance', async (req, res) => {
    console.log('▶ 근태 신고 API 요청 수신');
    try {
        const {
            reporter,
            reporterName,
            reporterEnglishName,
            attendanceType,
            date,
            startTime,
            endTime,
            reason,
            isResend
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
            <p>본 메일은 휴가/근태 신고 시스템에서 자동으로 발송된 메일입니다.</p>
            ${isResend ? '<p style="color: #f44336; font-weight: bold;">* 본 메일은 관리자에 의해 재발송된 메일이니 참고 부탁드립니다.</p>' : ''}
            <p><a href="https://attendance-records-375b6.web.app" style="color: #667eea; text-decoration: none; font-weight: bold;">휴가/근태 신고 시스템 바로가기</a></p>
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

        console.log('=== 근태신고 이메일 발송 시도 ===');
        console.log('FROM:', FROM_EMAIL);
        console.log('TO:', TO_EMAIL);
        console.log('SUBJECT:', emailSubject);
        await sgMail.send(msg);
        console.log('✓ 근태신고 이메일 발송 성공');

        res.status(200).json({
            success: true,
            message: '근태 신고가 성공적으로 제출되었습니다.'
        });

    } catch (error) {
        console.error('✗ 근태 신고 처리 중 오류:', error);
        console.error('에러 메시지:', error.message);
        if (error.response) {
            console.error('SendGrid 에러 상태:', error.response.statusCode);
            console.error('SendGrid 에러 응답:', JSON.stringify(error.response.body, null, 2));
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

// SendGrid Event Webhook 엔드포인트
app.post('/api/sendgrid-webhook', async (req, res) => {
    console.log('▶ SendGrid Webhook 이벤트 수신');

    try {
        const events = req.body;

        if (!Array.isArray(events)) {
            console.log('잘못된 webhook 데이터 형식');
            return res.status(400).json({ error: 'Invalid data format' });
        }

        if (!db) {
            console.log('⚠ Firebase가 초기화되지 않아 Webhook 처리 불가');
            return res.status(200).json({ message: 'Webhook received but Firebase not initialized' });
        }

        for (const event of events) {
            const { event: eventType, email, sg_message_id, timestamp } = event;

            console.log(`  - 이벤트: ${eventType}, 수신자: ${email}, 메시지ID: ${sg_message_id}`);

            // delivered, bounce, deferred, dropped 이벤트 처리
            if (['delivered', 'bounce', 'deferred', 'dropped'].includes(eventType)) {
                // 이메일 제목에서 신고 정보 추출
                const subject = event.subject || '';

                // Firestore에서 해당 레코드 찾기 (최근 24시간 내)
                const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

                // 근태신고 컬렉션 검색
                const attendanceQuery = await db.collection('attendanceRecords')
                    .where('createdAt', '>=', oneDayAgo)
                    .get();

                for (const doc of attendanceQuery.docs) {
                    const data = doc.data();
                    const docSubject = `[근태공유] ${data.reporterEnglishName}(${data.date}, ${data.attendanceType}`;

                    if (subject.includes(docSubject) || (data.reporterEnglishName && subject.includes(data.reporterEnglishName))) {
                        await doc.ref.update({
                            emailDeliveryStatus: eventType,
                            emailDeliveryTimestamp: new Date(timestamp * 1000),
                            emailDeliveryError: event.reason || null
                        });
                        console.log(`    ✓ 근태신고 업데이트: ${doc.id} -> ${eventType}`);
                    }
                }

                // 휴가신고 컬렉션 검색
                const leaveQuery = await db.collection('leaveRecords')
                    .where('createdAt', '>=', oneDayAgo)
                    .get();

                for (const doc of leaveQuery.docs) {
                    const data = doc.data();
                    const docSubject = data.leaveType === '경조휴가'
                        ? `[경조휴가] ${data.reporterEnglishName}`
                        : `[휴가신고] ${data.reporterEnglishName}`;

                    if (subject.includes(docSubject) || (data.reporterEnglishName && subject.includes(data.reporterEnglishName))) {
                        await doc.ref.update({
                            emailDeliveryStatus: eventType,
                            emailDeliveryTimestamp: new Date(timestamp * 1000),
                            emailDeliveryError: event.reason || null
                        });
                        console.log(`    ✓ 휴가신고 업데이트: ${doc.id} -> ${eventType}`);
                    }
                }
            }
        }

        res.status(200).json({ message: 'Webhook processed successfully' });
    } catch (error) {
        console.error('✗ Webhook 처리 오류:', error);
        res.status(500).json({ error: error.message });
    }
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
    console.log('SendGrid 이메일 설정을 확인하세요!');
    console.log('SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? '설정됨' : '미설정');
    console.log('FROM_EMAIL:', process.env.FROM_EMAIL || 'noreply@yourdomain.com');
    console.log('TO_EMAIL:', process.env.TO_EMAIL || 'wyyu@envision.co.kr');
});
