// 탭 전환 함수
function showTab(tabName) {
    // 모든 탭 버튼과 폼 컨테이너 가져오기
    const tabButtons = document.querySelectorAll('.tab-button');
    const formContainers = document.querySelectorAll('.form-container');

    // 모든 탭 버튼에서 active 클래스 제거
    tabButtons.forEach(button => button.classList.remove('active'));

    // 모든 폼 컨테이너 숨기기
    formContainers.forEach(container => container.classList.remove('active'));

    // 클릭된 탭 버튼 활성화
    event.target.classList.add('active');

    // 해당 폼 컨테이너 표시
    if (tabName === 'leave') {
        document.getElementById('leave-form').classList.add('active');
    } else if (tabName === 'attendance') {
        document.getElementById('attendance-form').classList.add('active');
    }
}

// 휴가 유형 변경 시 경조휴가 필드 표시/숨김
function handleLeaveTypeChange() {
    const leaveType = document.getElementById('leave-type').value;
    const specialLeaveGroup = document.getElementById('special-leave-group');
    const specialLeaveSelect = document.getElementById('special-leave-type');

    if (leaveType === '경조휴가') {
        specialLeaveGroup.style.display = 'block';
        specialLeaveSelect.required = true;
    } else {
        specialLeaveGroup.style.display = 'none';
        specialLeaveSelect.required = false;
        specialLeaveSelect.value = '';
    }
}

// 알림 표시 함수
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;

    // 알림 표시
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    // 3초 후 자동으로 알림 숨김
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// 날짜 포맷 함수 (YYYY-MM-DD -> YYYY년 MM월 DD일)
function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}년 ${month}월 ${day}일`;
}

// 시간 포맷 함수 (HH:MM -> HH시 MM분)
function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    return `${hours}시 ${minutes}분`;
}

// 휴가 신고 폼 제출
document.getElementById('leaveForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const submitBtn = e.target.querySelector('.submit-btn');
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');

    // 폼 데이터 수집
    const formData = {
        reporter: document.getElementById('leave-reporter').value,
        leaveType: document.getElementById('leave-type').value,
        date: document.getElementById('leave-date').value,
        time: document.getElementById('leave-time').value,
        specialLeaveType: document.getElementById('special-leave-type').value || null
    };

    try {
        // 서버에 데이터 전송
        const response = await fetch('/api/submit-leave', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok) {
            showNotification('휴가 신고가 성공적으로 전송되었습니다!', 'success');
            e.target.reset();
            handleLeaveTypeChange(); // 경조휴가 필드 초기화
        } else {
            showNotification(result.message || '신고 전송에 실패했습니다.', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('서버와의 통신에 실패했습니다.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
    }
});

// 근태 신고 폼 제출
document.getElementById('attendanceForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const submitBtn = e.target.querySelector('.submit-btn');
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');

    // 폼 데이터 수집
    const formData = {
        reporter: document.getElementById('attendance-reporter').value,
        attendanceType: document.getElementById('attendance-type').value,
        date: document.getElementById('attendance-date').value,
        time: document.getElementById('attendance-time').value,
        reason: document.getElementById('attendance-reason').value
    };

    try {
        // 서버에 데이터 전송
        const response = await fetch('/api/submit-attendance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (response.ok) {
            showNotification('근태 신고가 성공적으로 전송되었습니다!', 'success');
            e.target.reset();
        } else {
            showNotification(result.message || '신고 전송에 실패했습니다.', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('서버와의 통신에 실패했습니다.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
    }
});

// 페이지 로드 시 오늘 날짜를 기본값으로 설정
window.addEventListener('DOMContentLoaded', function() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('leave-date').value = today;
    document.getElementById('attendance-date').value = today;
});
