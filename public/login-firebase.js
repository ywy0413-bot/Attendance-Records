// Firebase 버전의 로그인 로직
// 페이지 로드 시 자동 로그인 체크 및 사용자 목록 로드
window.addEventListener('DOMContentLoaded', async () => {
    const savedUser = localStorage.getItem('userData');
    if (savedUser) {
        const userData = JSON.parse(savedUser);
        if (userData.rememberMe) {
            // 자동 로그인 - 메인 페이지로 이동
            window.location.href = 'main.html';
            return;
        }
    }

    // 사용자 목록 로드
    await loadUserList();
});

// 전역 변수로 사용자 목록 저장
let allUsersData = {};
let allUsers = [];

// 즐겨찾기 관리 함수
function getFavorites() {
    const favorites = localStorage.getItem('favoriteUsers');
    return favorites ? JSON.parse(favorites) : [];
}

function toggleFavorite(email) {
    let favorites = getFavorites();
    const index = favorites.indexOf(email);

    if (index > -1) {
        favorites.splice(index, 1); // 즐겨찾기 해제
    } else {
        favorites.push(email); // 즐겨찾기 추가
    }

    localStorage.setItem('favoriteUsers', JSON.stringify(favorites));
    renderUserOptions(document.getElementById('userSearch').value);
}

// 사용자 목록을 Firestore에서 가져와 드롭다운에 채우기
async function loadUserList() {
    try {
        const snapshot = await usersCollection.get();
        allUsers = [];

        snapshot.forEach(doc => {
            const userData = doc.data();
            const userInfo = {
                email: doc.id,
                name: userData.name,
                englishName: userData.englishName,
                department: userData.department || ''
            };
            allUsers.push(userInfo);
            allUsersData[doc.id] = userInfo;
        });

        // 커스텀 드롭다운 렌더링
        renderUserOptions();

        // 이벤트 리스너 설정
        setupCustomSelect();

    } catch (error) {
        console.error('사용자 목록 로드 오류:', error);
        const messageDiv = document.getElementById('message');
        messageDiv.className = 'message error';
        messageDiv.textContent = '사용자 목록을 불러오는데 실패했습니다.';
        messageDiv.style.display = 'block';
    }
}

// 사용자 옵션 렌더링
function renderUserOptions(searchQuery = '') {
    const favorites = getFavorites();
    const optionsList = document.getElementById('userOptionsList');

    // 검색어로 필터링
    let filteredUsers = allUsers.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // 즐겨찾기와 일반 사용자 분리
    const favoriteUsers = filteredUsers.filter(u => favorites.includes(u.email));
    const normalUsers = filteredUsers.filter(u => !favorites.includes(u.email));

    // 각각 가나다순 정렬
    favoriteUsers.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    normalUsers.sort((a, b) => a.name.localeCompare(b.name, 'ko'));

    // 즐겨찾기를 먼저, 그 다음 일반 사용자
    const sortedUsers = [...favoriteUsers, ...normalUsers];

    // HTML 생성
    optionsList.innerHTML = sortedUsers.map(user => {
        const isFavorite = favorites.includes(user.email);
        const starClass = isFavorite ? 'active' : 'inactive';
        const starIcon = isFavorite ? '⭐' : '☆';
        return `
            <div class="custom-select-option" data-email="${user.email}">
                <span class="custom-select-option-name">${user.name}</span>
                <span class="custom-select-favorite ${starClass}"
                      data-email="${user.email}"
                      onclick="event.stopPropagation(); toggleFavorite('${user.email}')">
                    ${starIcon}
                </span>
            </div>
        `;
    }).join('');

    // 옵션 클릭 이벤트
    optionsList.querySelectorAll('.custom-select-option').forEach(option => {
        option.addEventListener('click', function() {
            selectUser(this.dataset.email);
        });
    });
}

