// 로그인한 사용자 정보 확인
if (!currentUser) {
    window.location.href = 'index.html';
} else {
    document.getElementById('userEmail').textContent = currentUser.email;
}

let allLeaveRecords = [];
let availableYears = new Set();

// 페이지 로드 시 휴가 데이터 불러오기
loadLeaveStats();

// 휴가 통계 데이터 불러오기
async function loadLeaveStats() {
    try {
        // 현재 사용자의 휴가 기록만 가져오기
        const snapshot = await leaveRecordsCollection
            .where('reporter', '==', currentUser.email)
            .get();

        allLeaveRecords = [];
        availableYears.clear();

        snapshot.forEach(doc => {
            const recordData = doc.data();
            allLeaveRecords.push({
                id: doc.id,
                ...recordData
            });

            // 연도 추출 (시작일 기준)
            if (recordData.startDate) {
                const year = recordData.startDate.substring(0, 4);
                availableYears.add(year);
            }
        });

        // 최신순으로 정렬 (신고일 기준)
        allLeaveRecords.sort((a, b) => {
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
        displayStats(allLeaveRecords);

    } catch (error) {
        console.error('휴가 통계 로드 오류:', error);
        document.getElementById('statsTableBody').innerHTML = `
            <tr>
                <td colspan="7" class="error-message">데이터를 불러오는데 실패했습니다: ${error.message}</td>
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
        displayStats(allLeaveRecords);
    } else {
        const filteredRecords = allLeaveRecords.filter(record => {
            if (record.startDate) {
                const year = record.startDate.substring(0, 4);
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
                <td colspan="7" class="empty-message">휴가 기록이 없습니다.</td>
            </tr>
        `;
        updateSummary(0);
        return;
    }

    // 총 휴가일수 계산 (경조휴가 제외)
    let totalDays = 0;
    records.forEach(record => {
        // 경조휴가는 카운팅에서 제외
        if (record.leaveType !== '경조휴가') {
            const days = parseFloat(record.leaveDays) || 0;
            totalDays += days;
        }
    });

    // 테이블 내용 생성
    tbody.innerHTML = records.map(record => {
        return `
            <tr>
                <td>${record.leaveType || '-'}</td>
                <td>${formatShortDate(record.startDate)}</td>
                <td>${formatShortDate(record.endDate)}</td>
                <td>${record.leaveDays || '-'}일</td>
                <td>${record.startTime || '-'}</td>
                <td>${record.endTime || '-'}</td>
                <td><button onclick="deleteLeaveRecord('${record.id}')" class="btn-delete">삭제</button></td>
            </tr>
        `;
    }).join('');

    // 요약 정보 업데이트
    updateSummary(totalDays);
}

// 요약 정보 업데이트
function updateSummary(totalDays) {
    document.getElementById('totalDays').textContent = `${totalDays}일`;
}

// 휴가 기록 삭제
async function deleteLeaveRecord(recordId) {
    if (!confirm('정말 이 휴가 기록을 삭제하시겠습니까?')) {
        return;
    }

    try {
        // Firestore에서 삭제
        await leaveRecordsCollection.doc(recordId).delete();

        console.log('휴가 기록이 삭제되었습니다:', recordId);

        // 데이터 다시 불러오기
        await loadLeaveStats();

    } catch (error) {
        console.error('휴가 기록 삭제 오류:', error);
        alert('삭제 중 오류가 발생했습니다: ' + error.message);
    }
}

// Outlook 휴가 신고 추가
async function addOutlookLeaveRecord() {
    const leaveType = document.getElementById('outlookLeaveType').value;
    const leaveStartDate = document.getElementById('outlookLeaveStartDate').value;
    const leaveDays = parseFloat(document.getElementById('outlookLeaveDays').value);

    // 입력값 검증
    if (!leaveType) {
        alert('휴가 종류를 선택해주세요.');
        return;
    }

    if (!leaveStartDate) {
        alert('휴가 시작일을 선택해주세요.');
        return;
    }

    if (!leaveDays || leaveDays <= 0) {
        alert('휴가 일수를 입력해주세요.');
        return;
    }

    // 휴가 종류별 일수 검증
    if (leaveType === '반차' && leaveDays !== 0.5) {
        alert('휴가 일수를 정확하게 입력해주세요');
        return;
    }

    if (leaveType === '반반차' && leaveDays !== 0.25) {
        alert('휴가 일수를 정확하게 입력해주세요');
        return;
    }

    if (leaveType === '반차+반반차' && leaveDays !== 0.75) {
        alert('휴가 일수를 정확하게 입력해주세요');
        return;
    }

    if (leaveType === '전일휴가' && leaveDays < 1.0) {
        alert('전일휴가는 휴가일수가 1.0일 이상이어야 합니다');
        return;
    }

    if (!confirm(`${leaveType} ${leaveDays}일을 추가하시겠습니까?`)) {
        return;
    }

    try {
        // 시작/종료 시간 계산 (0.25일 = 2시간, 0.5일 = 4시간, 0.75일 = 6시간, 1.0일 = 8시간)
        const hours = Math.floor(leaveDays * 8);
        const startHour = 9;
        const endHour = startHour + hours;

        const startTime = `${String(startHour).padStart(2, '0')}:00`;
        const endTime = `${String(endHour).padStart(2, '0')}:00`;

        // Outlook 휴가 기록 생성
        const outlookData = {
            reporter: currentUser.email,
            reporterName: currentUser.email,
            reporterEnglishName: currentUser.email,
            leaveType: leaveType,
            leaveDays: leaveDays.toString(),
            startDate: leaveStartDate,
            endDate: leaveStartDate,
            startTime: startTime,
            endTime: endTime,
            reason: 'Outlook 신고',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            isOutlookRecord: true
        };

        // Firestore에 저장
        await leaveRecordsCollection.add(outlookData);

        console.log('Outlook 휴가 신고가 추가되었습니다:', outlookData);

        alert(`${leaveType} ${leaveDays}일이 추가되었습니다.`);

        // 입력 필드 초기화
        document.getElementById('outlookLeaveType').value = '';
        document.getElementById('outlookLeaveStartDate').value = '';
        document.getElementById('outlookLeaveDays').value = '';

        // 데이터 다시 불러오기
        await loadLeaveStats();

    } catch (error) {
        console.error('Outlook 휴가 신고 추가 오류:', error);
        alert('추가 중 오류가 발생했습니다: ' + error.message);
    }
}
