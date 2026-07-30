const functions = require('firebase-functions');
const admin = require('firebase-admin');
const sgMail = require('@sendgrid/mail');
const ALLOWED_ORIGINS = [
    'https://attendance-records-375b6.web.app',
    'https://attendance-records-375b6.firebaseapp.com'
];
const cors = require('cors')({
    origin: (origin, callback) => {
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('허용되지 않은 출처입니다.'));
        }
    }
});

admin.initializeApp();

function getConfig() {
    return {
        apiKey: process.env.SENDGRID_API_KEY,
        fromEmail: process.env.FROM_EMAIL || 'gwp@envision.co.kr',
        toEmail: process.env.TO_EMAIL || 'envision@envision.co.kr'
    };
}

async function resolveReporterName(reporter, reporterEnglishName, reporterName) {
    if (!reporter) return { reporterEnglishName, reporterName };
    const isEmail = (val) => val && val.includes('@');
    if (isEmail(reporterEnglishName) || isEmail(reporterName)) {
        try {
            const db = admin.firestore();
            const userDoc = await db.collection('users').doc(reporter).get();
            if (userDoc.exists) {
                const data = userDoc.data();
                return {
                    reporterEnglishName: data.englishName || reporterEnglishName,
                    reporterName: data.name || reporterName
                };
            }
        } catch (e) {
            console.error('사용자 이름 조회 오류:', e.message);
        }
    }
    return { reporterEnglishName, reporterName };
}

// 휴가 신고 이메일 발송
exports.sendLeaveEmail = functions
    .region('asia-northeast3')
    .https.onRequest((req, res) => {
        cors(req, res, async () => {
            if (req.method !== 'POST') {
                return res.status(405).json({ error: 'Method not allowed' });
            }
            console.log('▶ 휴가 신고 이메일 발송 요청');
            try {
                const { apiKey, fromEmail, toEmail } = getConfig();
                if (!apiKey) throw new Error('SendGrid API key가 설정되지 않았습니다');
                sgMail.setApiKey(apiKey);

                const {
                    reporter, reporterName, reporterEnglishName,
                    leaveType, leaveDays, startDate, endDate,
                    startTime, endTime, reason, isResend
                } = req.body;

                const resolved = await resolveReporterName(reporter, reporterEnglishName, reporterName);
                const finalEnglishName = resolved.reporterEnglishName;

                const dateDisplay = startDate === endDate
                    ? startDate
                    : `${startDate} ~ ${endDate}`;

                const timeRow = leaveType === '전일휴가' ? '' : `
                    <div class="info-row">
                        <span class="label">4. 시간:</span>
                        <span class="value">${startTime} ~ ${endTime}</span>
                    </div>`;

                const reasonRow = reason ? `
                    <div class="info-row" style="background: #fff9e6; border-left: 3px solid #667eea; padding: 15px;">
                        <div style="font-weight: bold; color: #667eea; margin-bottom: 8px;">* 공유사항</div>
                        <div style="color: #333; white-space: pre-wrap;">${reason}</div>
                    </div>` : '';

                const emailTitle = leaveType === '경조휴가' ? '[경조휴가]' : '[휴가신고]';
                const emailSubject = `${emailTitle} ${finalEnglishName}(${startDate}, ${leaveType}, ${leaveDays}일)`;
                const emailBody = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Malgun Gothic', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
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
                <span class="value">${finalEnglishName}</span>
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
</html>`;

                await sgMail.send({
                    to: toEmail,
                    from: { email: fromEmail, name: finalEnglishName },
                    subject: emailSubject,
                    html: emailBody
                });

                console.log('✓ 휴가신고 이메일 발송 성공:', emailSubject);
                res.status(200).json({ success: true, message: '휴가 신고가 성공적으로 제출되었습니다.' });

            } catch (error) {
                console.error('✗ 휴가 신고 처리 오류:', error.message);
                if (error.response) {
                    console.error('SendGrid 에러:', JSON.stringify(error.response.body));
                }
                res.status(500).json({ success: false, message: error.message });
            }
        });
    });

// 근태 신고 이메일 발송
exports.sendAttendanceEmail = functions
    .region('asia-northeast3')
    .https.onRequest((req, res) => {
        cors(req, res, async () => {
            if (req.method !== 'POST') {
                return res.status(405).json({ error: 'Method not allowed' });
            }
            console.log('▶ 근태 신고 이메일 발송 요청');
            try {
                const { apiKey, fromEmail, toEmail } = getConfig();
                if (!apiKey) throw new Error('SendGrid API key가 설정되지 않았습니다');
                sgMail.setApiKey(apiKey);

                const {
                    reporter, reporterName, reporterEnglishName,
                    attendanceType, date, startTime, endTime,
                    reason, isResend
                } = req.body;

                // 이메일 발송 불필요 기록 스킵
                if (attendanceType === '휴가차감' || req.body.isDeduction || req.body.noEmailRequired || req.body.isOutlookRecord) {
                    console.log('▶ 이메일 발송 불필요 기록 - 스킵:', attendanceType);
                    return res.status(200).json({ message: '이메일 발송 불필요 기록입니다.' });
                }

                const resolved = await resolveReporterName(reporter, reporterEnglishName, reporterName);
                const finalEnglishName = resolved.reporterEnglishName;

                let timeDisplay = startTime;
                let durationText = '';
                if (endTime) {
                    const [startH, startM] = startTime.split(':').map(Number);
                    const [endH, endM] = endTime.split(':').map(Number);
                    const diffMinutes = (endH * 60 + endM) - (startH * 60 + startM);
                    timeDisplay = `${startTime} ~ ${endTime} (${diffMinutes}분)`;
                    durationText = `${diffMinutes}분`;
                }

                const emailSubject = durationText
                    ? `[근태공유] ${finalEnglishName}(${date}, ${attendanceType}, ${durationText})`
                    : `[근태공유] ${finalEnglishName}(${date}, ${attendanceType})`;

                const emailBody = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Malgun Gothic', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
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
                <span class="value">${finalEnglishName}</span>
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
</html>`;

                await sgMail.send({
                    to: toEmail,
                    from: { email: fromEmail, name: finalEnglishName },
                    subject: emailSubject,
                    html: emailBody
                });

                console.log('✓ 근태신고 이메일 발송 성공:', emailSubject);
                res.status(200).json({ success: true, message: '근태 신고가 성공적으로 제출되었습니다.' });

            } catch (error) {
                console.error('✗ 근태 신고 처리 오류:', error.message);
                if (error.response) {
                    console.error('SendGrid 에러:', JSON.stringify(error.response.body));
                }
                res.status(500).json({ success: false, message: error.message });
            }
        });
    });

