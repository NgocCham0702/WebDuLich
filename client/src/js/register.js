// ===================================================================
// BẮT ĐẦU CODE ĐĂNG KÝ - ĐÃ NÂNG CẤP
// ===================================================================

// Import các hàm cần thiết
// Sử dụng file config trung tâm để không phải lặp lại
import { auth, db } from './firebase-config.js'; // <<< Đảm bảo đường dẫn này đúng!
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Lấy các phần tử từ HTML
const createAccountButton = document.getElementById('btn-create-account');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

// Gắn sự kiện click cho nút
if (createAccountButton) {
    createAccountButton.addEventListener("click", function (event) {
        event.preventDefault();

        const email = emailInput.value;
        const password = passwordInput.value;

        if (!email || !password) {
            alert("Vui lòng nhập đầy đủ email và mật khẩu.");
            return;
        }

        console.log("Đang thử tạo tài khoản với:", email);

        // Bắt đầu quá trình tạo tài khoản
        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // Đăng ký thành công trong Authentication
                const user = userCredential.user;
                console.log("Tài khoản đã được tạo trong Authentication:", user);

                // --- BƯỚC NÂNG CẤP QUAN TRỌNG ---
                // Tự động tạo hồ sơ vai trò trong Firestore cho người dùng mới
                console.log("Đang tạo hồ sơ vai trò trong Firestore...");

                // Tạo một tham chiếu đến document mới trong collection 'users'
                // với Document ID chính là UID của người dùng
                const userDocRef = doc(db, "users", user.uid);

                // Ghi dữ liệu vào document đó
                // setDoc sẽ tạo mới nếu chưa có, hoặc ghi đè nếu đã có
                return setDoc(userDocRef, {
                    email: user.email, // Lưu lại email để dễ quản lý
                    role: 'user',      // Gán vai trò mặc định là 'user'
                    created_at: new Date() // Lưu lại ngày tạo tài khoản
                });
            })
            .then(() => {
                // Bước này chỉ chạy sau khi setDoc thành công
                console.log("Hồ sơ vai trò đã được tạo thành công!");
                alert("Tạo tài khoản thành công! Bạn sẽ được chuyển đến trang đăng nhập.");
                
                // Chuyển hướng người dùng đến trang đăng nhập
                window.location.href = "/client/User/dangnhap.html"; // <<< Đảm bảo đường dẫn này đúng
            })
            .catch((error) => {
                // Xử lý tất cả các lỗi (cả lỗi tạo tài khoản và lỗi ghi vào Firestore)
                const errorCode = error.code;
                const errorMessage = error.message;
                console.error("Lỗi trong quá trình đăng ký:", errorCode, errorMessage);
                
                if (errorCode === 'auth/email-already-in-use') {
                    alert("Email này đã được sử dụng. Vui lòng chọn email khác.");
                } else if (errorCode === 'auth/weak-password') {
                    alert("Mật khẩu quá yếu. Mật khẩu phải có ít nhất 6 ký tự.");
                } else {
                    // Lỗi chung
                    alert("Đã có lỗi xảy ra: " + errorMessage);
                }
            });
    });
} else {
    console.error("Không tìm thấy nút 'Tạo tài khoản'!");
}

// ===================================================================
// KẾT THÚC CODE ĐĂNG KÝ
// ===================================================================