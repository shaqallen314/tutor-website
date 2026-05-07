// 1. 載入 Firebase 核心功能與 Firestore (資料庫)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp, getDocs, query, where, updateDoc, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// 2. 貼上你的 Firebase 金鑰
const firebaseConfig = {
    apiKey: "AIzaSyBJBM8LOAPIOOZoJJ0Z5VCYIHu0GLOgaQ0",
    authDomain: "tutor-website-442eb.firebaseapp.com",
    projectId: "tutor-website-442eb",
    storageBucket: "tutor-website-442eb.firebasestorage.app",
    messagingSenderId: "612433420675",
    appId: "1:612433420675:web:e477021e6b7e104e7e16b6"
  };

// 3A. 初始化 Firebase 與 Firestore
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

// 3B. Cloudinary 設定 (請填入你剛拿到的兩個 Name)
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/djyt6fh9g/auto/upload"; // 🌟 加上 /auto
const CLOUDINARY_UPLOAD_PRESET = "zazj8sfj";

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
// 取得老師與學生的 HTML 區塊
const adminPanel = document.getElementById('admin-panel');
const studentPanel = document.getElementById('student-panel');

// 定義你的 Admin 信箱
const ADMIN_EMAIL = "a93386@gmail.com"; 
// 🌟 新增：學生名單與專屬信箱對應表
const STUDENT_ACCOUNTS = {
    "紫軒": "a9386@gmail.com", 
    "昵貽": "a9386@gmail.com",   
    "芳銘": "@gmail.com" 
};

// 🌟 新增：記錄目前登入的學生名稱
let currentLoggedInStudent = "";

// === 修改登入狀態判斷與權限過濾 ===
onAuthStateChanged(auth, (user) => {
    if (user) {
        // 如果有人登入了，先顯示基礎介面
        loginPanel.style.display = 'none'; 
        topNav.style.display = 'flex';     
        menuBtn.style.display = 'block'; 

        // 1. 檢查是否為老師
        if (user.email === ADMIN_EMAIL) {
            isAdmin = true;
            currentLoggedInStudent = ""; // 老師不需要紀錄學生名稱
            adminPanel.style.display = 'block';
            studentPanel.style.display = 'none';
            adminStudentList.style.display = 'block';
            adminTaskPanel.style.display = 'none';
        } 
        // 2. 如果不是老師，檢查是否為名單內的學生
        else {
            let foundStudent = "";
            // 迴圈比對剛剛設定的 STUDENT_ACCOUNTS
            for (const [name, email] of Object.entries(STUDENT_ACCOUNTS)) {
                if (user.email === email) {
                    foundStudent = name;
                    break;
                }
            }

            if (foundStudent) {
                // ✅ 身分確認：是我們授權的學生！
                isAdmin = false;
                currentLoggedInStudent = foundStudent; // 記住他的名字
                adminPanel.style.display = 'none';
                studentPanel.style.display = 'block';
                
                // 貼心小彩蛋：把標題改成專屬歡迎語
                document.getElementById('section-title').innerText = `👋 歡迎回來，${currentLoggedInStudent}！`;
                document.getElementById('section-desc').innerText = "請點擊左上角選單 (☰) 選擇你要查看「講義」還是「練習題」。";
                
                // 確保進入時畫面乾淨
                document.getElementById('subject-area').style.display = 'none';
                document.getElementById('mode-area').style.display = 'none';
                document.getElementById('student-task-list').innerHTML = '';
            } else {
                // ❌ 身分拒絕：不在名單內的陌生人
                alert("⛔ 抱歉，此 Google 帳號未授權使用本系統！請使用老師指定的帳號登入。");
                signOut(auth); // 強制將其踢出登出
            }
        }
    } else {
        // 沒人登入的狀態
        isAdmin = false;
        currentLoggedInStudent = "";
        loginPanel.style.display = 'block';
        topNav.style.display = 'none';
        adminPanel.style.display = 'none';
        studentPanel.style.display = 'none';
        sidebar.classList.remove('active'); 
    }
});

// === 介面控制邏輯 ===

// (保留原本取得的 HTML 元素)
const topNav = document.getElementById('top-nav');
const menuBtn = document.getElementById('menu-btn');
const sidebar = document.getElementById('sidebar');
const loginPanel = document.getElementById('login-panel');
const sectionTitle = document.getElementById('section-title');
const sectionDesc = document.getElementById('section-desc');
const subjectArea = document.getElementById('subject-area');
const modeArea = document.getElementById('mode-area');
const selectedSubjectLabel = document.getElementById('selected-subject-label');

