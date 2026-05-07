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

const ADMIN_EMAIL = "a93386@gmail.com"; 
const STUDENT_ACCOUNTS = {
    "紫軒": "nicole980111@gmail.com", 
    "昵貽": "chenn5571@gmail.com",   
    "芳銘": "aliyaliao1103@gmail.com" 
};

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
// 4. 登入、登出與身分驗證邏輯
// ==========================================
loginBtn.addEventListener('click', () => {
    signInWithPopup(auth, provider).catch(error => console.error("登入失敗：", error));
});

logoutBtn.addEventListener('click', () => {
    signOut(auth).catch(error => console.error("登出失敗：", error));
});

onAuthStateChanged(auth, (user) => {
    if (user) {
        loginPanel.style.display = 'none'; 
        topNav.style.display = 'flex';     
        menuBtn.style.display = 'block'; 

        if (user.email === ADMIN_EMAIL) {
            // 老師身分
            isAdmin = true;
            currentLoggedInStudent = ""; 
            adminPanel.style.display = 'block';
            studentPanel.style.display = 'none';
            adminStudentList.style.display = 'block';
            adminTaskPanel.style.display = 'none';
        } else {
            // 學生身分判斷
            let foundStudent = "";
            for (const [name, email] of Object.entries(STUDENT_ACCOUNTS)) {
                if (user.email === email) {
                    foundStudent = name;
                    break;
                }
            }

            if (foundStudent) {
                isAdmin = false;
                currentLoggedInStudent = foundStudent; 
                adminPanel.style.display = 'none';
                studentPanel.style.display = 'block';
                
                sectionTitle.innerText = `👋 歡迎回來，${currentLoggedInStudent}！`;
                sectionDesc.innerText = "請點擊左上角選單 (☰) 選擇你要查看「講義」還是「練習題」。";
                
                subjectArea.style.display = 'none';
                modeArea.style.display = 'none';
                studentTaskList.innerHTML = '';
            } else {
                alert("⛔ 抱歉，此 Google 帳號未授權使用本系統！請使用老師指定的帳號登入。");
                signOut(auth);
            }
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
    return { url: data.secure_url, publicId: data.public_id };
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
        loadAdminHistory();
    } catch (error) {
        console.error(error);
        alert("發布失敗，請檢查控制台。");
    } finally {
        publishPdfBtn.innerText = "發布講義 (PDF)";
        publishPdfBtn.disabled = false;
    }
});

// 6-7. 發布題目 (圖片)
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

        const uploadResult = await uploadFileToCloudinary(file);

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
        loadAdminHistory();
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
            where("student", "==", adminSelectedStudent),
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
            htmlContent += `<div style="background:#f8f9fa; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; margin-bottom: 15px; position: relative;">`;
            htmlContent += `<button class="admin-delete-task-btn" data-id="${task.id}" style="position: absolute; top: 15px; right: 15px; background: none; border: none; color: #e74c3c; cursor: pointer; font-size: 16px; font-weight: bold;">🗑️ 刪除</button>`;

            const modeBadge = task.mode ? `<span style="background: #bdc3c7; color: #fff; padding: 3px 8px; border-radius: 12px; font-size: 12px; margin-left: 10px;">${task.mode}</span>` : "";

            if (task.type === "講義") {
                htmlContent += `
                    <h4 style="margin-top:0; color:#2980b9; padding-right: 40px;">📄 ${task.title} ${modeBadge}</h4>
                    <p style="font-size: 10px; color: #bdc3c7; margin-bottom: 5px;">雲端 ID: ${task.cloudinaryId || '無'}</p>
                    <a href="${task.fileUrl}" target="_blank" class="primary-btn" style="display:inline-block; text-decoration:none; background-color:#3498db; padding: 8px 15px; width:auto;">查看已發布講義</a>
                `;
            } else if (task.type === "練習題") {
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

// ==========================================
// 7. 學生端專屬功能
// ==========================================

// 7-1. 點擊科目
document.querySelectorAll('.subject-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
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
        const currentMode = e.target.getAttribute('data-mode');
        
        if (!studentTaskList) return;
        studentTaskList.innerHTML = "<p style='text-align:center; color:#7f8c8d;'>🔄 努力抓取資料中...</p>";

        try {
            const q = query(collection(db, "tasks"),
                where("student", "==", currentLoggedInStudent), 
                where("subject", "==", currentSubject),
                where("type", "==", currentType),
                where("mode", "==", currentMode)
            );

            const querySnapshot = await getDocs(q);
            studentTaskList.innerHTML = ""; 

            if (querySnapshot.empty) {
                studentTaskList.innerHTML = "<p style='text-align:center; color:#7f8c8d;'>目前沒有未完成的作業喔！🎉</p>";
                return;
            }

            querySnapshot.forEach((documentSnapshot) => {
                const task = documentSnapshot.data();
                const taskId = documentSnapshot.id; 

                const taskCard = document.createElement('div');
                taskCard.className = 'card';
                taskCard.style.marginTop = '15px';
                taskCard.style.border = '1px solid #e0e0e0';

                if (task.type === "講義") {
                    const downloadFileName = task.originalFileName || `${task.title}.pdf`;
                    taskCard.innerHTML = `
                        <h3 style="margin-top:0; color:#2c3e50; word-break: break-word;">📄 ${task.title}</h3>
                        <div style="display: flex; gap: 10px; margin-top: 15px;">
                            <a href="${task.fileUrl}" target="_blank" class="primary-btn" style="flex: 1; box-sizing: border-box; text-align:center; text-decoration:none; background-color:#3498db; padding: 10px;">🔍 線上觀看</a>
                            <button class="primary-btn student-download-pdf-btn" data-url="${task.fileUrl}" data-filename="${downloadFileName}" style="flex: 1; background-color:#27ae60; padding: 10px;">⬇️ 儲存檔案</button>
                        </div>
                    `;
                }
                else if (task.type === "練習題") {
                    const isCompleted = task.status === "已完成";
                    const hasFeedback = !!task.teacherFeedbackUrl; 
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
                            innerHTML += `
                                <button class="student-retract-btn" data-id="${taskId}" style="background: #ecf0f1; border: 1px solid #bdc3c7; color: #7f8c8d; padding: 8px 15px; border-radius: 8px; cursor: pointer; font-weight: bold; width: 100%; transition: 0.3s;">
                                    🔄 傳錯了？點此收回作業
                                </button>
                            `;
                        }
                    } else {
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

            // 7-3. 綁定學生繳交作業按鈕事件
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

                        const uploadResult = await uploadFileToCloudinary(file);
                        const taskRef = doc(db, "tasks", taskId);
                        
                        await updateDoc(taskRef, {
                            status: "已完成",
                            studentReplyUrl: uploadResult.url,
                            replyTimestamp: serverTimestamp()
                        });

                        alert("🎉 作業繳交成功！");
                        e.target.parentElement.innerHTML = `
                            <details style="cursor: pointer;">
                                <summary style="color: #27ae60; font-weight: bold; outline: none; user-select: none;">
                                    ✅ 作業繳交成功！ (點擊展開查看)
                                </summary>
                                <div style="margin-top: 12px;">
                                    <img src="${uploadResult.url}" style="width: 100%; border-radius: 8px; cursor: zoom-in; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" onclick="window.open(this.src)">
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
        const file = fileInput.files[0];
        
        if (!file) {
            alert("請先選擇批改後的圖片！");
            return;
        }
        try {
            e.target.innerText = "上傳中...";
            e.target.disabled = true;
            const uploadResult = await uploadFileToCloudinary(file);
            await updateDoc(doc(db, "tasks", taskId), {
                teacherFeedbackUrl: uploadResult.url 
            });
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
            document.getElementById('student-task-list').innerHTML = "<p style='text-align:center; color:#27ae60;'>已成功收回，請重新點擊上方模式按鈕載入題目。</p>";
        } catch (error) {
            console.error(error);
            alert("收回失敗");
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
