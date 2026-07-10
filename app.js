// ==========================================
// 1. 載入 Firebase 核心功能與資料庫
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp, getDocs, query, where, updateDoc, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// ==========================================
// 2. 系統設定參數 (Firebase & Cloudinary)
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyBJBM8LOAPIOOZoJJ0Z5VCYIHu0GLOgaQ0",
    authDomain: "tutor-website-442eb.firebaseapp.com",
    projectId: "tutor-website-442eb",
    storageBucket: "tutor-website-442eb.firebasestorage.app",
    messagingSenderId: "612433420675",
    appId: "1:612433420675:web:e477021e6b7e104e7e16b6"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/djyt6fh9g/auto/upload";
const CLOUDINARY_UPLOAD_PRESET = "zazj8sfj";


// ==========================================
// 3. 全域狀態變數與 HTML 元素抓取
// ==========================================
let isAdmin = false; 
let currentType = "";    
let currentSubject = ""; 
let selectedStudents = []; 
let adminSelectedStudent = ""; 
let currentLoggedInStudent = "";

// 登入與導航元素
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const topNav = document.getElementById('top-nav');
const menuBtn = document.getElementById('menu-btn');
const sidebar = document.getElementById('sidebar');
const loginPanel = document.getElementById('login-panel');

// 老師區元素
const adminPanel = document.getElementById('admin-panel');
const adminStudentList = document.getElementById('admin-student-list');
const confirmStudentsBtn = document.getElementById('confirm-students-btn');
const adminTaskPanel = document.getElementById('admin-task-panel');
const adminSelectedStudentTitle = document.getElementById('admin-selected-student-title');
const backToStudentsBtn = document.getElementById('back-to-students-btn');
const adminSubjectArea = document.getElementById('admin-subject-area');
const adminUploadArea = document.getElementById('admin-upload-area');
const adminUploadTitle = document.getElementById('admin-upload-title');
const adminModeSelect = document.getElementById('admin-mode-select');
const uploadPdfSection = document.getElementById('upload-pdf-section');
const uploadImgSection = document.getElementById('upload-img-section');
const handoutTitleInput = document.getElementById('handout-title');
const handoutFileInput = document.getElementById('handout-file');
const exerciseTitleInput = document.getElementById('exercise-title');
const exerciseFileInput = document.getElementById('exercise-file');
const exerciseHintInput = document.querySelector('#upload-img-section textarea');
const publishPdfBtn = document.querySelector('#upload-pdf-section .primary-btn');
const publishImgBtn = document.querySelector('#upload-img-section .primary-btn');
const adminHistoryArea = document.getElementById('admin-history-area');
const adminHistoryList = document.getElementById('admin-history-list');

// 學生區元素
const studentPanel = document.getElementById('student-panel');
const sectionTitle = document.getElementById('section-title');
const sectionDesc = document.getElementById('section-desc');
const subjectArea = document.getElementById('subject-area');
const modeArea = document.getElementById('mode-area');
const selectedSubjectLabel = document.getElementById('selected-subject-label');
const studentTaskList = document.getElementById('student-task-list');

// ==========================================
// 4. 登入、登出與身分驗證邏輯 (家教網 2.0 雲端版)
// ==========================================
loginBtn.addEventListener('click', () => {
    signInWithPopup(auth, provider).catch(error => console.error("登入失敗：", error));
});

logoutBtn.addEventListener('click', () => {
    signOut(auth).catch(error => console.error("登出失敗：", error));
});

// 🌟 注意這裡的 callback 函式加上了 async，因為我們要等待資料庫回應
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // 先顯示基礎框架，讓使用者知道正在載入
        loginPanel.style.display = 'none'; 
        topNav.style.display = 'flex';     
        menuBtn.style.display = 'block'; 

        try {
            // 🔍 向 Firestore 查詢這個信箱有沒有在 VIP 名單 (users 集合) 裡
            const q = query(collection(db, "users"), where("email", "==", user.email));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                // ❌ 找不到資料：不在名單內的陌生人
                alert("⛔ 抱歉，此 Google 帳號未授權使用本系統！請使用老師指定的帳號登入。");
                signOut(auth); // 強制登出
                return; // 提早結束函式
            }

            // ✅ 找到資料了！把這名使用者的身分 (role) 與姓名 (name) 取出來
            const userData = querySnapshot.docs[0].data();

            if (userData.role === "admin") {
                // 👑 老師身分
                isAdmin = true;
                currentLoggedInStudent = ""; 
                adminPanel.style.display = 'block';
                studentPanel.style.display = 'none';
                adminStudentList.style.display = 'block';
                adminTaskPanel.style.display = 'none';
            } else if (userData.role === "student") {
                // 🧑‍🎓 學生身分
                isAdmin = false;
                currentLoggedInStudent = userData.name; // 從資料庫動態抓出他的名字
                adminPanel.style.display = 'none';
                studentPanel.style.display = 'block';
                
                sectionTitle.innerText = `👋 歡迎回來，${currentLoggedInStudent}！`;
                sectionDesc.innerText = "請點擊左上角選單 (☰) 選擇你要查看「講義」還是「練習題」。";
                
                subjectArea.style.display = 'none';
                modeArea.style.display = 'none';
                studentTaskList.innerHTML = '';
                if(document.getElementById('search-area')) document.getElementById('search-area').style.display = 'none';
                if(document.getElementById('student-dashboard')) document.getElementById('student-dashboard').style.display = 'block';
                if(typeof loadStudentDashboard === "function") loadStudentDashboard();
            }

        } catch (error) {
            console.error("驗證身分時發生錯誤：", error);
            alert("伺服器連線異常，請稍後再試。");
            signOut(auth); // 若資料庫出錯為求安全先登出
        }

    } else {
        // 未登入狀態
        isAdmin = false;
        currentLoggedInStudent = "";
        loginPanel.style.display = 'block';
        topNav.style.display = 'none';
        adminPanel.style.display = 'none';
        studentPanel.style.display = 'none';
        sidebar.classList.remove('active'); 
    }
});