// 新增：老師專區的 HTML 元素
const adminStudentList = document.getElementById('admin-student-list');
const adminTaskPanel = document.getElementById('admin-task-panel');
const adminSelectedStudentTitle = document.getElementById('admin-selected-student-title');
const backToStudentsBtn = document.getElementById('back-to-students-btn');
const adminSubjectArea = document.getElementById('admin-subject-area');
const adminUploadArea = document.getElementById('admin-upload-area');
const adminUploadTitle = document.getElementById('admin-upload-title');
const uploadPdfSection = document.getElementById('upload-pdf-section');
const uploadImgSection = document.getElementById('upload-img-section');

// 狀態變數
let isAdmin = false; // 記錄是否為老師
let currentType = "";    
let currentSubject = ""; 
let selectedStudents = []; // 🌟 改為陣列，儲存所有選中的學生名字
let adminSelectedStudent = ""; // 保留此變數，僅用於單一學生歷史紀錄顯示

// 1. 漢堡選單開關邏輯
menuBtn.addEventListener('click', () => {
    sidebar.classList.toggle('active');
});


// 2. 點擊側邊欄選項 (講義 / 練習題)
document.querySelectorAll('.sidebar-item').forEach(item => {
    item.addEventListener('click', (e) => {
        currentType = e.target.getAttribute('data-type');
        
        if (isAdmin) {
            // 【老師的邏輯】
            // 🌟 修改這裡：從檢查 adminSelectedStudent 改為檢查 selectedStudents 陣列
            if (selectedStudents.length === 0) {
                alert("請先在畫面上選擇至少一位學生！");
                sidebar.classList.remove('active');
                return;
            }
            
            // 如果有選人，就顯示科目選擇區
            adminSubjectArea.style.display = 'block';
            adminUploadArea.style.display = 'none'; 
            
            // 貼心提醒：如果切換了類型（講義/練習題），歷史紀錄區也先隱藏
            adminHistoryArea.style.display = 'none';
        } else {
            // 【學生的邏輯】
            sectionTitle.innerText = currentType === "講義" ? "📖 講義區" : "✏️ 練習題區";
            sectionDesc.innerText = "請選擇科目：";
            subjectArea.style.display = 'block';
            modeArea.style.display = 'none'; 
        }
        sidebar.classList.remove('active'); // 關閉選單
    });
});

// 3A. 【學生】點擊科目
document.querySelectorAll('.subject-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        currentSubject = e.target.getAttribute('data-subject');
        selectedSubjectLabel.innerText = `【${currentSubject}】`;
        modeArea.style.display = 'block';

        // 🌟 新增：一旦切換科目，立刻清空下方的作業顯示區，並給予提示
        const studentTaskList = document.getElementById('student-task-list');
        if (studentTaskList) {
            studentTaskList.innerHTML = `<p style='text-align:center; color:#7f8c8d; background:#f8f9fa; padding:15px; border-radius:8px;'>請點擊上方的「學校進度」或「學測複習」來載入【${currentSubject}】的內容。</p>`;
        }
    });
});



