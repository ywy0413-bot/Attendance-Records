// 로그인한 사용자 정보 가져오기
if (currentUser) {
    document.getElementById('reporter').value = currentUser.email;
} else {
    window.location.href = 'login.html';
}

// 폼 제출 처리
document.getElementById('attendanceForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const messageDiv = document.getElementById('message');
    messageDiv.className = 'message';
    messageDiv.textContent = '제출 중...';
    messageDiv.style.display = 'block';

    // 폼 데이터 수집
    const formData = {
        reporter: document.getElementById('reporter').value,
        attendanceType: document.getElementById('attendanceType').value,
        date: document.getElementById('date').value,
        startTime: document.getElementById('startTime').value,
        endTime: document.getElementById('endTime').value,
        reason: document.getElementById('reason').value
    };

    try {
        const response = await fetch('http://localhost:3000/api/attendance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok) {
            messageDiv.className = 'message success';
            messageDiv.textContent = '근태 신고가 성공적으로 제출되었습니다. 메일이 발송되었습니다.';

            // 폼 초기화
            document.getElementById('attendanceForm').reset();

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
document.getElementById('date').value = today;
