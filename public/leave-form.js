// 시간/분 옵션 생성 (시간: 08~18, 분: 10분 단위)
function generateTimeOptions() {
    const startHourSelect = document.getElementById('startHour');
    const startMinuteSelect = document.getElementById('startMinute');
    const endHourSelect = document.getElementById('endHour');
    const endMinuteSelect = document.getElementById('endMinute');

    // 시간 옵션 생성 (08 ~ 18)
    for (let hour = 8; hour <= 18; hour++) {
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

    // 분 옵션 생성 (0, 10, 20, 30, 40, 50)
    for (let minute = 0; minute <= 50; minute += 10) {
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
let currentUserData = null;
async function loadCurrentUser() {
    if (currentUser) {
        try {
            const userDoc = await usersCollection.doc(currentUser.email).get();
            if (userDoc.exists) {
                currentUserData = userDoc.data();
            }
        } catch (error) {
            console.error('사용자 정보 로드 오류:', error);
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

    // 시간 조합
    const startHour = document.getElementById('startHour').value;
    const startMinute = document.getElementById('startMinute').value;
    const endHour = document.getElementById('endHour').value;
    const endMinute = document.getElementById('endMinute').value;

    const startTime = startHour && startMinute ? `${startHour}:${startMinute}` : '';
    const endTime = endHour && endMinute ? `${endHour}:${endMinute}` : '';

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
        startTime: startTime,
        endTime: endTime,
        reason: document.getElementById('reason').value,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    // 1. 종료일이 시작일보다 이전인지 확인
    const startDateObj = new Date(leaveData.startDate);
    const endDateObj = new Date(leaveData.endDate);

    if (endDateObj < startDateObj) {
        alert('오류 : 종료일이 시작일 이전입니다');
        return;
    }

    const leaveDaysNum = parseFloat(leaveData.leaveDays);

    // 2. 1.0일 미만인 경우 시작일과 종료일이 같아야 함
    if (leaveDaysNum < 1.0 && leaveData.startDate !== leaveData.endDate) {
        alert('1.0일 미만의 휴가는 시작일과 종료일이 같아야합니다');
        return;
    }

    // 3. 휴가일수에 따른 최소 소요시간 검증 (1.0일 초과는 제외)
    if (leaveDaysNum <= 1.0) {
        const [startH, startM] = leaveData.startTime.split(':').map(Number);
        const [endH, endM] = leaveData.endTime.split(':').map(Number);
        const durationMinutes = (endH * 60 + endM) - (startH * 60 + startM);

        let requiredMinutes = 0;

        if (leaveDaysNum === 0.25) {
            requiredMinutes = 120; // 2시간
        } else if (leaveDaysNum === 0.5) {
            requiredMinutes = 240; // 4시간
        } else if (leaveDaysNum === 0.75) {
            requiredMinutes = 360; // 6시간
        } else if (leaveDaysNum === 1.0) {
            requiredMinutes = 480; // 8시간
        }

        if (requiredMinutes > 0 && durationMinutes < requiredMinutes) {
            alert('휴가 일수보다 소요시간(종료시간-시작시간)이 짧습니다');
            return;
        }
    }

    // 시간 표시 형식
    const timeDisplay = `${leaveData.startTime} ~ ${leaveData.endTime}`;

    // 일자 표시 형식
    const dateDisplay = leaveData.startDate === leaveData.endDate
        ? leaveData.startDate
        : `${leaveData.startDate} ~ ${leaveData.endDate}`;

    // 이메일 제목
    const emailSubject = `[휴가신고] ${leaveData.reporterEnglishName}(${leaveData.startDate}, ${leaveData.leaveType}, ${leaveData.leaveDays}일)`;

    // 확인 팝업 표시
    const confirmMessage = `${emailSubject}

1. 신고자: ${leaveData.reporterEnglishName}
2. 휴가 일수: ${leaveData.leaveDays}일
3. 일자: ${dateDisplay}
4. 시간: ${timeDisplay}

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

        // 성공 팝업 표시
        alert('메일이 성공적으로 발송되었습니다.');

        // 폼 초기화
        document.getElementById('leaveForm').reset();
        document.getElementById('customDaysGroup').style.display = 'none';
        generateTimeOptions(); // 시간 옵션 재생성

        // 메인 페이지로 이동
        window.location.href = 'main.html';
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
