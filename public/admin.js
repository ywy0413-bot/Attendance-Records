// 관리자 권한 체크
if (!currentUser) {
    window.location.href = 'login.html';
} else {
    // 관리자 이메일 표시
    document.getElementById('adminEmail').textContent = currentUser.email;

    // 관리자 권한 확인 (특정 이메일만 관리자로 설정)
    const adminEmails = ['gwp@envision.co.kr', 'admin@company.com', 'manager@company.com'];
    if (!adminEmails.includes(currentUser.email)) {
        alert('관리자 권한이 없습니다.');
        window.location.href = 'index.html';
    }
}

let allUsers = [];

// 페이지 로드 시 사용자 목록 불러오기
loadUsers();

// 사용자 추가 폼 제출
document.getElementById('addUserForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const messageDiv = document.getElementById('message');
    const email = document.getElementById('newUserEmail').value;
    const name = document.getElementById('newUserName').value;
    const englishName = document.getElementById('newUserEnglishName').value;
    const pin = document.getElementById('newUserPin').value;
    const dept = document.getElementById('newUserDept').value;

    // PIN 유효성 검사
    if (!/^\d{4}$/.test(pin)) {
        messageDiv.className = 'message error';
        messageDiv.textContent = 'PIN은 4자리 숫자여야 합니다.';
        return;
    }

    messageDiv.className = 'message';
    messageDiv.textContent = '사용자 추가 중...';
    messageDiv.style.display = 'block';

    try {
        // Firestore에 사용자 추가
        await usersCollection.doc(email).set({
            email: email,
            name: name,
            englishName: englishName,
            pin: pin,
            department: dept || '',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdBy: currentUser.email
        });

        messageDiv.className = 'message success';
        messageDiv.textContent = '사용자가 성공적으로 추가되었습니다.';

        // 폼 초기화
        document.getElementById('addUserForm').reset();

        // 사용자 목록 새로고침
        loadUsers();

        // 3초 후 메시지 숨김
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 3000);

    } catch (error) {
        console.error('사용자 추가 오류:', error);
        messageDiv.className = 'message error';
        messageDiv.textContent = '오류가 발생했습니다: ' + error.message;
    }
});

// 사용자 목록 불러오기
async function loadUsers() {
    try {
        const snapshot = await usersCollection.get();
        allUsers = [];

        snapshot.forEach(doc => {
            const userData = doc.data();
            allUsers.push({
                id: doc.id,
                ...userData
            });
        });

        // 클라이언트 측에서 정렬 (최신순)
        allUsers.sort((a, b) => {
            if (!a.createdAt) return 1;
            if (!b.createdAt) return -1;

            try {
                // Firestore Timestamp 객체인지 확인
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

        displayUsers(allUsers);
    } catch (error) {
        console.error('사용자 목록 로드 오류:', error);
        document.getElementById('userTableBody').innerHTML = `
            <tr>
                <td colspan="6" class="error-message">사용자 목록을 불러오는데 실패했습니다: ${error.message}</td>
            </tr>
        `;
    }
}

// 사용자 목록 표시
function displayUsers(users) {
    const tbody = document.getElementById('userTableBody');

    if (users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-message">등록된 사용자가 없습니다.</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = users.map(user => {
        let createdDate = '알 수 없음';

        if (user.createdAt) {
            try {
                // Firestore Timestamp 객체인지 확인
                if (typeof user.createdAt.toDate === 'function') {
                    createdDate = user.createdAt.toDate().toLocaleDateString('ko-KR');
                } else {
                    createdDate = new Date(user.createdAt).toLocaleDateString('ko-KR');
                }
            } catch (error) {
                console.error('날짜 변환 오류:', error);
                createdDate = '알 수 없음';
            }
        }

        return `
            <tr>
                <td>${user.email}</td>
                <td>${user.name}</td>
                <td>${user.englishName || '-'}</td>
                <td>${user.department || '-'}</td>
                <td>${createdDate}</td>
                <td>
                    <button onclick="editUser('${user.id}')" class="btn-edit">수정</button>
                    <button onclick="deleteUser('${user.id}')" class="btn-delete">삭제</button>
                </td>
            </tr>
        `;
    }).join('');
}

// 사용자 검색 필터링
function filterUsers() {
    const searchTerm = document.getElementById('searchUser').value.toLowerCase();

    if (searchTerm === '') {
        displayUsers(allUsers);
        return;
    }

    const filteredUsers = allUsers.filter(user =>
        user.email.toLowerCase().includes(searchTerm) ||
        user.name.toLowerCase().includes(searchTerm) ||
        (user.englishName && user.englishName.toLowerCase().includes(searchTerm)) ||
        (user.department && user.department.toLowerCase().includes(searchTerm))
    );

    displayUsers(filteredUsers);
}

// 사용자 삭제
async function deleteUser(userId) {
    if (!confirm(`사용자 "${userId}"를 정말 삭제하시겠습니까?`)) {
        return;
    }

    try {
        await usersCollection.doc(userId).delete();

        const messageDiv = document.getElementById('message');
        messageDiv.className = 'message success';
        messageDiv.textContent = '사용자가 삭제되었습니다.';
        messageDiv.style.display = 'block';

        // 목록 새로고침
        loadUsers();

        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 3000);

    } catch (error) {
        console.error('사용자 삭제 오류:', error);
        alert('사용자 삭제 중 오류가 발생했습니다: ' + error.message);
    }
}

// 사용자 수정
async function editUser(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;

    const newName = prompt('새로운 이름:', user.name);
    if (!newName) return;

    const newEnglishName = prompt('새로운 영어이름:', user.englishName || '');
    if (!newEnglishName) return;

    const newDept = prompt('새로운 그룹:', user.department || '');
    const newPin = prompt('새로운 PIN (4자리, 변경하지 않으려면 비워두세요):', '');

    if (newPin && !/^\d{4}$/.test(newPin)) {
        alert('PIN은 4자리 숫자여야 합니다.');
        return;
    }

    try {
        const updateData = {
            name: newName,
            englishName: newEnglishName,
            department: newDept,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedBy: currentUser.email
        };

        if (newPin) {
            updateData.pin = newPin;
        }

        await usersCollection.doc(userId).update(updateData);

        const messageDiv = document.getElementById('message');
        messageDiv.className = 'message success';
        messageDiv.textContent = '사용자 정보가 수정되었습니다.';
        messageDiv.style.display = 'block';

        // 목록 새로고침
        loadUsers();

        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 3000);

    } catch (error) {
        console.error('사용자 수정 오류:', error);
        alert('사용자 수정 중 오류가 발생했습니다: ' + error.message);
    }
}

// PIN 입력 시 숫자만 입력되도록
document.getElementById('newUserPin').addEventListener('input', function(e) {
    this.value = this.value.replace(/[^\d]/g, '');
});
