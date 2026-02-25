// app.js - Bản hoàn chỉnh cuối cùng đã được cấu hình Realtime Database
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, set, get, child } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// 1. Cấu hình Firebase - Đã thêm databaseURL của bạn
const firebaseConfig = {
  apiKey: "AIzaSyC96IZTPJ9CO-mWWFkR3NVzWjIaUDBMoRE",
  authDomain: "my-web-auth-2026.firebaseapp.com",
  databaseURL: "https://my-web-auth-2026-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "my-web-auth-2026",
  storageBucket: "my-web-auth-2026.firebasestorage.app",
  messagingSenderId: "358827662331",
  appId: "1:358827662331:web:4916eefadb5a13c591895e",
  measurementId: "G-HDFHJWF43D"
};

// Khởi tạo
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// 2. Hàm lưu dữ liệu (Quan trọng: Phải gọi đúng db đã khởi tạo)
async function syncUser(user) {
    const userRef = ref(db, 'members/' + user.uid);
    
    try {
        const snapshot = await get(child(ref(db), `members/${user.uid}`));
        
        let data = {
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            lastLogin: Date.now()
        };
        
        if (!snapshot.exists()) {
            data.createdAt = Date.now();
        }
        
        await set(userRef, data);
        console.log("Đã lưu dữ liệu vào Realtime Database thành công!");
    } catch (error) {
        console.error("Lỗi khi lưu DB:", error);
    }
}

// 3. Xử lý Đăng nhập Google
document.getElementById('btn-google').onclick = async () => {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        // Sau khi đăng nhập xong, phải gọi hàm lưu dữ liệu
        await syncUser(result.user);
    } catch (error) {
        console.error("Lỗi đăng nhập:", error.message);
        alert("Lỗi: " + error.message);
    }
};

// 4. Theo dõi trạng thái để thay đổi giao diện
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

        // Lấy ngày tham gia hiển thị lên màn hình
        const dbRef = ref(db);
        get(child(dbRef, `members/${user.uid}`)).then((snapshot) => {
            if (snapshot.exists() && snapshot.val().createdAt) {
                const date = new Date(snapshot.val().createdAt);
                document.getElementById('join-date').innerText = date.toLocaleDateString('vi-VN');
            }
        });
    } else {
        loginSection.classList.remove('hidden');
        userInfo.classList.add('hidden');
        title.innerText = "Cộng Đồng";
    }
});

// 5. Đăng xuất
document.getElementById('btn-logout').onclick = () => signOut(auth);