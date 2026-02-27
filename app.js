import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, set, get, child, push } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

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

// Hàm lấy thời gian chuẩn Việt Nam
const getVNTime = () => new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

// Hàm đồng bộ dữ liệu và ghi lịch sử
async function syncUser(user, providerName) {
    const timeNow = getVNTime();
    const userRef = ref(db, `members/${user.uid}`);

    try {
        const snapshot = await get(child(ref(db), `members/${user.uid}/profile`));
        let createdAt = timeNow;
        if (snapshot.exists()) {
            createdAt = snapshot.val().createdAt || timeNow;
        }

        // 1. Lưu Profile
        await set(ref(db, `members/${user.uid}/profile`), {
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            createdAt: createdAt,
            lastLogin: timeNow,
            provider: providerName
        });

        // 2. Lưu Lịch sử (Push ID mới)
        const historyRef = ref(db, `members/${user.uid}/history`);
        await push(historyRef, {
            time: timeNow,
            type: providerName
        });

        console.log("✅ Đồng bộ thành công!");
    } catch (e) { console.error(e); }
}

// Xử lý sự kiện nút bấm
document.getElementById('btn-google').onclick = async () => {
    try {
        const res = await signInWithPopup(auth, new GoogleAuthProvider());
        await syncUser(res.user, "Google");
    } catch (e) { alert(e.message); }
};

document.getElementById('btn-facebook').onclick = async () => {
    try {
        const res = await signInWithPopup(auth, new FacebookAuthProvider());
        await syncUser(res.user, "Facebook");
    } catch (e) { alert("Facebook yêu cầu cấu hình App ID. " + e.message); }
};

document.getElementById('btn-logout').onclick = () => signOut(auth);

// Theo dõi trạng thái đăng nhập
onAuthStateChanged(auth, (user) => {
    const loginSec = document.getElementById('login-section');
    const userSec = document.getElementById('user-info');
    const title = document.getElementById('title');

    if (user) {
        loginSec.classList.add('hidden');
        userSec.classList.remove('hidden');
        title.innerText = "Hồ Sơ Thành Viên";

        document.getElementById('user-name').innerText = user.displayName;
        document.getElementById('user-email').innerText = user.email;
        document.getElementById('user-photo').src = user.photoURL;

        // Lấy dữ liệu từ Realtime Database để hiện Ngày tham gia & Lịch sử
        get(ref(db, `members/${user.uid}`)).then((snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                if (data.profile) document.getElementById('join-date').innerText = data.profile.createdAt;
                
                const list = document.getElementById('login-history-list');
                list.innerHTML = "";
                if (data.history) {
                    Object.values(data.history).reverse().forEach(log => {
                        const li = document.createElement('li');
                        li.innerText = `🕒 ${log.time} [${log.type}]`;
                        list.appendChild(li);
                    });
                }
            }
        });
    } else {
        loginSec.classList.remove('hidden');
        userSec.classList.add('hidden');
        title.innerText = "Cộng Đồng";
    }
});
