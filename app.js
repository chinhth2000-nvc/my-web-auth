// app.js - Nội dung hoàn chỉnh đã merge Firebase Config
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 1. Cấu hình Firebase của bạn
const firebaseConfig = {
  apiKey: "AIzaSyC96IZTPJ9CO-mWWFkR3NVzWjIaUDBMoRE",
  authDomain: "my-web-auth-2026.firebaseapp.com",
  projectId: "my-web-auth-2026",
  storageBucket: "my-web-auth-2026.firebasestorage.app",
  messagingSenderId: "358827662331",
  appId: "1:358827662331:web:4916eefadb5a13c591895e",
  measurementId: "G-HDFHJWF43D"
};

// Khởi tạo các dịch vụ
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 2. Hàm đồng bộ dữ liệu người dùng vào Firestore (Database)
async function syncUser(user) {
    const userRef = doc(db, "members", user.uid);
    const userSnap = await getDoc(userRef);

    const userData = {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        lastLogin: serverTimestamp()
    };

    if (!userSnap.exists()) {
        userData.createdAt = serverTimestamp(); // Lưu ngày tham gia lần đầu
    }

    await setDoc(userRef, userData, { merge: true });
}

// 3. Xử lý Đăng nhập bằng Google
document.getElementById('btn-google').onclick = async () => {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        await syncUser(result.user);
    } catch (error) {
        console.error("Lỗi Google:", error.message);
        alert("Không thể đăng nhập Google. Vui lòng kiểm tra cấu hình Auth trong Firebase.");
    }
};

// 4. Xử lý Đăng nhập bằng Facebook
document.getElementById('btn-facebook').onclick = async () => {
    const provider = new FacebookAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        await syncUser(result.user);
    } catch (error) {
        console.error("Lỗi Facebook:", error.message);
        alert("Lỗi Facebook: " + error.message);
    }
};

// 5. Theo dõi trạng thái đăng nhập để thay đổi giao diện
onAuthStateChanged(auth, async (user) => {
    const loginSection = document.getElementById('login-section');
    const userInfo = document.getElementById('user-info');
    const title = document.getElementById('title');

    if (user) {
        // Nếu đã đăng nhập
        loginSection.classList.add('hidden');
        userInfo.classList.remove('hidden');
        title.innerText = "Hồ Sơ Thành Viên";

        document.getElementById('user-name').innerText = user.displayName || "Thành viên";
        document.getElementById('user-email').innerText = user.email;
        document.getElementById('user-photo').src = user.photoURL || 'https://via.placeholder.com/90';

        // Lấy ngày tham gia từ Database
        const docSnap = await getDoc(doc(db, "members", user.uid));
        if (docSnap.exists() && docSnap.data().createdAt) {
            const date = docSnap.data().createdAt.toDate();
            document.getElementById('join-date').innerText = date.toLocaleDateString('vi-VN');
        }
    } else {
        // Nếu đã đăng xuất
        loginSection.classList.remove('hidden');
        userInfo.classList.add('hidden');
        title.innerText = "Cộng Đồng";
    }
});

// 6. Xử lý Đăng xuất
document.getElementById('btn-logout').onclick = () => {
    signOut(auth).then(() => {
        console.log("Đã đăng xuất");
    });
};