// 커스텀 셀렉트 이벤트 설정
function setupCustomSelect() {
    const trigger = document.getElementById('userSelectTrigger');
    const dropdown = document.getElementById('userSelectDropdown');
    const searchInput = document.getElementById('userSearch');

    // 드롭다운 토글
    trigger.addEventListener('click', function() {
        const isActive = dropdown.classList.contains('active');
        if (isActive) {
            closeDropdown();
        } else {
            openDropdown();
        }
    });

    // 검색 입력
    searchInput.addEventListener('input', function(e) {
        renderUserOptions(e.target.value);
    });

    // 드롭다운 외부 클릭 시 닫기
    document.addEventListener('click', function(e) {
        const wrapper = document.querySelector('.custom-select-wrapper');
        if (!wrapper.contains(e.target)) {
            closeDropdown();
        }
    });
}

function openDropdown() {
    const trigger = document.getElementById('userSelectTrigger');
    const dropdown = document.getElementById('userSelectDropdown');
    const searchInput = document.getElementById('userSearch');

    trigger.classList.add('active');
    dropdown.classList.add('active');
    searchInput.value = '';
    searchInput.focus();
    renderUserOptions();
}

function closeDropdown() {
    const trigger = document.getElementById('userSelectTrigger');
    const dropdown = document.getElementById('userSelectDropdown');

    trigger.classList.remove('active');
    dropdown.classList.remove('active');
}

// 사용자 선택
function selectUser(email) {
    const user = allUsersData[email];
    if (user) {
        document.getElementById('selectedUserName').textContent = user.name;
        document.getElementById('userName').value = email;
        updatePinField();
        closeDropdown();
    }
}

// 선택한 사용자에 따라 PIN 필드 업데이트
function updatePinField() {
    const email = document.getElementById('userName').value;
    const pinInput = document.getElementById('pin');
    const pinLabel = document.querySelector('label[for="pin"]');
    const pinHelp = document.querySelector('small');

    if (email && allUsersData[email]) {
        const department = allUsersData[email].department;

        if (department === '기업발전그룹') {
            pinInput.setAttribute('maxlength', '6');
            pinInput.removeAttribute('pattern');
            pinInput.removeAttribute('inputmode');
            pinInput.setAttribute('placeholder', '6자리 영문숫자');
            pinLabel.textContent = 'PIN 번호 (6자리 영문숫자) *';
            pinHelp.textContent = '영문숫자 6자리를 입력하세요';
        } else {
            pinInput.setAttribute('maxlength', '4');
            pinInput.setAttribute('pattern', '[0-9]{4}');
            pinInput.setAttribute('inputmode', 'numeric');
            pinInput.setAttribute('placeholder', '4자리 숫자');
            pinLabel.textContent = 'PIN 번호 (4자리) *';
            pinHelp.textContent = 'PIN번호는 개인 휴대전화 뒤 4자리입니다';
        }

        // PIN 입력 초기화
        pinInput.value = '';
    }
}

// 로그인 폼 제출
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const messageDiv = document.getElementById('message');
    const email = document.getElementById('userName').value;
    const pin = document.getElementById('pin').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    if (!email) {
        alert('사용자를 선택해주세요.');
        return;
    }

    if (!pin) {
        alert('PIN 번호를 입력해주세요.');
        return;
    }

    messageDiv.className = 'message';
    messageDiv.textContent = '로그인 중...';
    messageDiv.style.display = 'block';

    try {
        const userDoc = await usersCollection.doc(email).get();

        if (!userDoc.exists) {
            throw new Error('존재하지 않는 사용자입니다.');
        }

        const userData = userDoc.data();
        const storedPin = userData.pin;

        if (pin === storedPin) {
            const userInfo = {
                email: email,
                name: userData.name,
                englishName: userData.englishName,
                department: userData.department || '',
                rememberMe: rememberMe
            };

            localStorage.setItem('userData', JSON.stringify(userInfo));

            messageDiv.className = 'message success';
            messageDiv.textContent = '로그인 성공! 메인 페이지로 이동합니다...';

            setTimeout(() => {
                window.location.href = 'main.html';
            }, 500);

        } else {
            throw new Error('PIN 번호가 올바르지 않습니다.');
        }

    } catch (error) {
        console.error('로그인 오류:', error);
        messageDiv.className = 'message error';
        messageDiv.textContent = error.message || '로그인에 실패했습니다.';
    }
});
