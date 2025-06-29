// Import các hàm cần thiết từ Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

// Cấu hình Firebase của bạn
const firebaseConfig = {
    apiKey: "AIzaSyCUPqDb_xFs_-_LhwGHFKErug4F-gtM_EQ",
    authDomain: "webdulich-ff78a.firebaseapp.com",
    projectId: "webdulich-ff78a",
    storageBucket: "webdulich-ff78a.firebasestorage.app",
    messagingSenderId: "436989427291",
    appId: "1:436989427291:web:dc670a5b6b11710b75097e",
    measurementId: "G-LWGN05J15Q"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Lấy các phần tử DOM
const guestControls = document.getElementById('guest-controls');
const userControls = document.getElementById('user-controls');
const mobileGuestControls = document.getElementById('mobile-guest-controls');
const mobileUserControls = document.getElementById('mobile-user-controls');

const userNameDisplay = document.getElementById('user-name-display');
const mobileUserNameDisplay = document.getElementById('mobile-user-name-display');

const logoutButton = document.getElementById('logout-button');
const mobileLogoutButton = document.getElementById('mobile-logout-button');

// Hàm để cập nhật giao diện
const updateUI = (user) => {
    if (user) {
        // Người dùng đã đăng nhập
        guestControls.style.display = 'none';
        mobileGuestControls.style.display = 'none';
        userControls.style.display = 'flex'; // Dùng 'flex' để hiển thị lại
        mobileUserControls.style.display = 'flex'; // Dùng 'flex' để hiển thị lại

        // Cập nhật tên người dùng
        const displayName = user.displayName || user.email.split('@')[0]; // Lấy tên hiển thị hoặc phần trước @ của email
        userNameDisplay.textContent = displayName;
        mobileUserNameDisplay.textContent = displayName;

    } else {
        // Người dùng đã đăng xuất hoặc chưa đăng nhập
        guestControls.style.display = 'flex';
        mobileGuestControls.style.display = 'flex';
        userControls.style.display = 'none';
        mobileUserControls.style.display = 'none';
    }
};

// Lắng nghe sự thay đổi trạng thái đăng nhập
onAuthStateChanged(auth, (user) => {
    updateUI(user);
});

// Hàm xử lý đăng xuất
const handleLogout = () => {
    signOut(auth).then(() => {
        // Đăng xuất thành công, giao diện sẽ tự cập nhật nhờ onAuthStateChanged
        console.log("Đăng xuất thành công");
        alert("Bạn đã đăng xuất.");
    }).catch((error) => {
        console.error("Lỗi đăng xuất:", error);
    });
};

// Gắn sự kiện click cho các nút đăng xuất
logoutButton.addEventListener('click', handleLogout);
mobileLogoutButton.addEventListener('click', handleLogout);