// 3B. 【學生】點擊模式 (進度/複習)，向資料庫抓取教材
document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
        const currentMode = e.target.getAttribute('data-mode');
        // 💡 確保在這裡抓取元素，避免因為宣告順序導致的 null 錯誤
        const studentTaskList = document.getElementById('student-task-list');
        
        if (!studentTaskList) {
            console.error("錯誤：找不到 student-task-list 容器！請檢查 index.html。");
            return;
        }
        // 顯示載入中動畫
        studentTaskList.innerHTML = "<p style='text-align:center; color:#7f8c8d;'>🔄 努力抓取資料中...</p>";

        try {
            // 從 Firestore 查詢條件：加入 student 名稱過濾，確保不會看到別人的！
            const q = query(collection(db, "tasks"),
                where("student", "==", currentLoggedInStudent), // 🌟 關鍵新增：只抓「現在登入的這個學生」的資料
                where("subject", "==", currentSubject),
                where("type", "==", currentType),
                where("mode", "==", currentMode)
            );

            const querySnapshot = await getDocs(q);
            studentTaskList.innerHTML = ""; // 清空載入中文字

            if (querySnapshot.empty) {
                studentTaskList.innerHTML = "<p style='text-align:center; color:#7f8c8d;'>目前沒有未完成的作業喔！🎉</p>";
                return;
            }

            // 將抓到的資料一筆一筆變成漂亮的卡片
            querySnapshot.forEach((documentSnapshot) => {
                const task = documentSnapshot.data();
                const taskId = documentSnapshot.id; // 這筆資料的專屬 ID

                const taskCard = document.createElement('div');
                taskCard.className = 'card';
                taskCard.style.marginTop = '15px';
                taskCard.style.border = '1px solid #e0e0e0';

                // 如果是講義，顯示觀看與下載雙按鈕
                if (task.type === "講義") {
                    // 🌟 防呆機制：優先使用原始檔名，如果是舊資料則使用標題加.pdf
                    const downloadFileName = task.originalFileName || `${task.title}.pdf`;

                    taskCard.innerHTML = `
                        <h3 style="margin-top:0; color:#2c3e50; word-break: break-word;">📄 ${task.title}</h3>
                        <div style="display: flex; gap: 10px; margin-top: 15px;">
                            <a href="${task.fileUrl}" target="_blank" class="primary-btn" style="flex: 1; box-sizing: border-box; text-align:center; text-decoration:none; background-color:#3498db; padding: 10px;">🔍 線上觀看</a>
                            
                            <button class="primary-btn student-download-pdf-btn" data-url="${task.fileUrl}" data-filename="${downloadFileName}" style="flex: 1; background-color:#27ae60; padding: 10px;">⬇️ 儲存檔案</button>
                        </div>
                    `;
                }
                // 如果是練習題，顯示圖片與繳交區 (加入收回與批改顯示)
                else if (task.type === "練習題") {
                    const isCompleted = task.status === "已完成";
                    const hasFeedback = !!task.teacherFeedbackUrl; // 檢查老師是否已批改
                    const detailsOpenAttr = isCompleted ? "" : "open"; 

                    let innerHTML = `
                        <h3 style="margin-top:0; color:#2c3e50;">📝 ${task.title}</h3>
                        ${task.hint ? `<p style="background:#fff3cd; padding:10px; border-radius:8px; color:#856404;">💡 老師叮嚀：${task.hint}</p>` : ''}
                        
                        <details ${detailsOpenAttr} style="cursor: pointer; margin-bottom: 15px; background: #fff; padding: 10px; border-radius: 8px; border: 1px solid #e0e0e0;">
                            <summary style="font-weight: bold; color: #3498db; outline: none; user-select: none;">
                                🖼️ 點擊展開/收合題目圖片
                            </summary>
                            <div style="margin-top: 10px;">
                                <img src="${task.fileUrl}" style="width:100%; border-radius:8px; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
                            </div>
                        </details>

                        <div style="background:#f8f9fa; padding:15px; border-radius:8px;">
                    `;

                    if (isCompleted) {
                        innerHTML += `
                            <details style="cursor: pointer; margin-bottom: 15px;">
                                <summary style="color: #27ae60; font-weight: bold; outline: none; user-select: none;">
                                    ✅ 已繳交作業 (點擊展開查看解答)
                                </summary>
                                <div style="margin-top: 12px;">
                                    <img src="${task.studentReplyUrl}" style="width: 100%; border-radius: 8px; cursor: zoom-in;" onclick="window.open(this.src)">
                                </div>
                            </details>
                        `;

                        if (hasFeedback) {
                            // 老師已批改：顯示批改圖片，此時不允許學生收回
                            innerHTML += `
                                <div style="background: #f4ecf7; border-left: 4px solid #8e44ad; padding: 10px; border-radius: 4px;">
                                    <details open style="cursor: pointer;">
                                        <summary style="color: #8e44ad; font-weight: bold; outline: none; user-select: none;">
                                            👩‍🏫 老師的批改回饋 (點擊收合)
                                        </summary>
                                        <div style="margin-top: 12px;">
                                            <img src="${task.teacherFeedbackUrl}" style="width: 100%; border-radius: 8px; cursor: zoom-in;" onclick="window.open(this.src)">
                                        </div>
                                    </details>
                                </div>
                            `;
                        } else {
                            // 老師還沒批改：允許學生收回作業
                            innerHTML += `
                                <button class="student-retract-btn" data-id="${taskId}" style="background: #ecf0f1; border: 1px solid #bdc3c7; color: #7f8c8d; padding: 8px 15px; border-radius: 8px; cursor: pointer; font-weight: bold; width: 100%; transition: 0.3s;">
                                    🔄 傳錯了？點此收回作業
                                </button>
                            `;
                        }
                    } else {
                        // 未繳交狀態
                        innerHTML += `
                            <h4 style="margin-top:0;">上傳你的解答：</h4>
                            <input type="file" id="reply-file-${taskId}" accept="image/jpeg, image/png" style="margin-bottom: 10px; width: 100%;">
                            <button class="primary-btn submit-reply-btn" data-id="${taskId}" style="background-color:#27ae60;">繳交作業</button>
                        `;
                    }
                    innerHTML += `</div>`;
                    taskCard.innerHTML = innerHTML;
                }
                studentTaskList.appendChild(taskCard);
            });

            // --- 綁定學生繳交作業的按鈕事件 ---
            document.querySelectorAll('.submit-reply-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const taskId = e.target.getAttribute('data-id');
                    const fileInput = document.getElementById(`reply-file-${taskId}`);
                    const file = fileInput.files[0];

                    if (!file) {
                        alert("請先選擇你的解答照片！");
                        return;
                    }

                    try {
                        btn.innerText = "上傳中...";
                        btn.disabled = true;

                        // 1. 上傳學生的解答照片到 Cloudinary (重複利用我們先前寫好的函式！)
                        const replyUrl = await uploadFileToCloudinary(file);

                        // 2. 更新 Firestore 中該題目的狀態與網址
                        const taskRef = doc(db, "tasks", taskId);
                        await updateDoc(taskRef, {
                            status: "已完成",
                            studentReplyUrl: replyUrl,
                            replyTimestamp: serverTimestamp()
                        });

                        alert("🎉 作業繳交成功！");
                        // 將該區塊直接抽換成綠色的摺疊完成狀態
                        e.target.parentElement.innerHTML = `
                            <details style="cursor: pointer;">
                                <summary style="color: #27ae60; font-weight: bold; outline: none; user-select: none;">
                                    ✅ 作業繳交成功！ (點擊展開查看)
                                </summary>
                                <div style="margin-top: 12px;">
                                    <img src="${replyUrl}" style="width: 100%; border-radius: 8px; cursor: zoom-in; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" onclick="window.open(this.src)">
                                </div>
                            </details>
                        `;
                    } catch (error) {
                        console.error(error);
                        alert("繳交失敗，請檢查網路。");
                        btn.innerText = "繳交作業";
                        btn.disabled = false;
                    }
                });
            });

        } catch(error) {
            console.error("抓取資料失敗：", error);
            studentTaskList.innerHTML = "<p style='text-align:center; color:#e74c3c;'>載入失敗，請稍後再試。</p>";
        }
    });
});

