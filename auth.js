// 인증 체크 함수
function checkAuth() {
    const savedUser = localStorage.getItem('userData');

    if (!savedUser) {
        // 로그인 정보가 없으면 로그인 페이지로 리다이렉트
        window.location.href = 'login.html';
        return null;
    }

    const userData = JSON.parse(savedUser);
    return userData;
}

// 로그아웃 함수
function logout() {
    localStorage.removeItem('userData');
    window.location.href = 'login.html';
}

// 사용자 정보 가져오기
function getUserInfo() {
    const savedUser = localStorage.getItem('userData');
    if (savedUser) {
        return JSON.parse(savedUser);
    }
    return null;
}

// 페이지 로드 시 인증 체크
const currentUser = checkAuth();
