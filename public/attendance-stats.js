// 로그인한 사용자 정보 확인
if (!currentUser) {
    window.location.href = 'index.html';
} else {
    document.getElementById('userEmail').textContent = currentUser.email;
}

let allAttendanceRecords = [];
let availableYears = new Set();

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

        // 당직과 전일 야근 제외하고 시간 계산
        if (type !== '당직' && type !== '전일 야근' && record.startTime && record.endTime) {
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

        return `
            <tr>
                <td>${createdDate}</td>
                <td>${record.attendanceType || '-'}</td>
                <td>${formatShortDate(record.date)}</td>
                <td>${record.startTime || '-'}</td>
                <td>${record.endTime || '-'}</td>
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
    document.getElementById('totalCount').textContent = `${totalCount}건`;

    // 5가지 근태 유형 모두 표시 (0건이어도)
    const types = ['외출', '출근지연', '조기퇴근', '당직', '전일 야근'];
    const typeBreakdown = types
        .map(type => `${type} ${typeCount[type] || 0}건`)
        .join(', ');

    document.getElementById('typeBreakdown').textContent = typeBreakdown;

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
