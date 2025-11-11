const functions = require('firebase-functions');
const nodemailer = require('nodemailer');
const cors = require('cors')({origin: true});

// 날짜 포맷 함수
function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}년 ${month}월 ${day}일`;
}

// 시간 포맷 함수
function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    return `${hours}시 ${minutes}분`;
}

// 메일 전송 설정
function createTransporter() {
    const emailConfig = functions.config().email;

    return nodemailer.createTransport({
        service: emailConfig.service || 'gmail',
        auth: {
            user: emailConfig.user,
            pass: emailConfig.password
        }
    });
}

// 휴가 신고 API
exports.submitLeave = functions.https.onRequest((req, res) => {
    return cors(req, res, async () => {
        if (req.method !== 'POST') {
            return res.status(405).json({
                success: false,
                message: 'Method not allowed'
            });
        }

        try {
            const { reporter, leaveType, date, time, specialLeaveType } = req.body;

            // 유효성 검사
            if (!reporter || !leaveType || !date || !time) {
                return res.status(400).json({
                    success: false,
                    message: '모든 필수 항목을 입력해주세요.'
                });
            }

            // 경조휴가 선택 시 경조휴가 종류 확인
            if (leaveType === '경조휴가' && !specialLeaveType) {
                return res.status(400).json({
                    success: false,
                    message: '경조휴가 종류를 선택해주세요.'
                });
            }

            // 메일 제목 및 내용 작성
            const formattedDate = formatDate(date);
            const formattedTime = formatTime(time);

            let subject = `[휴가 신고] ${reporter} - ${leaveType}`;
            let emailBody = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Malgun Gothic', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-row { margin: 15px 0; padding: 10px; background: white; border-radius: 4px; }
        .label { font-weight: bold; color: #667eea; display: inline-block; width: 120px; }
        .value { color: #333; }
        .footer { text-align: center; margin-top: 20px; color: #6c757d; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>휴가 신고</h2>
        </div>
        <div class="content">
            <div class="info-row">
                <span class="label">신고자:</span>
                <span class="value">${reporter}</span>
            </div>
            <div class="info-row">
                <span class="label">휴가 종류:</span>
                <span class="value">${leaveType}</span>
            </div>
            ${specialLeaveType ? `
            <div class="info-row">
                <span class="label">경조휴가 종류:</span>
                <span class="value">${specialLeaveType}</span>
            </div>
            ` : ''}
            <div class="info-row">
                <span class="label">일자:</span>
                <span class="value">${formattedDate}</span>
            </div>
            <div class="info-row">
                <span class="label">시간:</span>
                <span class="value">${formattedTime}</span>
            </div>
        </div>
        <div class="footer">
            <p>본 메일은 휴가 신고 시스템에서 자동으로 발송되었습니다.</p>
        </div>
    </div>
</body>
</html>
            `;

            // 메일 발송
            const transporter = createTransporter();
            const emailConfig = functions.config().email;

            const mailOptions = {
                from: emailConfig.user,
                to: emailConfig.to || emailConfig.user,
                subject: subject,
                html: emailBody
            };

            await transporter.sendMail(mailOptions);

            res.json({
                success: true,
                message: '휴가 신고가 성공적으로 전송되었습니다.'
            });

        } catch (error) {
            console.error('휴가 신고 처리 중 오류:', error);
            res.status(500).json({
                success: false,
                message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
            });
        }
    });
});

// 근태 신고 API
exports.submitAttendance = functions.https.onRequest((req, res) => {
    return cors(req, res, async () => {
        if (req.method !== 'POST') {
            return res.status(405).json({
                success: false,
                message: 'Method not allowed'
            });
        }

        try {
            const { reporter, attendanceType, date, time, reason } = req.body;

            // 유효성 검사
            if (!reporter || !attendanceType || !date || !time || !reason) {
                return res.status(400).json({
                    success: false,
                    message: '모든 필수 항목을 입력해주세요.'
                });
            }

            // 메일 제목 및 내용 작성
            const formattedDate = formatDate(date);
            const formattedTime = formatTime(time);

            let subject = `[근태 신고] ${reporter} - ${attendanceType}`;
            let emailBody = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Malgun Gothic', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
        .info-row { margin: 15px 0; padding: 10px; background: white; border-radius: 4px; }
        .label { font-weight: bold; color: #667eea; display: inline-block; width: 120px; }
        .value { color: #333; }
        .reason-box { margin-top: 15px; padding: 15px; background: white; border-left: 4px solid #667eea; border-radius: 4px; }
        .footer { text-align: center; margin-top: 20px; color: #6c757d; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>근태 신고</h2>
        </div>
        <div class="content">
            <div class="info-row">
                <span class="label">신고자:</span>
                <span class="value">${reporter}</span>
            </div>
            <div class="info-row">
                <span class="label">근태 내용:</span>
                <span class="value">${attendanceType}</span>
            </div>
            <div class="info-row">
                <span class="label">일자:</span>
                <span class="value">${formattedDate}</span>
            </div>
            <div class="info-row">
                <span class="label">시간:</span>
                <span class="value">${formattedTime}</span>
            </div>
            <div class="reason-box">
                <div class="label">사유:</div>
                <div class="value" style="margin-top: 10px; white-space: pre-wrap;">${reason}</div>
            </div>
        </div>
        <div class="footer">
            <p>본 메일은 근태 신고 시스템에서 자동으로 발송되었습니다.</p>
        </div>
    </div>
</body>
</html>
            `;

            // 메일 발송
            const transporter = createTransporter();
            const emailConfig = functions.config().email;

            const mailOptions = {
                from: emailConfig.user,
                to: emailConfig.to || emailConfig.user,
                subject: subject,
                html: emailBody
            };

            await transporter.sendMail(mailOptions);

            res.json({
                success: true,
                message: '근태 신고가 성공적으로 전송되었습니다.'
            });

        } catch (error) {
            console.error('근태 신고 처리 중 오류:', error);
            res.status(500).json({
                success: false,
                message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
            });
        }
    });
});

// API 라우터 (하나의 함수로 통합)
exports.api = functions.https.onRequest((req, res) => {
    const path = req.path;

    if (path === '/submit-leave') {
        return exports.submitLeave(req, res);
    } else if (path === '/submit-attendance') {
        return exports.submitAttendance(req, res);
    } else {
        return res.status(404).json({
            success: false,
            message: 'Not found'
        });
    }
});
