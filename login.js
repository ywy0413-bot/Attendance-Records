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
        const response = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, pin })
        });

        const result = await response.json();

        if (response.ok) {
            // 로그인 성공 - 사용자 정보 저장
            const userData = {
                email: email,
                rememberMe: rememberMe,
                loginTime: new Date().toISOString()
            };

            localStorage.setItem('userData', JSON.stringify(userData));

            messageDiv.className = 'message success';
            messageDiv.textContent = '로그인 성공! 메인 페이지로 이동합니다...';

            // 1초 후 메인 페이지로 이동
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            throw new Error(result.message || '로그인 실패');
        }
    } catch (error) {
        messageDiv.className = 'message error';
        messageDiv.textContent = '로그인 오류: ' + error.message;
    }
});

// PIN 입력 시 숫자만 입력되도록
document.getElementById('pin').addEventListener('input', function(e) {
    this.value = this.value.replace(/[^\d]/g, '');
});
