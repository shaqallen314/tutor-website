// 1. 從 Firebase 雲端載入核心功能與身分驗證模組
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// 2. 貼上你的 Firebase 金鑰 (請將以下內容替換成你自己的)
  const firebaseConfig = {
    apiKey: "AIzaSyBJBM8LOAPIOOZoJJ0Z5VCYIHu0GLOgaQ0",
    authDomain: "tutor-website-442eb.firebaseapp.com",
    projectId: "tutor-website-442eb",
    storageBucket: "tutor-website-442eb.firebasestorage.app",
    messagingSenderId: "612433420675",
    appId: "1:612433420675:web:e477021e6b7e104e7e16b6"
  };

// 3. 初始化 Firebase 與設定 Google 登入提供者
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// 4. 取得 HTML 中的按鈕與文字元素
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userStatus = document.getElementById('user-status');

// 5. 設定「登入按鈕」的點擊事件 (彈出 Google 登入視窗)
loginBtn.addEventListener('click', () => {
    signInWithPopup(auth, provider)
        .catch((error) => {
            console.error("登入失敗：", error);
        });
});

// 6. 設定「登出按鈕」的點擊事件
logoutBtn.addEventListener('click', () => {
    signOut(auth)
        .catch((error) => {
            console.error("登出失敗：", error);
        });
});

// 7. 監聽使用者的登入狀態變化 (最神奇的地方)
onAuthStateChanged(auth, (user) => {
    if (user) {
        // 如果使用者已登入：顯示名字、隱藏登入按鈕、顯示登出按鈕
        userStatus.innerHTML = `歡迎回來，<strong>${user.displayName}</strong> 同學！`;
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'block';
    } else {
        // 如果使用者未登入：顯示預設文字、顯示登入按鈕、隱藏登出按鈕
        userStatus.innerHTML = '請登入以查看專屬進度與測驗';
        loginBtn.style.display = 'block';
        logoutBtn.style.display = 'none';
    }
});