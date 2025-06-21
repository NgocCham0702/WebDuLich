// ===================================================================
// FILE LOGIC CHO TRANG ĐĂNG NHẬP (PHIÊN BẢN CÓ CHẨN ĐOÁN LỖI)
// ===================================================================

import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { auth, db } from './firebase-config.js'; 

const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

async function checkRoleAndRedirect(user) {
    if (!user) {
        console.error("LỖI LOGIC: Hàm checkRoleAndRedirect được gọi nhưng không có 'user'.");
        return;
    }
    
    console.log(`Bắt đầu kiểm tra vai trò cho người dùng có UID: ${user.uid}`);
    const userDocRef = doc(db, "users", user.uid);
    
    try {
        console.log(`🔍 Đang gửi yêu cầu đến Firestore để lấy document tại: users/${user.uid}`);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            console.log("✅ Yêu cầu thành công! Document người dùng TỒN TẠI.");
            console.log("Dữ liệu nhận được:", userDocSnap.data());
            
            const role = userDocSnap.data().role;
            if (role === 'admin') {
                console.log("🎉 Vai trò là 'admin'. Chuyển hướng đến trang Admin...");
                alert("Đăng nhập với tư cách Admin thành công!");
                window.location.href = '/client/admin/admin.html';
            } else {
                console.log(`Vai trò là '${role}'. Chuyển hướng đến trang User...`);
                alert("Đăng nhập thành công!");
                window.location.href = '/client/index.html';
            }
        } else {
            console.error(`❌ LỖI DỮ LIỆU: Document tại users/${user.uid} KHÔNG TỒN TẠI.`);
            alert("Đăng nhập thành công nhưng không tìm thấy thông tin vai trò của bạn trong hệ thống.");
            window.location.href = '/client/index.html';
        }
    } catch (error) {
        console.error("❌ LỖI HỆ THỐNG: Không thể truy vấn Firestore. Đây là lỗi về quyền (Security Rules) hoặc kết nối mạng.", error);
        alert("Lỗi nghiêm trọng: Không thể xác thực vai trò của bạn. Vui lòng kiểm tra Console (F12) để biết chi tiết.");
        window.location.href = '/client/index.html';
    }
}

if (loginForm) {
    loginForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) {
            alert("Vui lòng nhập đầy đủ email và mật khẩu.");
            return;
        }

        console.log(`Đang thử đăng nhập với email: ${email}`);
        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                console.log("✅ Xác thực Firebase Authentication thành công!");
                checkRoleAndRedirect(userCredential.user);
            })
            .catch((error) => {
                console.error("❌ Lỗi từ Firebase Authentication:", error.code);
                if (error.code === 'auth/invalid-credential') {
                    alert("Email hoặc mật khẩu không chính xác.");
                } else {
                    alert("Đã có lỗi xảy ra trong quá trình đăng nhập.");
                }
            });
    });
}