const confirmStudentsBtn = document.getElementById('confirm-students-btn');

// 4A. 【老師】選擇學生 (改為複選邏輯)
document.querySelectorAll('.admin-student-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const studentName = e.target.getAttribute('data-student');
        
        if (selectedStudents.includes(studentName)) {
            // 如果已在名單內，則移除
            selectedStudents = selectedStudents.filter(name => name !== studentName);
            e.target.classList.remove('selected');
        } else {
            // 如果不在名單內，則加入
            selectedStudents.push(studentName);
            e.target.classList.add('selected');
        }

        // 只有選中至少一人時，才顯示確認按鈕
        confirmStudentsBtn.style.display = selectedStudents.length > 0 ? 'block' : 'none';
    });
});

// 4A-2. 點擊確認按鈕後才進入派發介面
confirmStudentsBtn.addEventListener('click', () => {
    adminStudentList.style.display = 'none';
    adminTaskPanel.style.display = 'block';
    adminSelectedStudentTitle.innerText = `🧑‍🎓 目前管理：${selectedStudents.join('、')}`;
    
    // 歷史紀錄處理：如果只選一人，則顯示歷史紀錄；若多人則暫時隱藏歷史紀錄區
    if (selectedStudents.length === 1) {
        adminSelectedStudent = selectedStudents[0];
        // 如果已經選過科目和類型，則加載歷史
        if (currentSubject && currentType) loadAdminHistory();
    } else {
        adminSelectedStudent = "";
        adminHistoryArea.style.display = 'none'; // 多人派發模式不顯示單人歷史紀錄
    }
});

// 修改返回按鈕，清空選擇
backToStudentsBtn.addEventListener('click', () => {
    selectedStudents = [];
    document.querySelectorAll('.admin-student-btn').forEach(btn => btn.classList.remove('selected'));
    confirmStudentsBtn.style.display = 'none';
    adminStudentList.style.display = 'block';
    adminTaskPanel.style.display = 'none';
});

