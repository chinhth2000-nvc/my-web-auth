import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, set, get, child } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Giữ nguyên config cũ của bạn
const firebaseConfig = {
  apiKey: "AIzaSyC96IZTPJ9CO-mWWFkR3NVzWjIaUDBMoRE",
  authDomain: "my-web-auth-2026.firebaseapp.com",
  databaseURL: "https://my-web-auth-2026-default-rtdb.asia-southeast1.firebasedatabase.app", // LINK 
  projectId: "my-web-auth-2026",
  storageBucket: "my-web-auth-2026.firebasestorage.app",
  messagingSenderId: "358827662331",
  appId: "1:358827662331:web:4916eefadb5a13c591895e",
  measurementId: "G-HDFHJWF43D"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app); // Sử dụng Realtime Database

// Hàm lưu dữ liệu vào Realtime Database
function syncUser(user) {
    const userRef = ref(db, 'members/' + user.uid);
    
    // Kiểm tra xem đã có dữ liệu chưa để giữ lại ngày tham gia
    get(child(ref(db), `members/${user.uid}`)).then((snapshot) => {
        let data = {
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            lastLogin: Date.now()
        };
        
        if (!snapshot.exists()) {
            data.createdAt = Date.now();
        }
        
        set(userRef, data);
    });
}

// Nút đăng nhập Google
document.getElementById('btn-google').onclick = async () => {
    try {
        const result = await signInWithPopup(auth, new GoogleAuthProvider());
        syncUser(result.user);
    } catch (error) {
        alert("Lỗi: " + error.message);
    }
};

// Theo dõi trạng thái
onAuthStateChanged(auth, (user) => {
    const loginSec = document.getElementById('login-section');
    const userSec = document.getElementById('user-info');
    
    if (user) {
        loginSec.classList.add('hidden');
        userSec.classList.remove('hidden');
        document.getElementById('user-name').innerText = user.displayName;
        document.getElementById('user-email').innerText = user.email;
        document.getElementById('user-photo').src = user.photoURL;

        // Lấy ngày tham gia
        get(child(ref(db), `members/${user.uid}`)).then((snapshot) => {
            if (snapshot.exists()) {
                const date = new Date(snapshot.val().createdAt);
                document.getElementById('join-date').innerText = date.toLocaleDateString('vi-VN');
            }
        });
    } else {
        loginSec.classList.remove('hidden');
        userSec.classList.add('hidden');
    }
});

document.getElementById('btn-logout').onclick = () => signOut(auth);