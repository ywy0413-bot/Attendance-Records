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
                <td colspan="8" class="error-message">데이터를 불러오는데 실패했습니다: ${error.message}</td>
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

// 통계 데이터 표시
function displayStats(records) {
    const tbody = document.getElementById('statsTableBody');

    if (records.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-message">휴가 기록이 없습니다.</td>
            </tr>
        `;
        updateSummary(0, 0);
        return;
    }

    // 총 휴가일수 계산
    let totalDays = 0;
    records.forEach(record => {
        const days = parseFloat(record.leaveDays) || 0;
        totalDays += days;
    });

    // 테이블 내용 생성
    tbody.innerHTML = records.map(record => {
        let createdDate = '알 수 없음';

        if (record.createdAt) {
            try {
                if (typeof record.createdAt.toDate === 'function') {
                    createdDate = record.createdAt.toDate().toLocaleDateString('ko-KR');
                } else {
                    createdDate = new Date(record.createdAt).toLocaleDateString('ko-KR');
                }
            } catch (error) {
                console.error('날짜 변환 오류:', error);
                createdDate = '알 수 없음';
            }
        }

        return `
            <tr>
                <td>${createdDate}</td>
                <td>${record.leaveType || '-'}</td>
                <td>${record.startDate || '-'}</td>
                <td>${record.endDate || '-'}</td>
                <td>${record.leaveDays || '-'}일</td>
                <td>${record.startTime || '-'}</td>
                <td>${record.endTime || '-'}</td>
                <td>${record.reason || '-'}</td>
            </tr>
        `;
    }).join('');

    // 요약 정보 업데이트
    updateSummary(totalDays, records.length);
}

// 요약 정보 업데이트
function updateSummary(totalDays, totalCount) {
    document.getElementById('totalDays').textContent = `${totalDays}일`;
    document.getElementById('totalCount').textContent = `${totalCount}건`;
}
