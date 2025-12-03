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

// 사용자 목록을 Firestore에서 가져와 드롭다운에 채우기
async function loadUserList() {
    try {
        const snapshot = await usersCollection.get();
        const users = [];

        snapshot.forEach(doc => {
            const userData = doc.data();
            const userInfo = {
                email: doc.id,
                name: userData.name,
                englishName: userData.englishName,
                department: userData.department || ''
            };
            users.push(userInfo);
            allUsersData[doc.id] = userInfo; // 이메일을 키로 저장
        });

        // 이름을 가나다 순으로 정렬
        users.sort((a, b) => a.name.localeCompare(b.name, 'ko'));

        // 드롭다운에 옵션 추가
        const userSelect = document.getElementById('userName');
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.email;
            option.textContent = user.name;
            userSelect.appendChild(option);
        });

        // 사용자 선택 시 PIN 필드 업데이트
        userSelect.addEventListener('change', updatePinField);

    } catch (error) {
        console.error('사용자 목록 로드 오류:', error);
        const messageDiv = document.getElementById('message');
        messageDiv.className = 'message error';
        messageDiv.textContent = '사용자 목록을 불러오는데 실패했습니다.';
        messageDiv.style.display = 'block';
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
    const email = document.getElementById('userName').value; // 선택된 사용자의 이메일
    const pin = document.getElementById('pin').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    // 사용자 부서 확인
    const department = allUsersData[email]?.department || '';

    // PIN 유효성 검사 (기업발전그룹은 6자리 영문숫자, 나머지는 4자리 숫자)
    if (department === '기업발전그룹') {
        if (!/^[a-zA-Z0-9]{6}$/.test(pin)) {
            messageDiv.className = 'message error';
            messageDiv.textContent = 'PIN은 6자리 영문숫자여야 합니다.';
            messageDiv.style.display = 'block';
            return;
        }
    } else {
        if (!/^\d{4}$/.test(pin)) {
            messageDiv.className = 'message error';
            messageDiv.textContent = 'PIN은 4자리 숫자여야 합니다.';
            messageDiv.style.display = 'block';
            return;
        }
    }

    messageDiv.className = 'message';
    messageDiv.textContent = '로그인 중...';
    messageDiv.style.display = 'block';

    try {
        // Firestore에서 사용자 확인
        const userDoc = await usersCollection.doc(email).get();

        if (userDoc.exists) {
            const userData = userDoc.data();

            // PIN 확인
            if (userData.pin === pin) {
                // 로그인 성공 - 사용자 정보 저장
                const loginData = {
                    email: email,
                    name: userData.name || email,
                    department: userData.department || '',
                    rememberMe: rememberMe,
                    loginTime: new Date().toISOString()
                };

                localStorage.setItem('userData', JSON.stringify(loginData));

                messageDiv.className = 'message success';
                messageDiv.textContent = '로그인 성공! 메인 페이지로 이동합니다...';

                // 1초 후 메인 페이지로 이동
                setTimeout(() => {
                    window.location.href = 'main.html';
                }, 1000);
            } else {
                throw new Error('PIN이 올바르지 않습니다.');
            }
        } else {
            throw new Error('등록되지 않은 이메일입니다.');
        }
    } catch (error) {
        console.error('로그인 오류:', error);
        messageDiv.className = 'message error';
        messageDiv.textContent = '로그인 오류: ' + error.message;
    }
});

// PIN 입력 제한 (부서에 따라 다르게 처리)
document.getElementById('pin').addEventListener('input', function(e) {
    const email = document.getElementById('userName').value;
    const department = allUsersData[email]?.department || '';

    if (department === '기업발전그룹') {
        // 기업발전그룹: 영문숫자만 허용, 최대 6자리
        this.value = this.value.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6);
    } else {
        // 기타: 숫자만 허용, 최대 4자리
        this.value = this.value.replace(/[^\d]/g, '').substring(0, 4);
    }
});
