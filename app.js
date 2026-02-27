// app.js - Bản hoàn chỉnh: Lưu lịch sử đăng nhập & Định dạng ngày tháng tiếng Việt
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, set, get, child, push } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// 1. Cấu hình Firebase của bạn
const firebaseConfig = {
  apiKey: "AIzaSyC96IZTPJ9CO-mWWFkR3NVzWjIaUDBMoRE",
  authDomain: "my-web-auth-2026.firebaseapp.com",
  databaseURL: "https://my-web-auth-2026-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "my-web-auth-2026",
  storageBucket: "my-web-auth-2026.firebasestorage.app",
  messagingSenderId: "358827662331",
  appId: "1:358827662331:web:4916eefadb5a13c591895e",
  measurementId: "G-HDFHJWF43D"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app, firebaseConfig.databaseURL);

// 2. Hàm xử lý lưu dữ liệu và lịch sử
    async function syncUser(user, providerName = "Google") {
    const now = new Date();
    const formattedDate = now.toLocaleTimeString('vi-VN') + " " + now.toLocaleDateString('vi-VN');
    const timestamp = Date.now();

    const userPath = 'members/' + user.uid;
    const dbRef = ref(db);

    try {
        // 1. Lấy dữ liệu cũ để giữ lại ngày tham gia (createdAt)
        const snapshot = await get(child(dbRef, userPath));
        let createdAt = formattedDate;
        if (snapshot.exists() && snapshot.val().createdAt) {
            createdAt = snapshot.val().createdAt;
        }

        // 2. Cập nhật thông tin tổng quan (Profile)
        await set(ref(db, userPath), {
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            lastLogin: formattedDate,
            createdAt: createdAt,
            provider: providerName // Để biết họ hay dùng Google hay Facebook
        });

        // 3. LƯU LỊCH SỬ (Dùng push để mỗi lần login là một dòng mới)
        // Đường dẫn: members/UID/login_history/ID_TỰ_ĐỘNG
        const historyRef = ref(db, userPath + '/login_history');
        const newLogRef = push(historyRef); // Tạo ID ngẫu nhiên không trùng lặp
        
        await set(newLogRef, {
            time: formattedDate,
            timestamp: timestamp,
            type: providerName
        });

        console.log("✅ Đã ghi danh vào lịch sử: " + formattedDate);
    } catch (error) {
        console.error("❌ Lỗi lưu lịch sử:", error);
    }
}

// 3. Xử lý Đăng nhập Google
document.getElementById('btn-google').onclick = async () => {
    const provider = new GoogleAuthProvider();
    try {        
        const result = await signInWithPopup(auth, provider);
        await syncUser(result.user, "Google"); // Truyền chữ Google vào        
    } catch (error) {
        console.error("Lỗi đăng nhập:", error.message);
        alert("Lỗi: " + error.message);
    }
};

// 4. Theo dõi trạng thái đăng nhập để cập nhật giao diện
onAuthStateChanged(auth, async (user) => {
    const loginSec = document.getElementById('login-section');
    const userSec = document.getElementById('user-info');
    
    if (user) {
        loginSec.classList.add('hidden');
        userSec.classList.remove('hidden');
        
        // Hiển thị info cơ bản
        document.getElementById('user-name').innerText = user.displayName;
        document.getElementById('user-email').innerText = user.email;
        document.getElementById('user-photo').src = user.photoURL;

        // LẤY DỮ LIỆU TỪ FIREBASE ĐỂ HIỂN THỊ LỊCH SỬ
        const userPath = 'members/' + user.uid;
        const userRef = ref(db, userPath);

        get(userRef).then((snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                
                // 1. Hiển thị ngày tham gia
                document.getElementById('join-date').innerText = data.createdAt;

                // 2. Hiển thị danh sách lịch sử (MỚI)
                const historyList = document.getElementById('login-history-list');
                historyList.innerHTML = ""; // Xóa danh sách cũ đi để hiện danh sách mới

                if (data.login_history) {
                    // Chuyển object lịch sử thành mảng và đảo ngược để cái mới nhất lên đầu
                    const logs = Object.values(data.login_history).reverse();
                    
                    logs.forEach(log => {
                        const li = document.createElement('li');
                        li.style.borderBottom = "1px dotted #ccc";
                        li.style.padding = "5px 0";
                        li.innerText = `➤ ${log.time} (${log.type || 'Google'})`;
                        historyList.appendChild(li);
                    });
                }
            }
        });
    } else {
        loginSec.classList.remove('hidden');
        userSec.classList.add('hidden');
    }
});

// 5. Xử lý Đăng xuất
document.getElementById('btn-logout').onclick = () => {
    signOut(auth).then(() => {
        console.log("Đã đăng xuất");
    });
};