// ==========================================
// 5. 通用 UI 互動邏輯 (側邊欄)
// ==========================================
menuBtn.addEventListener('click', () => {
    sidebar.classList.toggle('active');
});

document.querySelectorAll('.sidebar-item').forEach(item => {
    item.addEventListener('click', (e) => {
        currentType = e.target.getAttribute('data-type');
        
        if (isAdmin) {
            if (selectedStudents.length === 0) {
                alert("請先在畫面上選擇至少一位學生！");
                sidebar.classList.remove('active');
                return;
            }
            adminSubjectArea.style.display = 'block';
            adminUploadArea.style.display = 'none'; 
            adminHistoryArea.style.display = 'none';
        } else {
            sectionTitle.innerText = currentType === "講義" ? "📖 講義區" : "✏️ 練習題區";
            sectionDesc.innerText = "請選擇科目：";
            subjectArea.style.display = 'block';
            modeArea.style.display = 'none'; 
            document.querySelectorAll('.subject-btn, .mode-btn').forEach(btn => btn.classList.remove('selected'));
            if(document.getElementById('student-dashboard')) document.getElementById('student-dashboard').style.display = 'none';
            if(document.getElementById('search-area')) document.getElementById('search-area').style.display = 'none';
            if(document.getElementById('student-task-list')) document.getElementById('student-task-list').innerHTML = '';
        }
        sidebar.classList.remove('active'); 
    });
});

// ==========================================
// 6. 老師端專屬功能
// ==========================================

// 6-1. 選擇學生 (多選)
document.querySelectorAll('.admin-student-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const studentName = e.target.getAttribute('data-student');
        if (selectedStudents.includes(studentName)) {
            selectedStudents = selectedStudents.filter(name => name !== studentName);
            e.target.classList.remove('selected');
        } else {
            selectedStudents.push(studentName);
            e.target.classList.add('selected');
        }
        confirmStudentsBtn.style.display = selectedStudents.length > 0 ? 'block' : 'none';
    });
});

// 6-2. 確認選擇學生
confirmStudentsBtn.addEventListener('click', () => {
    adminStudentList.style.display = 'none';
    adminTaskPanel.style.display = 'block';
    adminSelectedStudentTitle.innerText = `🧑‍🎓 目前管理：${selectedStudents.join('、')}`;
    
    if (selectedStudents.length === 1) {
        adminSelectedStudent = selectedStudents[0];
        if (currentSubject && currentType) loadAdminHistory();
    } else {
        adminSelectedStudent = "";
        adminHistoryArea.style.display = 'none'; 
    }
});

// 6-3. 返回學生列表
backToStudentsBtn.addEventListener('click', () => {
    selectedStudents = [];
    adminSelectedStudent = "";
    document.querySelectorAll('.admin-student-btn').forEach(btn => btn.classList.remove('selected'));
    confirmStudentsBtn.style.display = 'none';
    adminStudentList.style.display = 'block';
    adminTaskPanel.style.display = 'none';
});

// 6-4. 選擇科目
document.querySelectorAll('.admin-subject-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        currentSubject = e.target.getAttribute('data-subject');
        adminUploadArea.style.display = 'block';
        adminUploadTitle.innerText = `發布【${currentSubject}】${currentType}`;
        
        if (currentType === "講義") {
            uploadPdfSection.style.display = 'block';
            uploadImgSection.style.display = 'none';
        } else {
            uploadPdfSection.style.display = 'none';
            uploadImgSection.style.display = 'block';
        }
        loadAdminHistory();
    });
});

