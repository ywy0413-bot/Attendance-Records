// 로그인한 사용자 정보 확인
if (!currentUser) {
    window.location.href = 'index.html';
} else {
    document.getElementById('userEmail').textContent = currentUser.email;
}

let allAttendanceRecords = [];
let availableYears = new Set();
let currentCumulativeMinutes = 0; // 현재 누계 시간 (분)

// 페이지 로드 시 근태 데이터 불러오기
loadAttendanceStats();

// 근태 통계 데이터 불러오기
async function loadAttendanceStats() {
    try {
        // 현재 사용자의 근태 기록만 가져오기
        const snapshot = await attendanceRecordsCollection
            .where('reporter', '==', currentUser.email)
            .get();

        allAttendanceRecords = [];
        availableYears.clear();

        snapshot.forEach(doc => {
            const recordData = doc.data();
            allAttendanceRecords.push({
                id: doc.id,
                ...recordData
            });

            // 연도 추출 (날짜 기준)
            if (recordData.date) {
                const year = recordData.date.substring(0, 4);
                availableYears.add(year);
            }
        });

        // 최신순으로 정렬 (신고일 기준)
        allAttendanceRecords.sort((a, b) => {
            if (!a.createdAt) return 1;
            if (!b.createdAt) return -1;

            try {
                const aTime = typeof a.createdAt.toMillis === 'function'
                    ? a.createdAt.toMillis()
                    : new Date(a.createdAt).getTime();
                const bTime = typeof b.createdAt.toMillis === 'function'
                    ? b.createdAt.toMillis()
                    : new Date(b.createdAt).getTime();

                return bTime - aTime;
            } catch (error) {
                console.error('정렬 오류:', error);
                return 0;
            }
        });

        // 연도 필터 옵션 생성
        populateYearFilter();

        // 데이터 표시
        displayStats(allAttendanceRecords);

    } catch (error) {
        console.error('근태 통계 로드 오류:', error);
        document.getElementById('statsTableBody').innerHTML = `
            <tr>
                <td colspan="6" class="error-message">데이터를 불러오는데 실패했습니다: ${error.message}</td>
            </tr>
        `;
    }
}

// 연도 필터 옵션 생성
function populateYearFilter() {
    const yearFilter = document.getElementById('yearFilter');

    // 기존 옵션 제거 (전체 제외)
    yearFilter.innerHTML = '<option value="all">전체</option>';

    // 연도를 내림차순으로 정렬
    const sortedYears = Array.from(availableYears).sort((a, b) => b.localeCompare(a));

    sortedYears.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = `${year}년`;
        yearFilter.appendChild(option);
    });
}

// 연도별 필터링
function filterByYear() {
    const selectedYear = document.getElementById('yearFilter').value;

    if (selectedYear === 'all') {
        displayStats(allAttendanceRecords);
    } else {
        const filteredRecords = allAttendanceRecords.filter(record => {
            if (record.date) {
                const year = record.date.substring(0, 4);
                return year === selectedYear;
            }
            return false;
        });
        displayStats(filteredRecords);
    }
}