// 4B. 【老師】返回學生列表
backToStudentsBtn.addEventListener('click', () => {
    adminSelectedStudent = "";
    adminStudentList.style.display = 'block';
    adminTaskPanel.style.display = 'none';
});

// 取得老師歷史紀錄的 HTML 元素
const adminHistoryArea = document.getElementById('admin-history-area');
const adminHistoryList = document.getElementById('admin-history-list');

// 🌟 新增：專門負責抓取並顯示老師歷史紀錄的函式
async function loadAdminHistory() {
    adminHistoryArea.style.display = 'block';
    adminHistoryList.innerHTML = "<p style='color:#7f8c8d;'>🔄 讀取過往紀錄中...</p>";

    try {
        // 向資料庫要資料：指定學生、科目、類型 (講義/練習題)
        const q = query(collection(db, "tasks"),
            where("student", "==", adminSelectedStudent),
            where("subject", "==", currentSubject),
            where("type", "==", currentType)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            adminHistoryList.innerHTML = "<p style='color:#7f8c8d;'>目前這個科目還沒有發布過任何內容喔！</p>";
            return;
        }

        // 把抓到的資料放進陣列，並在瀏覽器端依時間「由新到舊」排序
        let tasks = [];
        querySnapshot.forEach(doc => tasks.push({ id: doc.id, ...doc.data() }));
        tasks.sort((a, b) => {
            const timeA = a.timestamp ? a.timestamp.toMillis() : Date.now();
            const timeB = b.timestamp ? b.timestamp.toMillis() : Date.now();
            return timeB - timeA;
        });

        let htmlContent = "";
        
// 把每一筆資料變成卡片
        tasks.forEach(task => {
            htmlContent += `<div style="background:#f8f9fa; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; margin-bottom: 15px; position: relative;">`;
            
            // 刪除按鈕
            htmlContent += `<button class="admin-delete-task-btn" data-id="${task.id}" style="position: absolute; top: 15px; right: 15px; background: none; border: none; color: #e74c3c; cursor: pointer; font-size: 16px; font-weight: bold;">🗑️ 刪除</button>`;

            // 🌟 新增：動態產生模式標籤 (防呆：如果舊資料沒有 mode，就不顯示)
            const modeBadge = task.mode ? `<span style="background: #bdc3c7; color: #fff; padding: 3px 8px; border-radius: 12px; font-size: 12px; margin-left: 10px;">${task.mode}</span>` : "";

            if (task.type === "講義") {
                // 標題加上 modeBadge
                htmlContent += `
                    <h4 style="margin-top:0; color:#2980b9; padding-right: 40px;">📄 ${task.title} ${modeBadge}</h4>
                    <p style="font-size: 10px; color: #bdc3c7; margin-bottom: 5px;">雲端 ID: ${task.cloudinaryId || '無'}</p>
                    <a href="${task.fileUrl}" target="_blank" class="primary-btn" style="display:inline-block; text-decoration:none; background-color:#3498db; padding: 8px 15px; width:auto;">查看已發布講義</a>
                `;
            } else if (task.type === "練習題") {
                // 標題加上 modeBadge
                htmlContent += `
                    <h4 style="margin-top:0; color:#e67e22; padding-right: 40px;">📝 ${task.title} ${modeBadge}</h4>
                    <p style="font-size: 10px; color: #bdc3c7; margin-bottom: 5px;">雲端 ID: ${task.cloudinaryId || '無'}</p>
                    <a href="${task.fileUrl}" target="_blank" style="color: #3498db; text-decoration: underline; font-size: 14px;">🔍 查看原題目圖片</a>
                    <div style="margin-top: 15px;">
                `;

                
                if (task.status === "已完成") {
                    htmlContent += `
                        <div style="background: #e8f8f5; border-left: 4px solid #27ae60; padding: 10px; border-radius: 4px;">
                            <details style="cursor: pointer;">
                                <summary style="color: #27ae60; font-weight: bold; outline: none; user-select: none;">
                                    ✅ 學生已繳交作業 (點擊展開)
                                </summary>
                                <div style="margin-top: 12px;">
                                    <img src="${task.studentReplyUrl}" style="width: 100%; max-width: 300px; border-radius: 8px; cursor: zoom-in;" onclick="window.open(this.src)">
                                </div>
                            </details>
                        </div>
                    `;

                    // 🌟 老師批改區：加入收回按鈕
                    if (task.teacherFeedbackUrl) {
                        htmlContent += `
                            <div style="margin-top: 15px; background: #f4ecf7; border-left: 4px solid #8e44ad; padding: 10px; border-radius: 4px; position: relative;">
                                <details style="cursor: pointer;">
                                    <summary style="color: #8e44ad; font-weight: bold; outline: none; user-select: none;">
                                        👩‍🏫 已回傳批改 (點擊展開)
                                    </summary>
                                    <div style="margin-top: 12px;">
                                        <img src="${task.teacherFeedbackUrl}" style="width: 100%; max-width: 300px; border-radius: 8px; cursor: zoom-in;" onclick="window.open(this.src)">
                                        
                                        <button class="admin-retract-feedback-btn" data-id="${task.id}" style="margin-top: 10px; background: #fff; border: 1px solid #8e44ad; color: #8e44ad; padding: 5px 12px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: bold; width: 100%;">
                                            🔄 傳錯了？收回此批改
                                        </button>
                                    </div>
                                </details>
                            </div>
                        `;
                    } else {
                        // 老師還沒批改，顯示上傳區
                        htmlContent += `
                            <div style="margin-top: 15px; border-top: 1px dashed #ccc; padding-top: 15px;">
                                <label style="font-weight: bold; color: #8e44ad; display: block; margin-bottom: 8px;">👩‍🏫 上傳批改後的圖片：</label>
                                <input type="file" id="feedback-file-${task.id}" accept="image/jpeg, image/png" style="width: 100%; margin-bottom: 10px;">
                                <button class="primary-btn admin-submit-feedback-btn" data-id="${task.id}" style="background-color: #8e44ad; padding: 8px 15px; width: auto;">送出批改</button>
                            </div>
                        `;
                    }

                } else {
                    htmlContent += `<p style="color: #e74c3c; font-weight: bold; background: #fdf2e9; padding: 10px; border-radius: 4px; border-left: 4px solid #e74c3c;">⏳ 學生尚未繳交</p>`;
                }
                htmlContent += `</div>`;
            }
            htmlContent += `</div>`;
        });
        
        adminHistoryList.innerHTML = htmlContent;

    } catch (error) {
        console.error("讀取紀錄失敗：", error);
        adminHistoryList.innerHTML = "<p style='color:#e74c3c;'>讀取失敗，請檢查網路連線。</p>";
    }
}