// 6-5. 通用 Cloudinary 上傳函式
async function uploadFileToCloudinary(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(CLOUDINARY_URL, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error("Cloudinary 錯誤詳情：", errorData);
        throw new Error('Cloudinary 上傳失敗');
    }
    
    const data = await response.json();
    let finalUrl = data.secure_url;
    finalUrl = finalUrl.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg');

    return { url: finalUrl, publicId: data.public_id };
}
// 【新增武器 A】使用 Promise.all 讓多張圖片「同時」平行上傳，節省時間
async function uploadMultipleFilesToCloudinary(files) {
    const uploadPromises = Array.from(files).map(file => uploadFileToCloudinary(file));
    return await Promise.all(uploadPromises); // 回傳的是一個包含所有物件的陣列
}

// 【升級版武器 B】專門用來生成「水平卡片展廳」的小工具，自動辨識圖片與 PDF
function generateGalleryHTML(urlData, badgeColor = "#3498db") {
    let urls = [];
    if (Array.isArray(urlData)) {
        urls = urlData;
    } else if (typeof urlData === "string" && urlData !== "") {
        urls = [urlData];
    }

    if (urls.length === 0) return "";

    let html = `<div class="image-gallery">`;
    urls.forEach((url, index) => {
        // 🌟 核心魔法：判斷網址是否為 PDF (忽略大小寫與網址參數)
        const isPdf = url.toLowerCase().split('?')[0].endsWith('.pdf');

        html += `
            <div class="image-card" style="display: flex; flex-direction: column; justify-content: center; align-items: center; background: #fdfdfd;">
                <div class="image-badge" style="background-color: ${badgeColor}; z-index: 10;">${index + 1}</div>
                ${isPdf 
                    ? `<a href="${url}" target="_blank" style="text-decoration: none; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%; min-height: 120px; color: ${badgeColor};">
                           <span style="font-size: 40px; margin-bottom: 8px;">📄</span>
                           <span style="font-weight: bold; font-size: 14px;">點擊查看 PDF</span>
                       </a>`
                    : `<img src="${url}" onclick="window.open(this.src)" style="cursor: pointer; object-fit: cover; width: 100%; height: 100%;">`
                }
            </div>
        `;
    });
    html += `</div>`;
    return html;
}

// 6-6. 發布講義 (PDF)
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

        const uploadResult = await uploadFileToCloudinary(file);

        await addDoc(collection(db, "tasks"), {
                students: selectedStudents,
                subject: currentSubject,
                type: "講義",
                mode: adminModeSelect.value,
                title: title,
                originalFileName: file.name,
                fileUrl: uploadResult.url,
                cloudinaryId: uploadResult.publicId,
                timestamp: serverTimestamp()
            });
        

        alert(`🎉 講義已成功發布給：${selectedStudents.join('、')}！`);
        
        handoutTitleInput.value = "";
        handoutFileInput.value = "";
        loadAdminHistory();
    } catch (error) {
        console.error(error);
        alert("發布失敗，請檢查控制台。");
    } finally {
        publishPdfBtn.innerText = "發布講義 (PDF)";
        publishPdfBtn.disabled = false;
    }
});

// ==========================================
// 6-7. 發布題目 (圖片) - 2.5 陣列共享完整升級版
// ==========================================
publishImgBtn.addEventListener('click', async () => {
    const title = exerciseTitleInput.value;
    const files = exerciseFileInput.files; 
    const hint = exerciseHintInput.value;

    // 💡 防呆機制：確保有輸入標題、有選圖片、且「至少勾選了一位學生」
    // selectedStudents 是你原本在前端用來收集勾選名字的陣列 (例如: ["紫軒", "昵貽"])
    if (!title || files.length === 0 || selectedStudents.length === 0) {
        alert("請完整輸入題目名稱、選擇學生並至少上傳一張圖片！");
        return;
    }

    try {
        publishImgBtn.innerText = "上傳中...";
        publishImgBtn.disabled = true;

        // 呼叫我們先前寫好的多圖上傳函式
        const uploadResults = await uploadMultipleFilesToCloudinary(files);
        const fileUrls = uploadResults.map(res => res.url);
        const cloudinaryIds = uploadResults.map(res => res.publicId);

        // 🌟 2.5版核心改動：不再需要用迴圈重複建立多份文件！
        // 我們直接呼叫一次 addDoc，建立「單一筆」文件
        await addDoc(collection(db, "tasks"), {
            students: selectedStudents,     // 🌟 直接把前端的學生名字陣列存進去！
            subject: currentSubject,
            type: "練習題",
            mode: adminModeSelect.value,
            title: title,
            hint: hint,
            fileUrls: fileUrls,             
            cloudinaryIds: cloudinaryIds,   
            status: "未完成",
            studentReplyUrls: [],           // 預留空陣列給學生多圖繳交
            teacherFeedbackUrls: [],        // 預留空陣列給老師多圖批改
            timestamp: serverTimestamp()
        });

        alert(`🎉 題目已成功發布！勾選的學生們將能同時共享此資料。`);
        
        // 清空輸入欄位
        exerciseTitleInput.value = "";
        exerciseFileInput.value = "";
        exerciseHintInput.value = "";
        
        // 💡 記得在這裡加上你原本用來把前端 Checkbox 勾選狀態清空、以及重設 selectedStudents = [] 的程式碼
        
        loadAdminHistory(); // 重新整理老師後台歷史紀錄
    } catch (error) {
        console.error(error);
        alert("發布失敗，請檢查控制台。");
    } finally {
        publishImgBtn.innerText = "發布題目 (圖片)";
        publishImgBtn.disabled = false;
    }
});

