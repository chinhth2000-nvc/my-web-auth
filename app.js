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
async function syncUser(user) {
    // Tạo định dạng ngày tháng: "21:55:01 25/02/2026"
    const now = new Date();
    const formattedDate = now.toLocaleTimeString('vi-VN') + " " + now.toLocaleDateString('vi-VN');
    
    const userPath = 'members/' + user.uid;
    const dbRef = ref(db);

    try {
        // Kiểm tra xem thành viên đã tồn tại chưa để giữ ngày tham gia đầu tiên
        const snapshot = await get(child(dbRef, userPath));
        
        let userData = {
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            lastLogin: formattedDate // Ghi đè bằng chữ thay vì số
        };
        
        if (!snapshot.exists()) {
            userData.createdAt = formattedDate;
        } else {
            // Nếu đã có, giữ nguyên ngày tạo cũ
            userData.createdAt = snapshot.val().createdAt;
        }

        // Cập nhật thông tin Profile chính
        await set(ref(db, userPath), userData);

        // LƯU LỊCH SỬ ĐĂNG NHẬP: Mỗi lần đăng nhập tạo 1 dòng mới trong thư mục 'history'
        const historyListRef = ref(db, userPath + '/history');
        const newHistoryRef = push(historyListRef); // Lệnh push giúp tạo ID ngẫu nhiên, tránh ghi đè
        await set(newHistoryRef, {
            loginAt: formattedDate
        });

        console.log("Hệ thống: Đã lưu dữ liệu mới vào lúc " + formattedDate);
    } catch (error) {
        console.error("Lỗi đồng bộ Database:", error);
    }
}

// 3. Xử lý Đăng nhập Google
document.getElementById('btn-google').onclick = async () => {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        await syncUser(result.user);
    } catch (error) {
        console.error("Lỗi đăng nhập:", error.message);
        alert("Lỗi: " + error.message);
    }
};

// 4. Theo dõi trạng thái đăng nhập để cập nhật giao diện
onAuthStateChanged(auth, async (user) => {
    const loginSection = document.getElementById('login-section');
    const userInfo = document.getElementById('user-info');
    const title = document.getElementById('title');

    if (user) {
        loginSection.classList.add('hidden');
        userInfo.classList.remove('hidden');
        title.innerText = "Hồ Sơ Thành Viên";

        document.getElementById('user-name').innerText = user.displayName || "Thành viên";
        document.getElementById('user-email').innerText = user.email;
        document.getElementById('user-photo').src = user.photoURL || 'https://via.placeholder.com/90';

        // Hiển thị ngày tham gia lấy từ Database
        const userRef = ref(db, 'members/' + user.uid);
        get(userRef).then((snapshot) => {
            if (snapshot.exists()) {
                document.getElementById('join-date').innerText = snapshot.val().createdAt || "Đang cập nhật...";
            }
        });
    } else {
        loginSection.classList.remove('hidden');
        userInfo.classList.add('hidden');
        title.innerText = "Cộng Đồng";
    }
});

// 5. Xử lý Đăng xuất
document.getElementById('btn-logout').onclick = () => {
    signOut(auth).then(() => {
        console.log("Đã đăng xuất");
    });
};
