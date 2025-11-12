// 로그인한 사용자 정보 가져오기
if (currentUser) {
    document.getElementById('reporter').value = currentUser.email;
} else {
    window.location.href = 'login.html';
}

// 휴가일수 선택 시 커스텀 입력 필드 표시/숨김
document.getElementById('leaveDays').addEventListener('change', function() {
    const customDaysGroup = document.getElementById('customDaysGroup');
    if (this.value === '기타') {
        customDaysGroup.style.display = 'block';
        document.getElementById('customDays').required = true;
    } else {
        customDaysGroup.style.display = 'none';
        document.getElementById('customDays').required = false;
    }
});

// 경조휴가 선택 시 사유 입력 필드 표시/숨김
document.getElementById('isSpecialLeave').addEventListener('change', function() {
    const specialLeaveReasonGroup = document.getElementById('specialLeaveReasonGroup');
    if (this.value === '예') {
        specialLeaveReasonGroup.style.display = 'block';
        document.getElementById('specialLeaveReason').required = true;
    } else {
        specialLeaveReasonGroup.style.display = 'none';
        document.getElementById('specialLeaveReason').required = false;
    }
});

// 폼 제출 처리
document.getElementById('leaveForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const messageDiv = document.getElementById('message');
    messageDiv.className = 'message';
    messageDiv.textContent = '제출 중...';
    messageDiv.style.display = 'block';

    // 폼 데이터 수집
    const formData = {
        reporter: document.getElementById('reporter').value,
        leaveType: document.getElementById('leaveType').value,
        leaveDays: document.getElementById('leaveDays').value === '기타'
            ? document.getElementById('customDays').value
            : document.getElementById('leaveDays').value,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        startTime: document.getElementById('startTime').value,
        endTime: document.getElementById('endTime').value,
        isSpecialLeave: document.getElementById('isSpecialLeave').value,
        specialLeaveReason: document.getElementById('isSpecialLeave').value === '예'
            ? document.getElementById('specialLeaveReason').value
            : '',
        reason: document.getElementById('reason').value
    };

    try {
        const response = await fetch('http://localhost:3000/api/leave', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok) {
            messageDiv.className = 'message success';
            messageDiv.textContent = '휴가 신고가 성공적으로 제출되었습니다. 메일이 발송되었습니다.';

            // 폼 초기화
            document.getElementById('leaveForm').reset();
            document.getElementById('customDaysGroup').style.display = 'none';
            document.getElementById('specialLeaveReasonGroup').style.display = 'none';

            // 3초 후 메인 페이지로 이동
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 3000);
        } else {
            throw new Error(result.message || '제출 실패');
        }
    } catch (error) {
        messageDiv.className = 'message error';
        messageDiv.textContent = '오류가 발생했습니다: ' + error.message;
    }
});

// 오늘 날짜를 기본값으로 설정
const today = new Date().toISOString().split('T')[0];
document.getElementById('startDate').value = today;
document.getElementById('endDate').value = today;