// 6-8. 載入老師歷史紀錄
async function loadAdminHistory() {
    if (!adminSelectedStudent) return; // 防呆：多選時不顯示歷史
    
    adminHistoryArea.style.display = 'block';
    adminHistoryList.innerHTML = "<p style='color:#7f8c8d;'>🔄 讀取過往紀錄中...</p>";

    try {
        const q = query(collection(db, "tasks"),
            where("students", "array-contains", adminSelectedStudent),
            where("subject", "==", currentSubject),
            where("type", "==", currentType)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            adminHistoryList.innerHTML = "<p style='color:#7f8c8d;'>目前這個科目還沒有發布過任何內容喔！</p>";
            return;
        }

        let tasks = [];
        querySnapshot.forEach(doc => tasks.push({ id: doc.id, ...doc.data() }));
        tasks.sort((a, b) => {
            const timeA = a.timestamp ? a.timestamp.toMillis() : Date.now();
            const timeB = b.timestamp ? b.timestamp.toMillis() : Date.now();
            return timeB - timeA;
        });

        let htmlContent = "";
        
        tasks.forEach(task => {
            const modeBadge = task.mode ? `<span style="background: #bdc3c7; color: #fff; padding: 3px 8px; border-radius: 12px; font-size: 12px; margin-left: 10px;">${task.mode}</span>` : "";
            const studentsDisplay = task.students ? task.students.join('、') : (task.student || '未指定');

            // 🌟 改變 1：將整張卡片改為 details 摺疊結構
            htmlContent += `
                <div style="margin-bottom: 15px;">
                    <details style="background: #f8f9fa; border: 1px solid #e0e0e0; border-radius: 8px; cursor: pointer; transition: all 0.3s ease; overflow: hidden;">
                        
                        <summary style="padding: 15px; outline: none; user-select: none; border-bottom: 1px solid transparent; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 10px;">
                            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                                <span style="font-size: 15px; font-weight: bold; color: ${task.type === '講義' ? '#2c3e50' : '#e67e22'};">
                                    ${task.type === '講義' ? '📄' : '📝'} ${task.title}
                                </span>
                                ${modeBadge}
                            </div>
                            <span style="font-size: 13px; color: #34495e; font-weight: bold; background: #eef2f5; padding: 4px 10px; border-radius: 20px;">
                                🧑‍🎓 ${studentsDisplay}
                            </span>
                        </summary>
                        
                        <div style="padding: 0 15px 15px 15px; border-top: 1px dashed #ccc; cursor: auto;">
                            
                            <div style="display: flex; justify-content: flex-end; margin-bottom: 10px;">
                                <button class="admin-delete-task-btn" data-id="${task.id}" style="background: #fdf2e9; border: 1px solid #fadbd8; color: #e74c3c; cursor: pointer; font-size: 12px; font-weight: bold; padding: 5px 10px; border-radius: 6px;">🗑️ 刪除此筆紀錄</button>
                            </div>
            `;

            if (task.type === "講義") {
                htmlContent += `
                    <p style="font-size: 10px; color: #bdc3c7; margin-bottom: 5px;">雲端 ID: ${task.cloudinaryId || '無'}</p>
                    <a href="${task.fileUrl}" target="_blank" class="primary-btn" style="display:inline-block; text-decoration:none; background-color:#3498db; padding: 8px 15px; width:auto;">🔍 查看已發布講義</a>
                `;
            } else if (task.type === "練習題") {
                const cloudIdsDisplay = task.cloudinaryIds ? task.cloudinaryIds.join(', ') : (task.cloudinaryId || '無');
                htmlContent += `
                    <p style="font-size: 10px; color: #bdc3c7; margin-bottom: 5px; word-break: break-all;">雲端 IDs: ${cloudIdsDisplay}</p>
                    <div style="margin-bottom: 10px;">
                        <span style="color: #e67e22; font-weight: bold;">🔍 原題目圖片：</span>
                        ${generateGalleryHTML(task.fileUrls || task.fileUrl, '#e67e22')}
                    </div>
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
                                    ${generateGalleryHTML(task.studentReplyUrls || task.studentReplyUrl, '#27ae60')}
                                </div>
                            </details>
                        </div>
                    `;

                    const hasFeedback = task.teacherFeedbackUrls?.length > 0 || !!task.teacherFeedbackUrl;

                    if (hasFeedback) {
                        htmlContent += `
                            <div style="margin-top: 15px; background: #f4ecf7; border-left: 4px solid #8e44ad; padding: 10px; border-radius: 4px; position: relative;">
                                <details style="cursor: pointer;">
                                    <summary style="color: #8e44ad; font-weight: bold; outline: none; user-select: none;">
                                        👩‍🏫 已回傳批改 (點擊展開)
                                    </summary>
                                    <div style="margin-top: 12px;">
                                        ${generateGalleryHTML(task.teacherFeedbackUrls || task.teacherFeedbackUrl, '#8e44ad')}
                                        <button class="admin-retract-feedback-btn" data-id="${task.id}" style="margin-top: 10px; background: #fff; border: 1px solid #8e44ad; color: #8e44ad; padding: 5px 12px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: bold; width: 100%;">
                                            🔄 傳錯了？收回此批改
                                        </button>
                                    </div>
                                </details>
                            </div>
                        `;
                    } else {
                        htmlContent += `
                            <div style="margin-top: 15px; border-top: 1px dashed #ccc; padding-top: 15px;">
                                <label style="font-weight: bold; color: #8e44ad; display: block; margin-bottom: 8px;">👩‍🏫 上傳批改後的圖片 (可多選)：</label>
                                <input type="file" id="feedback-file-${task.id}" accept="application/pdf, .pdf, image/jpeg, image/png, image/heic, image/heif, .heic, .heif" multiple style="width: 100%; margin-bottom: 10px;">
                                <button class="primary-btn admin-submit-feedback-btn" data-id="${task.id}" style="background-color: #8e44ad; padding: 8px 15px; width: auto;">送出多張批改</button>
                            </div>
                        `;
                    }
                } else {
                    htmlContent += `<p style="color: #e74c3c; font-weight: bold; background: #fdf2e9; padding: 10px; border-radius: 4px; border-left: 4px solid #e74c3c;">⏳ 學生尚未繳交</p>`;
                }
                htmlContent += `</div>`; // 結束練習題狀態區塊
            }
            htmlContent += `</div></details></div>`; // 結束主要內容區與 details 標籤
        });
        
        adminHistoryList.innerHTML = htmlContent;

    } catch (error) {
        console.error("讀取紀錄失敗：", error);
        adminHistoryList.innerHTML = "<p style='color:#e74c3c;'>讀取失敗，請檢查網路連線。</p>";
    }
}

