import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 1. Cấu hình Firebase
const firebaseConfig = {
    apiKey: "AIzaSy...", 
    authDomain: "du-an.firebaseapp.com",
    projectId: "du-an",
    storageBucket: "du-an.appspot.com",
    messagingSenderId: "123",
    appId: "1:123:web:abc"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 2. Hàm đồng bộ người dùng
async function syncUser(user) {
    const userRef = doc(db, "members", user.uid);
    const userSnap = await getDoc(userRef);
    const userData = {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        lastLogin: serverTimestamp()
    };
    if (!userSnap.exists()) userData.createdAt = serverTimestamp();
    await setDoc(userRef, userData, { merge: true });
}

// 3. Sự kiện Đăng nhập
document.getElementById('btn-google').onclick = async () => {
    try {
        const result = await signInWithPopup(auth, new GoogleAuthProvider());
        await syncUser(result.user);
    } catch (e) { alert("Lỗi Google!"); }
};

document.getElementById('btn-facebook').onclick = async () => {
    try {
        const result = await signInWithPopup(auth, new FacebookAuthProvider());
        await syncUser(result.user);
    } catch (e) { alert("Lỗi Facebook!"); }
};

// 4. Lắng nghe trạng thái
onAuthStateChanged(auth, async (user) => {
    const loginSection = document.getElementById('login-section');
    const userInfo = document.getElementById('user-info');
    if (user) {
        loginSection.classList.add('hidden');
        userInfo.classList.remove('hidden');
        document.getElementById('user-name').innerText = user.displayName;
        document.getElementById('user-email').innerText = user.email;
        document.getElementById('user-photo').src = user.photoURL;
        const snap = await getDoc(doc(db, "members", user.uid));
        if (snap.exists() && snap.data().createdAt) {
            document.getElementById('join-date').innerText = snap.data().createdAt.toDate().toLocaleDateString('vi-VN');
        }
    } else {
        loginSection.classList.remove('hidden');
        userInfo.classList.add('hidden');
    }
});

// 5. Đăng xuất
document.getElementById('btn-logout').onclick = () => signOut(auth);