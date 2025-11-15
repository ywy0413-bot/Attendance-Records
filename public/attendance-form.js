// 버전 확인 로그
console.log('Attendance Form Version: 2024-11-12-v2');

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

// 시간/분 옵션 생성 (시작: 08~17, 종료: 08~18)
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

// 사유 선택 시 직접입력 필드 표시/숨김
document.getElementById('reasonSelect').addEventListener('change', function() {
    const customReasonGroup = document.getElementById('customReasonGroup');
    const customReasonInput = document.getElementById('customReason');

    if (this.value === '직접입력') {
        customReasonGroup.style.display = 'block';
        customReasonInput.required = true;
    } else {
        customReasonGroup.style.display = 'none';
        customReasonInput.required = false;
        customReasonInput.value = '';
    }
});

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

    // 사유 값 가져오기
    const reasonSelect = document.getElementById('reasonSelect').value;
    const reasonValue = reasonSelect === '직접입력'
        ? document.getElementById('customReason').value
        : reasonSelect;

    // 폼 데이터 수집
    const attendanceData = {
        reporter: currentUser.email,
        reporterName: currentUserData?.name || currentUser.email,
        reporterEnglishName: currentUserData?.englishName || currentUser.email,
        attendanceType: document.getElementById('attendanceType').value,
        date: document.getElementById('date').value,
        startTime: startTime,
        endTime: endTime,
        reason: reasonValue,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    // 시간차 계산 (분 단위로 통일)
    let timeDuration = '';
    let durationText = '';
    let diffMinutes = 0;

    if (attendanceData.startTime && attendanceData.endTime) {
        const [startH, startM] = attendanceData.startTime.split(':').map(Number);
        const [endH, endM] = attendanceData.endTime.split(':').map(Number);
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;
        diffMinutes = endMinutes - startMinutes;

        // 종료시간이 시작시간보다 이전이거나 같은 경우 오류
        if (diffMinutes <= 0) {
            alert('종료시간은 시작시간 이후여야 합니다');
            return;
        }

        // 근태 종류별 시간 제한 검증
        const attendanceType = attendanceData.attendanceType;

        if (attendanceType === '출근지연' || attendanceType === '조기퇴근' || attendanceType === '외출') {
            // 출근지연, 조기퇴근, 외출은 120분 미만
            if (diffMinutes >= 120) {
                alert('120분 미만으로만 사용이 가능합니다.');
                return;
            }
        } else if (attendanceType === '당직휴식') {
            // 당직휴식은 120분 이하
            if (diffMinutes > 120) {
                alert('120분 이하로만 사용이 가능합니다.');
                return;
            }
        }
        // 전일 야근은 시간 제한 없음

        // 분 단위로만 표시
        timeDuration = `(${diffMinutes}분)`;
        durationText = `${diffMinutes}분`;
    }

    const timeDisplay = attendanceData.endTime
        ? `${attendanceData.startTime} ~ ${attendanceData.endTime} ${timeDuration}`
        : attendanceData.startTime;

    // 이메일 제목
    const emailSubject = `[근태공유] ${attendanceData.reporterEnglishName}(${attendanceData.date}, ${attendanceData.attendanceType}, ${durationText})`;

    // 확인 팝업 표시
    const confirmMessage = `${emailSubject}

1. 신고자: ${attendanceData.reporterEnglishName}
2. 근태 내용: ${attendanceData.attendanceType}
3. 일자: ${attendanceData.date}
4. 시간: ${timeDisplay}
5. 사유: ${attendanceData.reason}

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

        // 성공 팝업 표시
        alert('메일이 성공적으로 발송되었습니다.');

        // 폼 초기화
        document.getElementById('attendanceForm').reset();

        // 메인 페이지로 이동
        window.location.href = 'main.html';
    } catch (error) {
        console.error('근태 신고 오류:', error);
        messageDiv.className = 'message error';
        messageDiv.textContent = '오류가 발생했습니다: ' + error.message;
    }
});

// 오늘 날짜를 기본값으로 설정
const today = new Date().toISOString().split('T')[0];

// Flatpickr로 달력 초기화 (공휴일 표시)
flatpickr("#date", {
    locale: "ko",
    dateFormat: "Y-m-d",
    defaultDate: today,
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
