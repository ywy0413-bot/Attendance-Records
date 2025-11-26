// 한국 공휴일 (2025-2030년)
const holidays2025 = [
    // 2025년
    '2025-01-01', // 신정
    '2025-01-28', '2025-01-29', '2025-01-30', // 설날 연휴
    '2025-03-01', // 삼일절
    '2025-05-05', // 어린이날
    '2025-05-06', // 대체공휴일
    '2025-06-06', // 현충일
    '2025-08-15', // 광복절
    '2025-10-03', // 개천절
    '2025-10-06', '2025-10-07', '2025-10-08', // 추석 연휴
    '2025-10-09', // 한글날
    '2025-12-25', // 성탄절

    // 2026년
    '2026-01-01', // 신정
    '2026-02-16', '2026-02-17', '2026-02-18', // 설날 연휴
    '2026-03-01', // 삼일절
    '2026-05-05', // 어린이날
    '2026-05-24', // 석가탄신일
    '2026-05-25', // 대체공휴일
    '2026-06-06', // 현충일
    '2026-08-15', // 광복절
    '2026-09-24', '2026-09-25', '2026-09-26', // 추석 연휴
    '2026-09-28', // 대체공휴일
    '2026-10-03', // 개천절
    '2026-10-09', // 한글날
    '2026-12-25', // 성탄절

    // 2027년
    '2027-01-01', // 신정
    '2027-02-06', '2027-02-07', '2027-02-08', // 설날 연휴
    '2027-02-09', // 대체공휴일
    '2027-03-01', // 삼일절
    '2027-05-05', // 어린이날
    '2027-05-13', // 석가탄신일
    '2027-06-06', // 현충일
    '2027-08-15', // 광복절
    '2027-10-03', // 개천절
    '2027-10-09', // 한글날
    '2027-10-14', '2027-10-15', '2027-10-16', // 추석 연휴
    '2027-10-18', // 대체공휴일
    '2027-12-25', // 성탄절

    // 2028년
    '2028-01-01', // 신정
    '2028-01-26', '2028-01-27', '2028-01-28', // 설날 연휴
    '2028-03-01', // 삼일절
    '2028-05-02', // 석가탄신일
    '2028-05-05', // 어린이날
    '2028-06-06', // 현충일
    '2028-08-15', // 광복절
    '2028-10-02', '2028-10-03', '2028-10-04', // 추석 연휴 (개천절 포함)
    '2028-10-09', // 한글날
    '2028-12-25', // 성탄절

    // 2029년
    '2029-01-01', // 신정
    '2029-02-12', '2029-02-13', '2029-02-14', // 설날 연휴
    '2029-03-01', // 삼일절
    '2029-05-05', // 어린이날
    '2029-05-20', // 석가탄신일
    '2029-05-21', // 대체공휴일
    '2029-06-06', // 현충일
    '2029-08-15', // 광복절
    '2029-09-21', '2029-09-22', '2029-09-23', // 추석 연휴
    '2029-09-24', // 대체공휴일
    '2029-10-03', // 개천절
    '2029-10-09', // 한글날
    '2029-12-25', // 성탄절

    // 2030년
    '2030-01-01', // 신정
    '2030-02-02', '2030-02-03', '2030-02-04', // 설날 연휴
    '2030-02-05', // 대체공휴일
    '2030-03-01', // 삼일절
    '2030-05-05', // 어린이날
    '2030-05-09', // 석가탄신일
    '2030-06-06', // 현충일
    '2030-08-15', // 광복절
    '2030-09-11', '2030-09-12', '2030-09-13', // 추석 연휴
    '2030-10-03', // 개천절
    '2030-10-09', // 한글날
    '2030-12-25'  // 성탄절
];

