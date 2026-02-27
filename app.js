import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, set, get, child, push } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// --- CẤU HÌNH ---
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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// --- HÀM TRỢ GIÚP ---

// Hàm định dạng thời gian Việt Nam
const getVNDate = () => {
    return new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
};

// Hàm đồng bộ dữ liệu người dùng
async function syncUser(user, providerName) {
    const userPath = `members/${user.uid}`;
    const timeNow = getVNDate();

    try {
        const snapshot = await get(child(ref(db), userPath));
        let createdAt = timeNow;

        if (snapshot.exists()) {
            createdAt = snapshot.val().createdAt || timeNow;
        }

        // 1. Cập nhật Profile
        await set(ref(db, userPath + '/profile'), {
            name: user.displayName,
            email: user.email,
            photo: user.photoURL,
            lastLogin: timeNow,
            createdAt: createdAt,
            provider: providerName
        });

        // 2. Thêm vào Lịch sử (Push tạo ID mới)
        const historyRef = ref(db, userPath + '/history');
        await push(historyRef, {
            time: timeNow,
            type: providerName
        });

        console.log("✅ Dữ liệu đã được đồng bộ!");
    } catch (error) {
        console.error("❌ Lỗi Sync:", error);
    }
}

// --- XỬ LÝ SỰ KIỆN ---

// Đăng nhập Google
document.getElementById('btn-google').onclick = async () => {
    try {
        const result = await signInWithPopup(auth, new GoogleAuthProvider());
        await syncUser(result.user, "Google");
    } catch (error) {
        alert("Lỗi Google Auth: " + error.message);
    }
};

// Đăng nhập Facebook (Để sẵn khung cho bạn làm tiếp)
document.getElementById('btn-facebook').onclick = async () => {
    try {
        const result = await signInWithPopup(auth, new FacebookAuthProvider());
        await syncUser(result.user, "Facebook");
    } catch (error) {
        alert("Lỗi Facebook Auth: " + error.message);
    }
};

// Đăng xuất
document.getElementById('btn-logout').onclick = () => signOut(auth);

// --- THEO DÕI TRẠNG THÁI ---
onAuthStateChanged(auth, (user) => {
    const loginSec = document.getElementById('login-section');
    const userSec = document.getElementById('user-info');

    if (user) {
        loginSec.classList.add('hidden');
        userSec.classList.remove('hidden');

        // Hiển thị UI ngay lập tức từ đối tượng user của Firebase
        document.getElementById('user-name').innerText = user.displayName;
        document.getElementById('user-email').innerText = user.email;
        document.getElementById('user-photo').src = user.photoURL;

        // Lấy dữ liệu từ Database để hiển thị Ngày tham gia và Lịch sử
        const userRef = ref(db, `members/${user.uid}`);
        get(userRef).then((snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                if (data.profile) {
                    document.getElementById('join-date').innerText = data.profile.createdAt;
                }
                
                // Hiển thị danh sách lịch sử
                const historyList = document.getElementById('login-history-list');
                historyList.innerHTML = "";
                
                if (data.history) {
                    // Chuyển lịch sử thành mảng, đảo ngược để cái mới nhất lên đầu
                    Object.values(data.history).reverse().forEach(log => {
                        const li = document.createElement('li');
                        li.innerText = `${log.time} [${log.type}]`;
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
