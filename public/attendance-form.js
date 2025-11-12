// 시간/분 옵션 생성
function generateTimeOptions() {
    const startHourSelect = document.getElementById('startHour');
    const startMinuteSelect = document.getElementById('startMinute');
    const endHourSelect = document.getElementById('endHour');
    const endMinuteSelect = document.getElementById('endMinute');

    // 시간 옵션 생성 (00 ~ 23)
    for (let hour = 0; hour <= 23; hour++) {
        const hourValue = String(hour).padStart(2, '0');

        const startHourOption = document.createElement('option');
        startHourOption.value = hourValue;
        startHourOption.textContent = hourValue;
        startHourSelect.appendChild(startHourOption);

        const endHourOption = document.createElement('option');
        endHourOption.value = hourValue;
        endHourOption.textContent = hourValue;
        endHourSelect.appendChild(endHourOption);
    }

    // 분 옵션 생성 (00 ~ 59)
    for (let minute = 0; minute <= 59; minute++) {
        const minuteValue = String(minute).padStart(2, '0');

        const startMinuteOption = document.createElement('option');
        startMinuteOption.value = minuteValue;
        startMinuteOption.textContent = minuteValue;
        startMinuteSelect.appendChild(startMinuteOption);

        const endMinuteOption = document.createElement('option');
        endMinuteOption.value = minuteValue;
        endMinuteOption.textContent = minuteValue;
        endMinuteSelect.appendChild(endMinuteOption);
    }
}

// 페이지 로드 시 시간 옵션 생성
generateTimeOptions();

// 로그인한 사용자 정보 가져오기
if (currentUser) {
    document.getElementById('reporter').value = currentUser.englishName || currentUser.name || currentUser.email;
} else {
    window.location.href = 'index.html';
}

// 폼 제출 처리
document.getElementById('attendanceForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    // 시간 조합
    const startHour = document.getElementById('startHour').value;
    const startMinute = document.getElementById('startMinute').value;
    const endHour = document.getElementById('endHour').value;
    const endMinute = document.getElementById('endMinute').value;

    const startTime = startHour && startMinute ? `${startHour}:${startMinute}` : '';
    const endTime = endHour && endMinute ? `${endHour}:${endMinute}` : '';

    // 폼 데이터 수집
    const attendanceData = {
        reporter: currentUser.email,
        reporterName: currentUser.name || currentUser.email,
        reporterEnglishName: currentUser.englishName || currentUser.name || currentUser.email,
        attendanceType: document.getElementById('attendanceType').value,
        date: document.getElementById('date').value,
        startTime: startTime,
        endTime: endTime,
        reason: document.getElementById('reason').value,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    // 확인 팝업 표시
    const confirmMessage = `다음 내용으로 근태 신고를 제출하시겠습니까?

신고자: ${attendanceData.reporterEnglishName}
근태 내용: ${attendanceData.attendanceType}
일자: ${attendanceData.date}
시작 시간: ${attendanceData.startTime}
종료 시간: ${attendanceData.endTime || '(없음)'}
사유: ${attendanceData.reason}

이메일로 발송됩니다.`;

    if (!confirm(confirmMessage)) {
        return; // 취소하면 제출 중단
    }

    const messageDiv = document.getElementById('message');
    messageDiv.className = 'message';
    messageDiv.textContent = '제출 중...';
    messageDiv.style.display = 'block';

    try {
        // Firestore에 저장
        await attendanceRecordsCollection.add(attendanceData);

        // 이메일 발송 API 호출 - 30초 타임아웃 (Render 무료 티어 서버 시작 시간 포함)
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);

            const emailResponse = await fetch('https://attendance-records.onrender.com/api/attendance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(attendanceData),
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
        messageDiv.textContent = '근태 신고가 성공적으로 제출되었습니다.';

        // 폼 초기화
        document.getElementById('attendanceForm').reset();

        // 3초 후 메인 페이지로 이동
        setTimeout(() => {
            window.location.href = 'main.html';
        }, 3000);
    } catch (error) {
        console.error('근태 신고 오류:', error);
        messageDiv.className = 'message error';
        messageDiv.textContent = '오류가 발생했습니다: ' + error.message;
    }
});

// 오늘 날짜를 기본값으로 설정
const today = new Date().toISOString().split('T')[0];
document.getElementById('date').value = today;