// 날짜를 짧은 형식으로 변환 (YY.M.D)
function formatShortDate(dateStr) {
    if (!dateStr || dateStr === '-') return '-';

    try {
        // YYYY-MM-DD 형식인 경우
        if (typeof dateStr === 'string' && dateStr.includes('-')) {
            const [year, month, day] = dateStr.split('-');
            return `${year.slice(2)}.${parseInt(month)}.${parseInt(day)}`;
        }
        // Date 객체인 경우
        const date = new Date(dateStr);
        const year = date.getFullYear().toString().slice(2);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${year}.${month}.${day}`;
    } catch (error) {
        return dateStr;
    }
}

// 통계 데이터 표시
function displayStats(records) {
    const tbody = document.getElementById('statsTableBody');

    if (records.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-message">근태 기록이 없습니다.</td>
            </tr>
        `;
        updateSummary(0, {});
        return;
    }

    // 근태 유형별 개수 집계 및 누계 시간 계산
    const typeCount = {};
    let totalMinutes = 0; // 당직과 전일야근 제외한 총 시간 (분)

    records.forEach(record => {
        const type = record.attendanceType || '기타';
        typeCount[type] = (typeCount[type] || 0) + 1;

        // 휴가 차감인 경우
        if (record.isDeduction && record.deductionMinutes) {
            totalMinutes -= record.deductionMinutes;
        }
        // 당직과 전일 야근 제외하고 시간 계산
        else if (type !== '당직' && type !== '전일 야근' && record.startTime && record.endTime) {
            try {
                const [startH, startM] = record.startTime.split(':').map(Number);
                const [endH, endM] = record.endTime.split(':').map(Number);
                const diffMinutes = (endH * 60 + endM) - (startH * 60 + startM);
                if (diffMinutes > 0) {
                    totalMinutes += diffMinutes;
                }
            } catch (error) {
                console.error('시간 계산 오류:', error);
            }
        }
    });

    // 테이블 내용 생성
    tbody.innerHTML = records.map(record => {
        let createdDate = '알 수 없음';

        if (record.createdAt) {
            try {
                if (typeof record.createdAt.toDate === 'function') {
                    createdDate = formatShortDate(record.createdAt.toDate());
                } else {
                    createdDate = formatShortDate(new Date(record.createdAt));
                }
            } catch (error) {
                console.error('날짜 변환 오류:', error);
                createdDate = '알 수 없음';
            }
        }

        // 휴가 차감인 경우 시간 표시를 다르게
        let startTimeDisplay = record.startTime || '-';
        let endTimeDisplay = record.endTime || '-';

        if (record.isDeduction && record.deductionMinutes) {
            startTimeDisplay = '-';
            endTimeDisplay = `-${record.deductionMinutes}분`;
        }

        return `
            <tr>
                <td>${createdDate}</td>
                <td>${record.attendanceType || '-'}</td>
                <td>${formatShortDate(record.date)}</td>
                <td>${startTimeDisplay}</td>
                <td>${endTimeDisplay}</td>
                <td>${record.reason || '-'}</td>
                <td><button onclick="deleteAttendanceRecord('${record.id}')" class="btn-delete">삭제</button></td>
            </tr>
        `;
    }).join('');

    // 요약 정보 업데이트
    updateSummary(records.length, typeCount, totalMinutes);
}

