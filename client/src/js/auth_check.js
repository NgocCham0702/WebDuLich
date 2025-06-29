import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { auth } from './firebase-config.js';

export function initializeAuthUI() {
    console.log("🚀 Bắt đầu khởi tạo UI xác thực...");

    // Lấy các element desktop
    const guestControls = document.getElementById('guest-controls');
    const userControls = document.getElementById('user-controls');
    const userNameDisplay = document.getElementById('user-name-display');
    const logoutButton = document.getElementById('logout-button');

    // Lấy các element mobile
    const mobileGuestControls = document.getElementById('mobile-guest-controls');
    const mobileUserControls = document.getElementById('mobile-user-controls');
    const mobileUserNameDisplay = document.getElementById('mobile-user-name-display');
    const mobileLogoutButton = document.getElementById('mobile-logout-button');

    // Menu mobile
    const menuBtn = document.getElementById('menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (!guestControls || !userControls || !menuBtn || !mobileMenu) {
        console.error("Lỗi nghiêm trọng: Không tìm thấy một hoặc nhiều element cần thiết của header. Script sẽ không chạy.");
        return;
    }

    // Xử lý mở/đóng menu mobile
    menuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
        mobileMenu.classList.toggle('flex');
    });

    // Hàm đăng xuất
    const handleLogout = () => {
        signOut(auth).then(() => {
            console.log('Đăng xuất thành công.');
            // Sau khi logout, chuyển về trang chủ hoặc trang đăng nhập
            window.location.href = '/client/index.html';
        }).catch((error) => console.error('Lỗi khi đăng xuất:', error));
    };

    logoutButton.addEventListener('click', handleLogout);
    mobileLogoutButton.addEventListener('click', handleLogout);

    // Lắng nghe trạng thái đăng nhập
    onAuthStateChanged(auth, (user) => {
        console.log('User trạng thái:', user);

        if (user) {
            const displayName = user.displayName || user.email.split('@')[0];
            // Hiện controls user, ẩn guest
            userControls.classList.remove('hidden');
            userControls.classList.add('md:flex');
            mobileUserControls.classList.remove('hidden');
            mobileUserControls.classList.add('flex');

            guestControls.classList.add('hidden');
            mobileGuestControls.classList.add('hidden');

            // Cập nhật tên user
            userNameDisplay.textContent = displayName;
            mobileUserNameDisplay.textContent = displayName;

        } else {
            // Hiện controls guest, ẩn user
            guestControls.classList.remove('hidden');
            guestControls.classList.add('md:flex');
            mobileGuestControls.classList.remove('hidden');
            mobileGuestControls.classList.add('flex');

            userControls.classList.add('hidden');
            mobileUserControls.classList.add('hidden');
        }

        console.log("✅ UI xác thực đã được cập nhật.");
    });
}
