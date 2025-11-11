const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// 메일 전송 설정
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

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

// 휴가 신고 API
app.post('/api/submit-leave', async (req, res) => {
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

        // 메일 옵션 설정
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_TO || process.env.EMAIL_USER,
            subject: subject,
            html: emailBody
        };

        // 메일 발송
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

// 근태 신고 API
app.post('/api/submit-attendance', async (req, res) => {
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

        // 메일 옵션 설정
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_TO || process.env.EMAIL_USER,
            subject: subject,
            html: emailBody
        };

        // 메일 발송
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

// 서버 시작
app.listen(PORT, () => {
    console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
    console.log(`http://localhost:${PORT} 에서 접속 가능합니다.`);
});
