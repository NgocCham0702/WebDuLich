// ===================================================================
// FILE CẤU HÌNH FIREBASE TRUNG TÂM (PHIÊN BẢN CHỐNG LỖI VÒNG LẶP)
// ===================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCUPqDb_xFs_-_LhwGHFKErug4F-gtM_EQ",
    authDomain: "webdulich-ff78a.firebaseapp.com",
    projectId: "webdulich-ff78a",
    storageBucket: "webdulich-ff78a.appspot.com",
    messagingSenderId: "436989427291",
    appId: "1:436989427291:web:dc670a5b6b11710b75097e",
    measurementId: "G-LWGN05J15Q"
};

// Khởi tạo App và các dịch vụ
const app = initializeApp(firebaseConfig);
// Thêm vào dòng import
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js";

// Thêm vào dòng export
export const analytics = getAnalytics(app);

// Chỉ export, không import bất cứ gì khác từ bên ngoài
export const db = getFirestore(app);
export const auth = getAuth(app);