// 4C. 【老師】選擇科目後，顯示對應的上傳區塊
document.querySelectorAll('.admin-subject-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        currentSubject = e.target.getAttribute('data-subject');
        
        adminUploadArea.style.display = 'block';
        adminUploadTitle.innerText = `發布【${currentSubject}】${currentType}`;
        
        // 根據側邊欄選的是講義還是練習題，決定顯示哪一種上傳欄位
        if (currentType === "講義") {
            uploadPdfSection.style.display = 'block';
            uploadImgSection.style.display = 'none';
        } else {
            uploadPdfSection.style.display = 'none';
            uploadImgSection.style.display = 'block';
        }
        // 🌟 新增這行：點擊科目後，立刻去抓取歷史紀錄
        loadAdminHistory();
    });
});

// === 修改登入狀態判斷 ===
onAuthStateChanged(auth, (user) => {
    if (user) {
        loginPanel.style.display = 'none'; 
        topNav.style.display = 'flex';     
        menuBtn.style.display = 'block'; // 現在老師和學生都需要看到選單了！

        if (user.email === ADMIN_EMAIL) {
            isAdmin = true; // 設定身分標籤
            adminPanel.style.display = 'block';
            studentPanel.style.display = 'none';
            // 每次老師登入，預設顯示學生列表
            adminStudentList.style.display = 'block';
            adminTaskPanel.style.display = 'none';
        } else {
            isAdmin = false;
            adminPanel.style.display = 'none';
            studentPanel.style.display = 'block';
        }
    } else {
        isAdmin = false;
        loginPanel.style.display = 'block';
        topNav.style.display = 'none';
        adminPanel.style.display = 'none';
        studentPanel.style.display = 'none';
        sidebar.classList.remove('active'); 
    }
});


// ==========================================
// 老師上傳檔案邏輯 (Cloudinary + Firestore)
// ==========================================

