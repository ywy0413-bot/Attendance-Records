// 5분 단위 시간 옵션 생성 (08:00 ~ 18:00)
function generateTimeOptions() {
    const startTimeSelect = document.getElementById('startTime');
    const endTimeSelect = document.getElementById('endTime');

    // 08:00부터 18:00까지만 생성
    for (let hour = 8; hour <= 18; hour++) {
        // 18시일 때는 00분만 추가 (18:00까지만)
        const maxMinute = (hour === 18) ? 0 : 55;
        for (let minute = 0; minute <= maxMinute; minute += 5) {
            const timeValue = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

            const startOption = document.createElement('option');
            startOption.value = timeValue;
            startOption.textContent = timeValue;
            startTimeSelect.appendChild(startOption);

            const endOption = document.createElement('option');
            endOption.value = timeValue;
            endOption.textContent = timeValue;
            endTimeSelect.appendChild(endOption);
        }
    }
}

// 페이지 로드 시 시간 옵션 생성
generateTimeOptions();

// 로그인한 사용자 정보 가져오기 및 영어이름 표시
let currentUserData = null;
async function loadCurrentUser() {
    if (currentUser) {
        try {
            const userDoc = await usersCollection.doc(currentUser.email).get();
            if (userDoc.exists) {
                currentUserData = userDoc.data();
                const englishName = currentUserData.englishName || currentUser.email;
                document.getElementById('reporter').value = englishName;
            } else {
                document.getElementById('reporter').value = currentUser.email;
            }
        } catch (error) {
            console.error('사용자 정보 로드 오류:', error);
            document.getElementById('reporter').value = currentUser.email;
        }
    } else {
        window.location.href = 'index.html';
    }
}

loadCurrentUser();

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

// 폼 제출 처리
document.getElementById('leaveForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const messageDiv = document.getElementById('message');
    messageDiv.className = 'message';
    messageDiv.textContent = '제출 중...';
    messageDiv.style.display = 'block';

    // 폼 데이터 수집
    const leaveDays = document.getElementById('leaveDays').value === '기타'
        ? document.getElementById('customDays').value
        : document.getElementById('leaveDays').value;

    const leaveData = {
        reporter: currentUser.email,
        reporterName: currentUserData?.name || currentUser.email,
        reporterEnglishName: currentUserData?.englishName || currentUser.email,
        leaveType: document.getElementById('leaveType').value,
        leaveDays: leaveDays,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        startTime: document.getElementById('startTime').value,
        endTime: document.getElementById('endTime').value,
        reason: document.getElementById('reason').value,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        // Firestore에 저장
        await leaveRecordsCollection.add(leaveData);

        // 이메일 발송 API 호출 - 30초 타임아웃 (Render 무료 티어 서버 시작 시간 포함)
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);

            const emailResponse = await fetch('https://attendance-records.onrender.com/api/leave', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(leaveData),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (emailResponse.ok) {
                console.log('이메일이 성공적으로 발송되었습니다.');
            } else {
                console.error('이메일 발송 실패:', await emailResponse.text());
            }
        } catch (emailError) {
            if (emailError.name === 'AbortError') {
                console.log('이메일 발송 시간 초과 (서버가 실행되지 않았을 수 있습니다)');
            } else {
                console.error('이메일 발송 오류:', emailError);
            }
            // 이메일 발송 실패해도 신고는 완료된 것으로 처리
        }

        messageDiv.className = 'message success';
        messageDiv.textContent = '휴가 신고가 성공적으로 제출되었습니다.';

        // 폼 초기화
        document.getElementById('leaveForm').reset();
        document.getElementById('customDaysGroup').style.display = 'none';
        generateTimeOptions(); // 시간 옵션 재생성

        // 3초 후 메인 페이지로 이동
        setTimeout(() => {
            window.location.href = 'main.html';
        }, 3000);
    } catch (error) {
        console.error('휴가 신고 오류:', error);
        messageDiv.className = 'message error';
        messageDiv.textContent = '오류가 발생했습니다: ' + error.message;
    }
});

// 오늘 날짜를 기본값으로 설정
const today = new Date().toISOString().split('T')[0];
document.getElementById('startDate').value = today;
document.getElementById('endDate').value = today;
