// Firebase 버전의 로그인 로직
// 페이지 로드 시 자동 로그인 체크
window.addEventListener('DOMContentLoaded', () => {
    const savedUser = localStorage.getItem('userData');
    if (savedUser) {
        const userData = JSON.parse(savedUser);
        if (userData.rememberMe) {
            // 자동 로그인 - 메인 페이지로 이동
            window.location.href = 'index.html';
        }
    }
});

// 로그인 폼 제출
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const messageDiv = document.getElementById('message');
    const email = document.getElementById('email').value;
    const pin = document.getElementById('pin').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    // PIN 유효성 검사
    if (!/^\d{4}$/.test(pin)) {
        messageDiv.className = 'message error';
        messageDiv.textContent = 'PIN은 4자리 숫자여야 합니다.';
        return;
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
                    window.location.href = 'index.html';
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

// PIN 입력 시 숫자만 입력되도록
document.getElementById('pin').addEventListener('input', function(e) {
    this.value = this.value.replace(/[^\d]/g, '');
});