// 1. 取得上傳相關的按鈕與輸入框 (這幾行就是你剛才遺失的靈魂，非常重要！)
const publishPdfBtn = document.querySelector('#upload-pdf-section .primary-btn');
const publishImgBtn = document.querySelector('#upload-img-section .primary-btn');
const handoutTitleInput = document.getElementById('handout-title');
const handoutFileInput = document.getElementById('handout-file');
const exerciseTitleInput = document.getElementById('exercise-title');
const exerciseFileInput = document.getElementById('exercise-file');
const exerciseHintInput = document.querySelector('#upload-img-section textarea');
const adminModeSelect = document.getElementById('admin-mode-select');

// 2. 通用 Cloudinary 上傳函式 ===
async function uploadFileToCloudinary(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    // 💡 移除原本手動加入的 use_filename 和 unique_filename 
    // 因為你在後台 Preset 已經設定過了，這裡重複加入反而會觸發 400 錯誤

    const response = await fetch(CLOUDINARY_URL, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        // 如果失敗，嘗試抓取更詳細的錯誤訊息
        const errorData = await response.json();
        console.error("Cloudinary 錯誤詳情：", errorData);
        throw new Error('Cloudinary 上傳失敗');
    }
    
    const data = await response.json();
    return { url: data.secure_url, publicId: data.public_id };
}

// 3. 發布講義 (PDF) 點擊事件
publishPdfBtn.addEventListener('click', async () => {
    const title = handoutTitleInput.value;
    const file = handoutFileInput.files[0];

    if (!title || !file) {
        alert("請完整輸入講義標題並選擇 PDF 檔案！");
        return;
    }

    try {
        publishPdfBtn.innerText = "上傳中...";
        publishPdfBtn.disabled = true;

        // 1. 上傳至 Cloudinary (只需上傳一次)
        const uploadResult = await uploadFileToCloudinary(file);

        // 2. 🌟 使用迴圈，為每一位選中的學生建立資料
        const promises = selectedStudents.map(student => {
            return addDoc(collection(db, "tasks"), {
                student: student,
                subject: currentSubject,
                type: "講義",
                mode: adminModeSelect.value,
                title: title,
                originalFileName: file.name,
                fileUrl: uploadResult.url,
                cloudinaryId: uploadResult.publicId,
                timestamp: serverTimestamp()
            });
        });
        await Promise.all(promises);

        alert(`🎉 講義已成功發布給：${selectedStudents.join('、')}！`);


        handoutTitleInput.value = "";
        handoutFileInput.value = "";
        // 🌟 新增這行：上傳成功後，自動重新載入下方紀錄，讓老師立刻看到剛傳好的檔案
        loadAdminHistory();
    } catch (error) {
        console.error(error);
        alert("發布失敗，請檢查控制台。");
    } finally {
        publishPdfBtn.innerText = "發布講義 (PDF)";
        publishPdfBtn.disabled = false;
    }
});

// 4. 發布題目 (圖片) 點擊事件
publishImgBtn.addEventListener('click', async () => {
    const title = exerciseTitleInput.value;
    const file = exerciseFileInput.files[0];
    const hint = exerciseHintInput.value;

    if (!title || !file) {
        alert("請完整輸入題目名稱並選擇圖片！");
        return;
    }

    try {
        publishImgBtn.innerText = "上傳中...";
        publishImgBtn.disabled = true;

        // 1. 上傳至 Cloudinary
        const uploadResult = await uploadFileToCloudinary(file);

        // 2. 🌟 使用迴圈發布給選中的學生
        const promises = selectedStudents.map(student => {
            return addDoc(collection(db, "tasks"), {
                student: student,
                subject: currentSubject,
                type: "練習題",
                mode: adminModeSelect.value,
                title: title,
                hint: hint,
                fileUrl: uploadResult.url,
                cloudinaryId: uploadResult.publicId,
                status: "未完成",
                studentReplyUrl: "",
                timestamp: serverTimestamp()
            });
        });
        await Promise.all(promises);

        alert(`🎉 題目已成功發布給：${selectedStudents.join('、')}！`);
        exerciseTitleInput.value = "";
        exerciseFileInput.value = "";
        exerciseHintInput.value = "";
        // 🌟 新增這行：自動刷新紀錄
        loadAdminHistory();
    } catch (error) {
        console.error(error);
        alert("發布失敗，請檢查控制台。");
    } finally {
        publishImgBtn.innerText = "發布題目 (圖片)";
        publishImgBtn.disabled = false;
    }
});


