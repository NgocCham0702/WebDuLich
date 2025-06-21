// file: forgot-password.js

// Import auth từ file cấu hình chung của bạn
import { auth } from '../js/firebase-config.js'; 
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Lấy các element từ DOM
const forgotPasswordForm = document.getElementById('forgot-password-form');
const emailInput = document.getElementById('email');
const messageDiv = document.getElementById('message');
const submitButton = forgotPasswordForm.querySelector('button');

forgotPasswordForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = emailInput.value;

    // Vô hiệu hóa nút để tránh click nhiều lần
    submitButton.disabled = true;
    submitButton.textContent = 'Đang gửi...';
    messageDiv.textContent = '';

    sendPasswordResetEmail(auth, email)
        .then(() => {
            // Gửi email thành công
            messageDiv.style.color = 'green';
            messageDiv.textContent = 'Gửi thành công! Vui lòng kiểm tra hộp thư của bạn (bao gồm cả thư mục spam) để nhận link đặt lại mật khẩu.';
            // Không cần bật lại nút nữa vì người dùng đã xong việc
        })
        .catch((error) => {
            // Xử lý lỗi
            console.error("Lỗi gửi email reset:", error);
            messageDiv.style.color = 'red';
            if (error.code === 'auth/user-not-found') {
                messageDiv.textContent = 'Lỗi: Không tìm thấy người dùng nào với địa chỉ email này.';
            } else {
                messageDiv.textContent = 'Đã có lỗi xảy ra. Vui lòng thử lại.';
            }
            // Bật lại nút nếu có lỗi
            submitButton.disabled = false;
            submitButton.textContent = 'Gửi Link Reset';
        });
});