// ==========================================
// 7. 學生端專屬功能
// ==========================================

// 🌟 7-0. 載入學生待辦儀表板
async function loadStudentDashboard() {
    const dashboardContent = document.getElementById('student-dashboard-content');
    if (!dashboardContent) return;

    dashboardContent.innerHTML = "<p style='color: #7f8c8d; font-size: 13px; margin: 0;'>🔄 正在掃描你的未完成作業...</p>";

    try {
        const q = query(collection(db, "tasks"), 
            where("students", "array-contains", currentLoggedInStudent),
            where("type", "==", "練習題"), 
            where("status", "==", "未完成")
        );
        
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            dashboardContent.innerHTML = "<p style='color: #27ae60; font-weight: bold; margin: 0;'>🎉 太棒了！你目前沒有任何積欠的作業！</p>";
            return;
        }

        // 🌟 1. 先把所有抓到的作業裝進一個陣列裡
        let pendingTasks = [];
        snapshot.forEach(doc => {
            pendingTasks.push(doc.data());
        });

        // 🌟 2. 針對發布時間 (timestamp) 進行降冪排序 (越新的在越上面)
        pendingTasks.sort((a, b) => {
            // 如果剛發布還沒有時間戳記，預設給 0 防呆
            const timeA = a.timestamp ? a.timestamp.toMillis() : 0;
            const timeB = b.timestamp ? b.timestamp.toMillis() : 0;
            return timeB - timeA; // B 減 A 代表由大到小 (新到舊)
        });

        // 🌟 3. 將排好序的陣列轉換為 HTML 印出
        let html = '<ul style="margin: 10px 0 0 0; padding-left: 20px; color: #c0392b; font-size: 14px; line-height: 1.6;">';
        pendingTasks.forEach(task => {
            html += `<li><strong>【${task.subject}】</strong> ${task.title}</li>`;
        });
        html += '</ul>';
        
        dashboardContent.innerHTML = html;
    } catch (error) {
        console.error("讀取學生儀表板失敗：", error);
        dashboardContent.innerHTML = "<p style='color: #e74c3c; margin: 0; font-size: 13px;'>讀取失敗，請檢查網路連線。</p>";
    }
}

// 7-1. 點擊科目
document.querySelectorAll('.subject-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        // 🌟 新增：清除所有科目按鈕的高光，並點亮當下點擊的這顆
        document.querySelectorAll('.subject-btn').forEach(b => b.classList.remove('selected'));
        e.target.classList.add('selected');
        
        // 🌟 新增：因為切換了科目，要把「模式(進度/複習)」的高光清空，要求學生重選
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('selected'));

        currentSubject = e.target.getAttribute('data-subject');
        selectedSubjectLabel.innerText = `【${currentSubject}】`;
        modeArea.style.display = 'block';

        if (studentTaskList) {
            studentTaskList.innerHTML = `<p style='text-align:center; color:#7f8c8d; background:#f8f9fa; padding:15px; border-radius:8px;'>請點擊上方的「學校進度」或「學測複習」來載入【${currentSubject}】的內容。</p>`;
        }
    });
});