// ─────────────────────────────────────────────────────────────
// 취소(삭제) 안내 이메일
//  - 근태통계/휴가통계 화면에서 삭제 시 호출된다.
//  - 원래 신고 제목을 미러링해 시스템(근태 에이전트)이 취소 대상을 특정할 수 있게 한다.
//    · 근태: [근태취소] EnglishName(date, attendanceType, duration)
//    · 휴가: [휴가취소] EnglishName(startDate, leaveType, leaveDays일)
// ─────────────────────────────────────────────────────────────

// 취소 메일 수신함 — 근태 에이전트가 스캔하는 시스템 메일함(신고 메일과 동일 목적지)
const CANCEL_TO = 'wyyu@envision.co.kr';

function cancelEmailBody(rows) {
    const infoRows = rows.map(([label, value]) => `
            <div class="info-row">
                <span class="label">${label}</span>
                <span class="value">${value}</span>
            </div>`).join('');
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Malgun Gothic', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .banner { background: #fdecea; color: #c0392b; font-weight: bold; padding: 10px 16px; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border: 1px solid #e0e0e0; }
        .info-row { margin: 15px 0; padding: 10px; background: white; border-radius: 5px; }
        .label { font-weight: bold; color: #c0392b; display: inline-block; width: 100px; }
        .value { display: inline-block; }
        .footer { background: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="banner">아래 신고 건이 취소되었습니다. 시스템 누적 집계에서 제외해 주세요.</div>
        <div class="content">${infoRows}</div>
        <div class="footer">
            <p>본 메일은 휴가/근태 신고 시스템의 삭제(취소) 처리로 자동 발송되었습니다.</p>
            <p><a href="https://attendance-records-375b6.web.app" style="color: #667eea; text-decoration: none; font-weight: bold;">휴가/근태 신고 시스템 바로가기</a></p>
        </div>
    </div>
</body>
</html>`;
}

// 근태 취소 이메일 발송
exports.cancelAttendanceEmail = functions
    .region('asia-northeast3')
    .https.onRequest((req, res) => {
        cors(req, res, async () => {
            if (req.method !== 'POST') {
                return res.status(405).json({ error: 'Method not allowed' });
            }
            console.log('▶ 근태 취소 이메일 발송 요청');
            try {
                const { apiKey, fromEmail, toEmail } = getConfig();
                if (!apiKey) throw new Error('SendGrid API key가 설정되지 않았습니다');
                sgMail.setApiKey(apiKey);

                const {
                    reporter, reporterName, reporterEnglishName,
                    attendanceType, date, startTime, endTime, reason
                } = req.body;

                // 신고 메일이 나가지 않았던 기록(휴가차감/Outlook 직접입력 등)은 취소 메일도 스킵
                if (attendanceType === '휴가차감' || req.body.isDeduction || req.body.noEmailRequired || req.body.isOutlookRecord) {
                    console.log('▶ 이메일 발송 불필요 기록 - 취소 스킵:', attendanceType);
                    return res.status(200).json({ skipped: true, message: '이메일 발송 불필요 기록입니다.' });
                }

                const resolved = await resolveReporterName(reporter, reporterEnglishName, reporterName);
                const finalEnglishName = resolved.reporterEnglishName;

                let timeDisplay = startTime || '-';
                let durationText = '';
                if (startTime && endTime) {
                    const [startH, startM] = startTime.split(':').map(Number);
                    const [endH, endM] = endTime.split(':').map(Number);
                    const diffMinutes = (endH * 60 + endM) - (startH * 60 + startM);
                    timeDisplay = `${startTime} ~ ${endTime} (${diffMinutes}분)`;
                    durationText = `${diffMinutes}분`;
                }

                const emailSubject = durationText
                    ? `[근태취소] ${finalEnglishName}(${date}, ${attendanceType}, ${durationText})`
                    : `[근태취소] ${finalEnglishName}(${date}, ${attendanceType})`;

                const emailBody = cancelEmailBody([
                    ['1. 신고자:', finalEnglishName],
                    ['2. 근태공유:', attendanceType],
                    ['3. 일자:', date],
                    ['4. 시간:', timeDisplay],
                    ['5. 사유:', reason || '-']
                ]);

                await sgMail.send({
                    to: CANCEL_TO,
                    from: { email: fromEmail, name: finalEnglishName },
                    subject: emailSubject,
                    html: emailBody
                });

                console.log('✓ 근태취소 이메일 발송 성공:', emailSubject);
                res.status(200).json({ success: true, message: '근태 취소 메일이 발송되었습니다.' });

            } catch (error) {
                console.error('✗ 근태 취소 처리 오류:', error.message);
                if (error.response) {
                    console.error('SendGrid 에러:', JSON.stringify(error.response.body));
                }
                res.status(500).json({ success: false, message: error.message });
            }
        });
    });

// 휴가 취소 이메일 발송
exports.cancelLeaveEmail = functions
    .region('asia-northeast3')
    .https.onRequest((req, res) => {
        cors(req, res, async () => {
            if (req.method !== 'POST') {
                return res.status(405).json({ error: 'Method not allowed' });
            }
            console.log('▶ 휴가 취소 이메일 발송 요청');
            try {
                const { apiKey, fromEmail, toEmail } = getConfig();
                if (!apiKey) throw new Error('SendGrid API key가 설정되지 않았습니다');
                sgMail.setApiKey(apiKey);

                const {
                    reporter, reporterName, reporterEnglishName,
                    leaveType, leaveDays, startDate, endDate,
                    startTime, endTime, reason
                } = req.body;

                // 신고 메일이 나가지 않았던 기록(Outlook 직접입력 등)은 취소 메일도 스킵
                if (req.body.noEmailRequired || req.body.isOutlookRecord) {
                    console.log('▶ 이메일 발송 불필요 기록 - 취소 스킵');
                    return res.status(200).json({ skipped: true, message: '이메일 발송 불필요 기록입니다.' });
                }

                const resolved = await resolveReporterName(reporter, reporterEnglishName, reporterName);
                const finalEnglishName = resolved.reporterEnglishName;

                const dateDisplay = startDate === endDate ? startDate : `${startDate} ~ ${endDate}`;
                const timeDisplay = (leaveType === '전일휴가' || !startTime) ? '-' : `${startTime} ~ ${endTime}`;
                const emailTitle = leaveType === '경조휴가' ? '[경조취소]' : '[휴가취소]';
                const emailSubject = `${emailTitle} ${finalEnglishName}(${startDate}, ${leaveType}, ${leaveDays}일)`;

                const emailBody = cancelEmailBody([
                    ['1. 신고자:', finalEnglishName],
                    ['2. 휴가일수:', `${leaveDays}일`],
                    ['3. 휴가종류:', leaveType],
                    ['4. 일자:', dateDisplay],
                    ['5. 시간:', timeDisplay],
                    ['6. 사유:', reason || '-']
                ]);

                await sgMail.send({
                    to: CANCEL_TO,
                    from: { email: fromEmail, name: finalEnglishName },
                    subject: emailSubject,
                    html: emailBody
                });

                console.log('✓ 휴가취소 이메일 발송 성공:', emailSubject);
                res.status(200).json({ success: true, message: '휴가 취소 메일이 발송되었습니다.' });

            } catch (error) {
                console.error('✗ 휴가 취소 처리 오류:', error.message);
                if (error.response) {
                    console.error('SendGrid 에러:', JSON.stringify(error.response.body));
                }
                res.status(500).json({ success: false, message: error.message });
            }
        });
    });