// ==========================================
// 全域事件監聽 (負責處理所有動態生成的按鈕)
// ==========================================
document.body.addEventListener('click', async (e) => {
    
    // 1. 【老師】刪除任務
    if (e.target.classList.contains('admin-delete-task-btn')) {
        if (!confirm("確定要刪除這筆資料嗎？刪除後無法恢復喔！")) return;
        const taskId = e.target.getAttribute('data-id');
        try {
            e.target.innerText = "刪除中...";
            await deleteDoc(doc(db, "tasks", taskId));
            alert("🗑️ 刪除成功！");
            loadAdminHistory(); // 重新整理老師畫面
        } catch (error) {
            console.error(error);
            alert("刪除失敗");
        }
    }

    // 2. 【老師】上傳批改圖片
    if (e.target.classList.contains('admin-submit-feedback-btn')) {
        const taskId = e.target.getAttribute('data-id');
        const fileInput = document.getElementById(`feedback-file-${taskId}`);
        const file = fileInput.files[0];
        
        if (!file) {
            alert("請先選擇批改後的圖片！");
            return;
        }
        try {
            e.target.innerText = "上傳中...";
            e.target.disabled = true;
            const feedbackUrl = await uploadFileToCloudinary(file);
            await updateDoc(doc(db, "tasks", taskId), {
                teacherFeedbackUrl: feedbackUrl
            });
            alert("👩‍🏫 批改送出成功！");
            loadAdminHistory(); // 重新整理老師畫面
        } catch (error) {
            console.error(error);
            alert("上傳失敗");
            e.target.innerText = "送出批改";
            e.target.disabled = false;
        }
    }

    // 3. 【學生】收回作業
    if (e.target.classList.contains('student-retract-btn')) {
        if (!confirm("確定要收回作業嗎？收回後需重新上傳照片。")) return;
        const taskId = e.target.getAttribute('data-id');
        try {
            e.target.innerText = "收回中...";
            await updateDoc(doc(db, "tasks", taskId), {
                status: "未完成",
                studentReplyUrl: "",
                replyTimestamp: null
            });
            alert("🔄 作業已收回！");
            // 觸發畫面上「進度/複習」按鈕的點擊，重新整理學生畫面
            document.querySelector(`.mode-btn[data-mode="${currentType === '講義' ? '進度' : '複習'}"]`).click(); // 備用防呆
            // 由於上面那行可能因為模式不同抓錯，我們最安全的做法是讓學生自己再點一次左邊選單
            document.getElementById('student-task-list').innerHTML = "<p style='text-align:center; color:#27ae60;'>已成功收回，請重新點擊上方模式按鈕載入題目。</p>";
        } catch (error) {
            console.error(error);
            alert("收回失敗");
        }
    }
    // 4. 【老師】收回批改圖片
    if (e.target.classList.contains('admin-retract-feedback-btn')) {
        if (!confirm("確定要收回這份批改嗎？")) return;
        const taskId = e.target.getAttribute('data-id');
        try {
            e.target.innerText = "收回中...";
            // 將資料庫中的批改網址清空
            await updateDoc(doc(db, "tasks", taskId), {
                teacherFeedbackUrl: ""
            });
            alert("🔄 批改已收回，現在可以重新上傳囉！");
            loadAdminHistory(); // 重新整理老師畫面，會變回上傳框
        } catch (error) {
            console.error(error);
            alert("收回失敗");
        }
    }
    // 5. 【學生】強制下載 PDF 並完美保留原始檔名
    if (e.target.classList.contains('student-download-pdf-btn')) {
        const fileUrl = e.target.getAttribute('data-url');
        const fileName = e.target.getAttribute('data-filename'); // 🌟 改為抓取完整的原始檔名
        const originalText = e.target.innerText;

        try {
            e.target.innerText = "⏳ 下載打包中...";
            e.target.disabled = true;

            const response = await fetch(fileUrl);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = fileName; // 🌟 這裡直接套用最原始的檔名
            document.body.appendChild(a);
            a.click(); 
            
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);

            e.target.innerText = "✅ 下載完成";
            setTimeout(() => {
                e.target.innerText = originalText;
                e.target.disabled = false;
            }, 2000);

        } catch (error) {
            console.error("下載失敗：", error);
            alert("下載失敗，請檢查網路連線，或改用左側的「線上觀看」按鈕。");
            e.target.innerText = originalText;
            e.target.disabled = false;
        }
    }
});