// 7-2. 點擊模式抓取資料
document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('selected'));
        e.target.classList.add('selected');

        const currentMode = e.target.getAttribute('data-mode');
        
        if (!studentTaskList) return;
        studentTaskList.innerHTML = "<p style='text-align:center; color:#7f8c8d;'>🔄 努力抓取資料中...</p>";

        try {
            const q = query(collection(db, "tasks"),
                where("students", "array-contains", currentLoggedInStudent), 
                where("subject", "==", currentSubject),
                where("type", "==", currentType),
                where("mode", "==", currentMode)
            );

            const querySnapshot = await getDocs(q);
            studentTaskList.innerHTML = ""; 

            if (querySnapshot.empty) {
                const emptyMessage = currentType === "講義" ? "目前尚未有講義喔！📚" : "目前沒有未完成的作業喔！🎉";
                studentTaskList.innerHTML = `<p style='text-align:center; color:#7f8c8d;'>${emptyMessage}</p>`;
                return;
            }

            querySnapshot.forEach((documentSnapshot) => {
                const task = documentSnapshot.data();
                const taskId = documentSnapshot.id; 
                const modeBadge = task.mode ? `<span style="background: #95a5a6; color: white; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold;">${task.mode}</span>` : '';

// 🌟 改為搜尋引擎可以辨識的 class，並取消預設 padding 讓細節掌控
                const taskCard = document.createElement('div');
                taskCard.className = 'card task-item-card';
                taskCard.style.marginTop = '15px';
                taskCard.style.border = '1px solid #e0e0e0';
                taskCard.style.padding = '0'; 
                taskCard.style.overflow = 'hidden';

                if (task.type === "講義") {
                    const downloadFileName = task.originalFileName || `${task.title}.pdf`;
                    taskCard.innerHTML = `
                        <details style="background: #fff; cursor: pointer; transition: all 0.3s ease;">
                            <summary class="task-summary" style="padding: 15px; font-size: 16px; font-weight: bold; color: #2c3e50; outline: none; user-select: none; border-bottom: 1px solid transparent;">
                                📄 ${task.title}
                            </summary>
                            <div style="padding: 0 15px 15px 15px; border-top: 1px dashed #eee; cursor: auto; background: #fafbfc;">
                                <div style="display: flex; gap: 10px; margin-top: 5px;">
                                    <a href="${task.fileUrl}" target="_blank" class="primary-btn" style="flex: 1; box-sizing: border-box; text-align:center; text-decoration:none; background-color:#3498db; padding: 10px;">🔍 線上觀看</a>
                                    <button class="primary-btn student-download-pdf-btn" data-url="${task.fileUrl}" data-filename="${downloadFileName}" style="flex: 1; background-color:#27ae60; padding: 10px;">⬇️ 儲存檔案</button>
                                </div>
                            </div>
                        </details>
                    `;
                } else if (task.type === "練習題") {
                    const isCompleted = task.status === "已完成";
                    const hasFeedback = task.teacherFeedbackUrls?.length > 0 || !!task.teacherFeedbackUrl; 
                    

                    let innerHTML = `
                        <details style="background: #fff; cursor: pointer; transition: all 0.3s ease;">
                            <summary class="task-summary" style="padding: 15px; font-size: 16px; font-weight: bold; color: #2c3e50; outline: none; user-select: none; display: flex; flex-wrap: wrap; align-items: center; gap: 10px; border-bottom: 1px solid transparent;">
                                📝 ${task.title} ${modeBadge}
                            </summary>
                            <div style="padding: 0 15px 15px 15px; border-top: 1px dashed #eee; cursor: auto; background: #fafbfc;">
                                ${task.hint ? `<p style="background:#fff3cd; padding:10px; border-radius:8px; color:#856404; margin-top:0;">💡 老師叮嚀：${task.hint}</p>` : ''}
                                
                                <details style="cursor: pointer; margin-bottom: 15px; background: #fff; padding: 10px; border-radius: 8px; border: 1px solid #e0e0e0;">
                                    <summary style="font-weight: bold; color: #3498db; outline: none; user-select: none;">
                                        🖼️ 點擊展開/收合題目圖片
                                    </summary>
                                    <div style="margin-top: 10px;">
                                        ${generateGalleryHTML(task.fileUrls || task.fileUrl, '#e67e22')}
                                    </div>
                                </details>
                                <div style="background:#f8f9fa; padding:15px; border-radius:8px;">
                    `;

                    if (isCompleted) {
                        innerHTML += `
                            <details style="cursor: pointer; margin-bottom: 15px;">
                                <summary style="color: #27ae60; font-weight: bold; outline: none; user-select: none;">✅ 已繳交作業 (點擊展開查看解答)</summary>
                                <div style="margin-top: 12px;">${generateGalleryHTML(task.studentReplyUrls || task.studentReplyUrl, '#27ae60')}</div>
                            </details>
                        `;

                        if (hasFeedback) {
                            innerHTML += `
                                <div style="background: #f4ecf7; border-left: 4px solid #8e44ad; padding: 10px; border-radius: 4px;">
                                    <details open style="cursor: pointer;">
                                        <summary style="color: #8e44ad; font-weight: bold; outline: none; user-select: none;">👩‍🏫 老師的批改回饋 (點擊收合)</summary>
                                        <div style="margin-top: 12px;">${generateGalleryHTML(task.teacherFeedbackUrls || task.teacherFeedbackUrl, '#8e44ad')}</div>
                                    </details>
                                </div>
                            `;
                        } else {
                            innerHTML += `<button class="student-retract-btn" data-id="${taskId}" style="background: #ecf0f1; border: 1px solid #bdc3c7; color: #7f8c8d; padding: 8px 15px; border-radius: 8px; cursor: pointer; font-weight: bold; width: 100%; transition: 0.3s;">🔄 傳錯了？點此收回作業</button>`;
                        }
                    } else {
                        innerHTML += `
                            <h4 style="margin-top:0;">上傳你的解答：</h4>
                            <input type="file" id="reply-file-${taskId}" accept="application/pdf, .pdf, image/jpeg, image/png, image/heic, image/heif, .heic, .heif" multiple style="margin-bottom: 10px; width: 100%;">
                            <button class="primary-btn submit-reply-btn" data-id="${taskId}" style="background-color:#27ae60;">繳交作業</button>
                        `;
                    }
                    innerHTML += `</div></div></details>`;
                    taskCard.innerHTML = innerHTML;
                }
                studentTaskList.appendChild(taskCard);
            });

            if(document.getElementById('search-area')) {
                document.getElementById('search-area').style.display = 'block';
            }

            // 7-3. 綁定學生繳交作業按鈕事件
            document.querySelectorAll('.submit-reply-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const taskId = e.target.getAttribute('data-id');
                    const fileInput = document.getElementById(`reply-file-${taskId}`);
                    const files = fileInput.files;
                    if (files.length === 0) { alert("請先選擇至少一張解答照片！"); return; }

                    try {
                        btn.innerText = "上傳多圖中...";
                        btn.disabled = true;

                        const uploadResults = await uploadMultipleFilesToCloudinary(files);
                        const replyUrls = uploadResults.map(res => res.url);
                        
                        await updateDoc(doc(db, "tasks", taskId), {
                            status: "已完成",
                            studentReplyUrls: replyUrls,
                            replyTimestamp: serverTimestamp()
                        });

                        alert("🎉 作業繳交成功！");
                        e.target.parentElement.innerHTML = `
                            <details style="cursor: pointer;">
                                <summary style="color: #27ae60; font-weight: bold; outline: none; user-select: none;">
                                    ✅ 作業繳交成功！ (點擊展開查看)
                                </summary>
                                <div style="margin-top: 12px;">
                                    ${generateGalleryHTML(replyUrls, '#27ae60')}
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

// ==========================================
// 8. 全域動態按鈕事件監聽器 (事件委派)
// ==========================================
document.body.addEventListener('click', async (e) => {
    if (!e.target || !e.target.classList) return; // 基礎防呆

    // 【老師】刪除任務
    if (e.target.classList.contains('admin-delete-task-btn')) {
        if (!confirm("確定要刪除這筆資料嗎？刪除後無法恢復喔！")) return;
        const taskId = e.target.getAttribute('data-id');
        try {
            e.target.innerText = "刪除中...";
            await deleteDoc(doc(db, "tasks", taskId));
            alert("🗑️ 刪除成功！");
            loadAdminHistory(); 
        } catch (error) {
            console.error(error);
            alert("刪除失敗");
        }
    }

    // 【老師】上傳批改圖片
if (e.target.classList.contains('admin-submit-feedback-btn')) {
        const taskId = e.target.getAttribute('data-id');
        const fileInput = document.getElementById(`feedback-file-${taskId}`);
        const files = fileInput.files;
        
        if (files.length === 0) { alert("請先選擇至少一張批改圖片！"); return; }
        
        try {
            e.target.innerText = "上傳多圖中...";
            e.target.disabled = true;
            const uploadResults = await uploadMultipleFilesToCloudinary(files);
            const feedbackUrls = uploadResults.map(res => res.url);
            
            await updateDoc(doc(db, "tasks", taskId), { teacherFeedbackUrls: feedbackUrls });
            alert("👩‍🏫 批改送出成功！");
            loadAdminHistory(); 
        } catch (error) {
            console.error(error);
            alert("上傳失敗");
            e.target.innerText = "送出批改";
            e.target.disabled = false;
        }
    }

    // 【老師】收回批改圖片
    if (e.target.classList.contains('admin-retract-feedback-btn')) {
        if (!confirm("確定要收回這份批改嗎？")) return;
        const taskId = e.target.getAttribute('data-id');
        try {
            e.target.innerText = "收回中...";
            await updateDoc(doc(db, "tasks", taskId), {
                teacherFeedbackUrl: ""
            });
            alert("🔄 批改已收回，現在可以重新上傳囉！");
            loadAdminHistory(); 
        } catch (error) {
            console.error(error);
            alert("收回失敗");
        }
    }

    // 【學生】收回作業
    // 【學生】收回作業
    if (e.target.classList.contains('student-retract-btn')) {
        if (!confirm("確定要收回作業嗎？收回後需重新上傳檔案。")) return;
        const taskId = e.target.getAttribute('data-id');
        try {
            e.target.innerText = "收回中...";
            
            // 🌟 升級修正：同時清空舊版的單一字串與新版的陣列欄位
            await updateDoc(doc(db, "tasks", taskId), {
                status: "未完成",
                studentReplyUrls: [], // 清空多圖/PDF 陣列
                studentReplyUrl: "",  // 相容清空舊資料
                replyTimestamp: null
            });
            
            alert("🔄 作業已收回！");
            // 提示學生重新載入畫面
            document.getElementById('student-task-list').innerHTML = "<p style='text-align:center; color:#27ae60;'>已成功收回，請重新點擊上方的「學校進度」或「學測複習」來重新載入題目。</p>";
        } catch (error) {
            console.error(error);
            alert("收回失敗，請檢查網路連線。");
            e.target.innerText = "🔄 傳錯了？點此收回作業";
        }
    }
    
    // 【學生】強制下載 PDF
    if (e.target.classList.contains('student-download-pdf-btn')) {
        const fileUrl = e.target.getAttribute('data-url');
        const fileName = e.target.getAttribute('data-filename'); 
        const originalText = e.target.innerText;

        try {
            e.target.innerText = "⏳ 下載打包中...";
            e.target.disabled = true;

            const response = await fetch(fileUrl);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = fileName; 
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

// ==========================================
// 9. 開發者外掛：模擬學生視角切換
// ==========================================
const simulateStudentBtn = document.getElementById('simulate-student-btn');
const exitSimulationBtn = document.getElementById('exit-simulation-btn');

if (simulateStudentBtn && exitSimulationBtn) {
    // 進入模擬模式
    simulateStudentBtn.addEventListener('click', () => {
        if (!adminSelectedStudent) {
            alert("請先選擇一位學生！");
            return;
        }
        
        // 1. 暫時將全域狀態切換為學生
        isAdmin = false;
        currentLoggedInStudent = adminSelectedStudent;
        
        // 2. 切換 UI 面板
        document.getElementById('admin-panel').style.display = 'none';
        document.getElementById('student-panel').style.display = 'block';
        exitSimulationBtn.style.display = 'block'; // 亮出返回按鈕
        
        // 3. 更新學生畫面文字
        document.getElementById('section-title').innerText = `👀 模擬視角：${currentLoggedInStudent} 的主頁`;
        document.getElementById('section-desc').innerText = "目前處於模擬模式，你可以像學生一樣查看、操作任何功能。";
        
        // 4. 重置畫面準備
        document.getElementById('subject-area').style.display = 'block'; // 顯示科目選擇
        document.getElementById('mode-area').style.display = 'none';
        document.getElementById('student-task-list').innerHTML = '';
        
        // 🌟 補上這兩行：在進入模擬模式時，把儀表板顯示出來並啟動掃描！
        document.getElementById('student-dashboard').style.display = 'block';
        if(typeof loadStudentDashboard === "function") loadStudentDashboard();
    });

    // 結束模擬，退回老師模式
    exitSimulationBtn.addEventListener('click', () => {
        // 1. 恢復老師身分狀態
        isAdmin = true;
        currentLoggedInStudent = "";
        
        // 2. 切換 UI 面板
        document.getElementById('student-panel').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'block';
        exitSimulationBtn.style.display = 'none'; // 隱藏返回按鈕
        
        // 3. 重新載入老師原先的歷史紀錄畫面
        loadAdminHistory();
    });
}

// ==========================================
// 10. 學生端：即時標題搜尋引擎
// ==========================================
const taskSearchInput = document.getElementById('task-search-input');
if(taskSearchInput) {
    taskSearchInput.addEventListener('input', (e) => {
        const keyword = e.target.value.toLowerCase();
        const cards = document.querySelectorAll('#student-task-list .task-item-card');
        
        cards.forEach(card => {
            const summaryElement = card.querySelector('.task-summary');
            if (summaryElement) {
                const titleText = summaryElement.innerText.toLowerCase();
                if (titleText.includes(keyword)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            }
        });
    });
}