// 주말 또는 공휴일인지 확인
function isWeekendOrHoliday(dateString) {
    const date = new Date(dateString);
    const dayOfWeek = date.getDay();
    // 0(일요일) 또는 6(토요일)
    if (dayOfWeek === 0 || dayOfWeek === 6) return true;
    // 공휴일 체크
    return holidays2025.includes(dateString);
}

// 두 날짜 사이의 working days 계산 (시작일과 종료일 포함)
function calculateWorkingDays(startDateStr, endDateStr) {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    let workingDays = 0;
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        if (!isWeekendOrHoliday(dateStr)) {
            workingDays++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return workingDays;
}

// 시간/분 옵션 생성 (시작: 08~17, 종료: 08~18, 분: 10분 단위)
function generateTimeOptions() {
    const startHourSelect = document.getElementById('startHour');
    const startMinuteSelect = document.getElementById('startMinute');
    const endHourSelect = document.getElementById('endHour');
    const endMinuteSelect = document.getElementById('endMinute');

    // 시작 시간 옵션 생성 (08 ~ 17)
    for (let hour = 8; hour <= 17; hour++) {
        const hourValue = String(hour).padStart(2, '0');
        const startHourOption = document.createElement('option');
        startHourOption.value = hourValue;
        startHourOption.textContent = hourValue;
        startHourSelect.appendChild(startHourOption);
    }

    // 종료 시간 옵션 생성 (08 ~ 18)
    for (let hour = 8; hour <= 18; hour++) {
        const hourValue = String(hour).padStart(2, '0');
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

// 휴가 종류별 시간 옵션
const timeOptions = {
    '반차휴가': [
        '08:00 ~ 13:00',
        '09:00 ~ 14:00',
        '13:00 ~ 17:00',
        '14:00 ~ 18:00',
        '11:00 ~ 16:00',
        '12:00 ~ 17:00',
        '직접입력'
    ],
    '반반차휴가': [
        '08:00 ~ 10:00',
        '09:00 ~ 11:00',
        '15:00 ~ 17:00',
        '16:00 ~ 18:00',
        '14:00 ~ 16:00',
        '15:00 ~ 17:00',
        '직접입력'
    ],
    '반차휴가 + 반반차 휴가': [
        '직접입력'
    ],
    '경조휴가': [
        '직접입력'
    ]
};

// 휴가 종류에 따라 시간 선택 드롭다운 옵션 생성
function updateTimeSelectOptions() {
    const leaveType = document.getElementById('leaveType').value;
    const timeSelect = document.getElementById('timeSelect');
    const timeSelectGroup = document.getElementById('timeSelectGroup');
    const startTimeGroup = document.getElementById('startTimeGroup');
    const endTimeGroup = document.getElementById('endTimeGroup');
    const leaveDaysSelect = document.getElementById('leaveDays');
    const reasonTextarea = document.getElementById('reason');

    // 기존 옵션 제거
    timeSelect.innerHTML = '<option value="">선택하세요</option>';

    // 휴가 종류에 따라 휴가일수 자동 선택
    if (leaveType === '반차휴가') {
        leaveDaysSelect.value = '0.5';
    } else if (leaveType === '반반차휴가') {
        leaveDaysSelect.value = '0.25';
    } else if (leaveType === '반차휴가 + 반반차 휴가') {
        leaveDaysSelect.value = '0.75';
    } else if (leaveType === '전일휴가') {
        leaveDaysSelect.value = '1';
    } else if (leaveType === '경조휴가') {
        // 경조휴가는 기본값으로 "선택하세요" 유지
        leaveDaysSelect.value = '';
    }

    // 경조휴가 선택 시 공유사항을 필수로 설정
    if (leaveType === '경조휴가') {
        reasonTextarea.required = true;
        reasonTextarea.parentElement.querySelector('label').innerHTML = '공유사항 *';
    } else {
        reasonTextarea.required = false;
        reasonTextarea.parentElement.querySelector('label').innerHTML = '공유사항';
    }

    if (leaveType === '전일휴가') {
        // 전일휴가는 시간 선택/입력란 모두 숨김
        timeSelectGroup.style.display = 'none';
        startTimeGroup.style.display = 'none';
        endTimeGroup.style.display = 'none';
        timeSelect.required = false;
        document.getElementById('startHour').required = false;
        document.getElementById('startMinute').required = false;
        document.getElementById('endHour').required = false;
        document.getElementById('endMinute').required = false;
    } else if (leaveType && timeOptions[leaveType]) {
        // 시간 선택 드롭다운 표시
        timeSelectGroup.style.display = 'block';
        timeSelect.required = true;

        // 옵션 추가
        timeOptions[leaveType].forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            timeSelect.appendChild(optionElement);
        });

        // 경조휴가와 반차휴가 + 반반차 휴가는 직접입력을 기본값으로 설정
        if (leaveType === '경조휴가' || leaveType === '반차휴가 + 반반차 휴가') {
            timeSelect.value = '직접입력';
            // 직접입력 입력란 표시
            startTimeGroup.style.display = 'block';
            endTimeGroup.style.display = 'block';
            document.getElementById('startHour').required = true;
            document.getElementById('startMinute').required = true;
            document.getElementById('endHour').required = true;
            document.getElementById('endMinute').required = true;

            // 시작시간과 종료시간의 분을 00분으로 설정
            document.getElementById('startMinute').value = '00';
            document.getElementById('endMinute').value = '00';
        } else {
            // 직접입력 입력란은 초기에 숨김
            startTimeGroup.style.display = 'none';
            endTimeGroup.style.display = 'none';
        }
    } else {
        // 휴가 종류 미선택 시 모두 숨김
        timeSelectGroup.style.display = 'none';
        startTimeGroup.style.display = 'none';
        endTimeGroup.style.display = 'none';
    }
}

// 시간 선택 드롭다운 변경 시 직접입력란 토글
function toggleDirectTimeInput() {
    const timeSelect = document.getElementById('timeSelect');
    const startTimeGroup = document.getElementById('startTimeGroup');
    const endTimeGroup = document.getElementById('endTimeGroup');

    if (timeSelect.value === '직접입력') {
        // 직접입력 선택 시 시간 입력란 표시
        startTimeGroup.style.display = 'block';
        endTimeGroup.style.display = 'block';
        document.getElementById('startHour').required = true;
        document.getElementById('startMinute').required = true;
        document.getElementById('endHour').required = true;
        document.getElementById('endMinute').required = true;
    } else {
        // 다른 옵션 선택 시 시간 입력란 숨김
        startTimeGroup.style.display = 'none';
        endTimeGroup.style.display = 'none';
        document.getElementById('startHour').required = false;
        document.getElementById('startMinute').required = false;
        document.getElementById('endHour').required = false;
        document.getElementById('endMinute').required = false;
    }
}

// 휴가 종류 변경 시 시간 옵션 업데이트
document.getElementById('leaveType').addEventListener('change', updateTimeSelectOptions);

// 시간 선택 변경 시 직접입력란 토글
document.getElementById('timeSelect').addEventListener('change', toggleDirectTimeInput);

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

    // 휴가 종류
    const leaveType = document.getElementById('leaveType').value;

    // 시간 조합
    let startTime, endTime;
    if (leaveType === '전일휴가') {
        // 전일휴가는 시간 입력 없음
        startTime = '';
        endTime = '';
    } else {
        const timeSelect = document.getElementById('timeSelect').value;

        if (timeSelect === '직접입력') {
            // 직접입력: 사용자가 입력한 시간 사용
            const startHour = document.getElementById('startHour').value;
            const startMinute = document.getElementById('startMinute').value;
            const endHour = document.getElementById('endHour').value;
            const endMinute = document.getElementById('endMinute').value;

            startTime = startHour && startMinute ? `${startHour}:${startMinute}` : '';
            endTime = endHour && endMinute ? `${endHour}:${endMinute}` : '';
        } else if (timeSelect) {
            // 드롭다운 선택: 선택된 시간 범위 파싱 (예: "08:00 ~ 13:00")
            const timeParts = timeSelect.split(' ~ ');
            startTime = timeParts[0];
            endTime = timeParts[1];
        } else {
            startTime = '';
            endTime = '';
        }
    }

    // 폼 데이터 수집
    const leaveDays = document.getElementById('leaveDays').value === '기타'
        ? document.getElementById('customDays').value
        : document.getElementById('leaveDays').value;

    const leaveData = {
        reporter: currentUser.email,
        reporterName: currentUserData?.name || currentUser.email,
        reporterEnglishName: currentUserData?.englishName || currentUser.email,
        leaveType: leaveType,
        leaveDays: leaveDays,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        startTime: startTime,
        endTime: endTime,
        reason: document.getElementById('reason').value,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    const leaveDaysNum = parseFloat(leaveData.leaveDays);

    // 0. 휴가 종류와 휴가일수 매칭 검증
    if (leaveData.leaveType === '반차휴가' && leaveDaysNum !== 0.5) {
        alert('휴가종류와 휴가일수를 매칭시켜 주세요');
        return;
    }

    if (leaveData.leaveType === '반반차 휴가' && leaveDaysNum !== 0.25) {
        alert('휴가종류와 휴가일수를 매칭시켜 주세요');
        return;
    }

    if (leaveData.leaveType === '반차휴가 + 반반차 휴가' && leaveDaysNum !== 0.75) {
        alert('휴가종류와 휴가일수를 매칭시켜 주세요');
        return;
    }

    if (leaveData.leaveType === '전일휴가' && leaveDaysNum < 1.0) {
        alert('전일휴가는 휴가일수가 1.0일 이상이어야 합니다');
        return;
    }

    // 0-1. Working days 검증 (전일휴가만 해당)
    if (leaveData.leaveType === '전일휴가') {
        const workingDays = calculateWorkingDays(leaveData.startDate, leaveData.endDate);

        // 소수점이 있는 휴가일수인 경우 (예: 3.5일)
        if (leaveDaysNum % 1 !== 0) {
            const minWorkingDays = Math.floor(leaveDaysNum);
            const maxWorkingDays = Math.ceil(leaveDaysNum);

            // Working days가 최소값 이하인 경우
            if (workingDays <= minWorkingDays) {
                alert('휴가기간(Working day)이 휴가일수 보다 적습니다');
                return;
            }

            // Working days가 최대값 초과인 경우
            if (workingDays > maxWorkingDays) {
                alert('휴가기간(Working day)이 휴가일수 보다 큽니다');
                return;
            }
        } else {
            // 정수인 경우 기존 로직 유지
            const diff = Math.abs(workingDays - leaveDaysNum);
            if (diff >= 1.0) {
                alert('휴가 기간이 휴가 일수와 일치하지 않습니다');
                return;
            }
        }
    }

    // 1. 종료일이 시작일보다 이전인지 확인
    const startDateObj = new Date(leaveData.startDate);
    const endDateObj = new Date(leaveData.endDate);

    if (endDateObj < startDateObj) {
        alert('오류 : 종료일이 시작일 이전입니다');
        return;
    }

    // 2. 휴가일수에 따른 날짜 검증
    // 1일 초과인 경우 종료일은 시작일 이후여야 함
    if (leaveDaysNum > 1.0 && leaveData.startDate === leaveData.endDate) {
        alert('휴가일수가 1일을 초과하는 경우 종료일은 시작일 이후여야 합니다');
        return;
    }

    // 1일 이하인 경우 시작일과 종료일이 같아야 함
    if (leaveDaysNum <= 1.0 && leaveData.startDate !== leaveData.endDate) {
        alert('1.0일 이하의 휴가는 시작일과 종료일이 같아야합니다');
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

    // 일자 표시 형식
    const dateDisplay = leaveData.startDate === leaveData.endDate
        ? leaveData.startDate
        : `${leaveData.startDate} ~ ${leaveData.endDate}`;

    // 시간 항목 (전일휴가는 제외)
    const timeRow = leaveType === '전일휴가' ? '' : `
4. 시간: ${leaveData.startTime} ~ ${leaveData.endTime}`;

    // 공유사항 항목 (공유사항이 있을 경우에만 표시)
    const reasonRow = leaveData.reason ? `

* 공유사항
${leaveData.reason}` : '';

    // 이메일 제목 (경조휴가는 별도 제목)
    const emailTitle = leaveData.leaveType === '경조휴가' ? '[경조휴가]' : '[휴가신고]';
    const emailSubject = `${emailTitle} ${leaveData.reporterEnglishName}(${leaveData.startDate}, ${leaveData.leaveType}, ${leaveData.leaveDays}일)`;

    // 확인 팝업 표시
    const confirmMessage = `${emailSubject}

1. 신고자: ${leaveData.reporterEnglishName}
2. 휴가 일수: ${leaveData.leaveDays}일
3. 일자: ${dateDisplay}${timeRow}${reasonRow}

이메일로 발송됩니다.`;

    if (!confirm(confirmMessage)) {
        return; // 취소하면 제출 중단
    }

    const messageDiv = document.getElementById('message');
    messageDiv.className = 'message';
    messageDiv.textContent = '제출 중...';
    messageDiv.style.display = 'block';

    try {
        // Firestore에 저장하고 문서 참조 가져오기
        const docRef = await leaveRecordsCollection.add(leaveData);

        // 이메일 발송 상태 추적 변수
        let emailSent = false;
        let emailError = null;

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
                emailSent = true;
            } else {
                const errorText = await emailResponse.text();
                console.error('이메일 발송 실패:', errorText);
                emailError = `서버 응답 오류: ${errorText}`;
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('이메일 발송 시간 초과 (서버가 실행되지 않았을 수 있습니다)');
                emailError = '이메일 발송 시간 초과 (서버 응답 없음)';
            } else {
                console.error('이메일 발송 오류:', error);
                emailError = error.message;
            }
            // 이메일 발송 실패해도 신고는 완료된 것으로 처리
        }

        // Firestore에 이메일 발송 상태 업데이트
        await leaveRecordsCollection.doc(docRef.id).update({
            emailSent: emailSent,
            emailSentAt: emailSent ? firebase.firestore.FieldValue.serverTimestamp() : null,
            emailError: emailError
        });

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

// Flatpickr로 달력 초기화 (공휴일 표시)
flatpickr("#startDate", {
    locale: "ko",
    dateFormat: "Y-m-d",
    defaultDate: today,
    disableMobile: true, // 모바일에서도 커스텀 달력 사용 (공휴일 표시를 위해)
    onDayCreate: function(dObj, dStr, fp, dayElem) {
        // 로컬 날짜로 변환 (시간대 문제 방지)
        const year = dayElem.dateObj.getFullYear();
        const month = String(dayElem.dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dayElem.dateObj.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        // 공휴일 체크
        if (holidays2025.includes(dateStr)) {
            dayElem.classList.add('holiday');
        }
    }
});

flatpickr("#endDate", {
    locale: "ko",
    dateFormat: "Y-m-d",
    defaultDate: today,
    disableMobile: true, // 모바일에서도 커스텀 달력 사용 (공휴일 표시를 위해)
    onDayCreate: function(dObj, dStr, fp, dayElem) {
        // 로컬 날짜로 변환 (시간대 문제 방지)
        const year = dayElem.dateObj.getFullYear();
        const month = String(dayElem.dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dayElem.dateObj.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        // 공휴일 체크
        if (holidays2025.includes(dateStr)) {
            dayElem.classList.add('holiday');
        }
    }
});
