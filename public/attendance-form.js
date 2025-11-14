// 버전 확인 로그
console.log('Attendance Form Version: 2024-11-12-v2');

// 시간/분 옵션 생성
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
document.getElementById('date').value = today;