// 요약 정보 업데이트
function updateSummary(totalCount, typeCount, totalMinutes = 0) {
    // 전역 변수 업데이트
    currentCumulativeMinutes = totalMinutes;

    // totalCount 요소가 있으면 업데이트 (제거되었을 수 있음)
    const totalCountElement = document.getElementById('totalCount');
    if (totalCountElement) {
        totalCountElement.textContent = `${totalCount}건`;
    }

    // 5가지 근태 유형 모두 표시 (0건이어도) - 2열 그리드로 표시
    const types = ['외출', '출근지연', '조기퇴근', '당직', '전일 야근'];
    const typeBreakdownHTML = `
        <div class="type-grid">
            ${types.map(type => `
                <div class="type-item">${type} ${typeCount[type] || 0}건</div>
            `).join('')}
        </div>
    `;

    document.getElementById('typeBreakdown').innerHTML = typeBreakdownHTML;

    // 누계 시간 표시 (시간과 분으로 변환)
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const cumulativeTime = hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`;

    // HTML에 누계 시간 엘리먼트가 있으면 업데이트
    const cumulativeElement = document.getElementById('cumulativeTime');
    if (cumulativeElement) {
        cumulativeElement.textContent = cumulativeTime;
    }
}

// 근태 기록 삭제
async function deleteAttendanceRecord(recordId) {
    if (!confirm('정말 이 근태 기록을 삭제하시겠습니까?')) {
        return;
    }

    try {
        // Firestore에서 삭제
        await attendanceRecordsCollection.doc(recordId).delete();

        console.log('근태 기록이 삭제되었습니다:', recordId);

        // 데이터 다시 불러오기
        await loadAttendanceStats();

    } catch (error) {
        console.error('근태 기록 삭제 오류:', error);
        alert('삭제 중 오류가 발생했습니다: ' + error.message);
    }
}

// 휴가 차감
async function deductVacation() {
    const vacationDays = parseFloat(document.getElementById('vacationDays').value);
    const minutesToDeduct = vacationDays * 480; // 1일 = 480분, 0.25일 = 120분

    // 누계 시간이 120분 미만이면 차감 불가
    if (currentCumulativeMinutes < 120) {
        alert('휴가 차감은 0.25일(120분) 미만인 경우 불가능합니다.');
        return;
    }

    // 누계 시간이 차감하려는 시간보다 적으면 에러
    if (currentCumulativeMinutes < minutesToDeduct) {
        alert(`누계 시간이 부족합니다. 현재 누계: ${currentCumulativeMinutes}분, 차감 시도: ${minutesToDeduct}분`);
        return;
    }

    if (!confirm(`${vacationDays}일 (${minutesToDeduct}분)을 차감하시겠습니까?`)) {
        return;
    }

    try {
        // 휴가 차감 기록 생성
        const deductionData = {
            reporter: currentUser.email,
            reporterName: currentUser.email,
            reporterEnglishName: currentUser.email,
            attendanceType: '휴가차감',
            date: new Date().toISOString().split('T')[0],
            startTime: '00:00',
            endTime: `00:${String(minutesToDeduct).padStart(2, '0')}`,
            reason: `휴가 ${vacationDays}일 차감`,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            isDeduction: true, // 차감 기록 표시
            deductionMinutes: minutesToDeduct // 차감 분수 저장
        };

        // Firestore에 저장
        await attendanceRecordsCollection.add(deductionData);

        console.log('휴가 차감이 기록되었습니다:', deductionData);

        alert(`${vacationDays}일 (${minutesToDeduct}분)이 차감되었습니다.`);

        // 데이터 다시 불러오기
        await loadAttendanceStats();

    } catch (error) {
        console.error('휴가 차감 오류:', error);
        alert('차감 중 오류가 발생했습니다: ' + error.message);
    }
}

// Outlook 신고 추가
async function addOutlookRecord() {
    const outlookType = document.getElementById('outlookType').value;
    const outlookMinutes = parseInt(document.getElementById('outlookMinutes').value);

    // 입력값 검증
    if (!outlookType) {
        alert('근태 종류를 선택해주세요.');
        return;
    }

    if (!outlookMinutes || outlookMinutes <= 0) {
        alert('소요시간을 입력해주세요.');
        return;
    }

    if (outlookMinutes > 480) {
        alert('소요시간은 480분(8시간)을 초과할 수 없습니다.');
        return;
    }

    if (!confirm(`${outlookType} ${outlookMinutes}분을 추가하시겠습니까?`)) {
        return;
    }

    try {
        // 현재 시간 기준으로 시작/종료 시간 생성 (오늘 날짜)
        const now = new Date();
        const startHour = 9; // 기본 시작 시간 09:00
        const startMinute = 0;
        const endHour = Math.floor((startMinute + outlookMinutes) / 60) + startHour;
        const endMinute = (startMinute + outlookMinutes) % 60;

        const startTime = `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`;
        const endTime = `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;

        // Outlook 신고 기록 생성
        const outlookData = {
            reporter: currentUser.email,
            reporterName: currentUser.email,
            reporterEnglishName: currentUser.email,
            attendanceType: outlookType,
            date: now.toISOString().split('T')[0],
            startTime: startTime,
            endTime: endTime,
            reason: '직접입력',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            isOutlookRecord: true // Outlook 기록 표시
        };

        // Firestore에 저장
        await attendanceRecordsCollection.add(outlookData);

        console.log('Outlook 신고가 추가되었습니다:', outlookData);

        alert(`${outlookType} ${outlookMinutes}분이 추가되었습니다.`);

        // 입력 필드 초기화
        document.getElementById('outlookType').value = '';
        document.getElementById('outlookMinutes').value = '';

        // 데이터 다시 불러오기
        await loadAttendanceStats();

    } catch (error) {
        console.error('Outlook 신고 추가 오류:', error);
        alert('추가 중 오류가 발생했습니다: ' + error.message);
    }
}
