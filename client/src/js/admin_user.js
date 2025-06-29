// Import các thành phần cần thiết từ config và Firebase SDK
import { db, auth } from './firebase-config.js';
import {
    collection,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Lấy các element từ DOM
const usersTableBody = document.getElementById('users-table-body');
const logoutBtn = document.getElementById('logout-btn');

/**
 * =================================================================
 * 1. KIỂM TRA XÁC THỰC VÀ QUYỀN ADMIN
 * =================================================================
 * Đây là bước quan trọng nhất để bảo vệ trang admin.
 */
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Người dùng đã đăng nhập, kiểm tra xem có phải admin không
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists() && userDocSnap.data().role === 'admin') {
            // Là admin, cho phép truy cập và tải dữ liệu
            console.log("Admin đã đăng nhập:", user.email);
            loadUsers();
        } else {
            // Không phải admin, chuyển hướng về trang chủ hoặc trang đăng nhập
            alert("Bạn không có quyền truy cập trang này!");
            window.location.href = '/client/index.html'; // Hoặc trang đăng nhập
        }
    } else {
        // Người dùng chưa đăng nhập, chuyển hướng về trang đăng nhập
        console.log("Chưa đăng nhập.");
        window.location.href = '/client/User/dangnhap.html'; // Thay bằng trang đăng nhập của bạn
    }
});

/**
 * =================================================================
 * 2. TẢI VÀ HIỂN THỊ DANH SÁCH NGƯỜI DÙNG
 * =================================================================
 */
async function loadUsers() {
    usersTableBody.innerHTML = '<tr><td colspan="4">Đang tải dữ liệu...</td></tr>';

    try {
        const usersCollection = collection(db, 'users');
        const querySnapshot = await getDocs(usersCollection);

        // Xóa nội dung "Đang tải"
        usersTableBody.innerHTML = '';

        if (querySnapshot.empty) {
            usersTableBody.innerHTML = '<tr><td colspan="4">Không có người dùng nào.</td></tr>';
            return;
        }

        querySnapshot.forEach(doc => {
            const userData = doc.data();
            const userId = doc.id; // Lấy UID của user

            // Format ngày tham gia
            const joinDate = userData.created_at?.toDate().toLocaleDateString('vi-VN') || 'Không rõ';

            const row = `
                <tr>
                    <td>${userData.email || 'Không có email'}</td>
                    <td>${userData.role || 'user'}</td>
                    <td>${joinDate}</td>
                    <td class="action-buttons">
                        <button class="btn btn-sm btn-warning edit-btn" data-id="${userId}" data-current-role="${userData.role}">
                            <i class="fas fa-edit"></i> Sửa Vai Trò
                        </button>
                        <button class="btn btn-sm btn-danger delete-btn" data-id="${userId}">
                            <i class="fas fa-trash"></i> Xóa
                        </button>
                    </td>
                </tr>
            `;
            usersTableBody.insertAdjacentHTML('beforeend', row);
        });

    } catch (error) {
        console.error("Lỗi khi tải danh sách người dùng: ", error);
        usersTableBody.innerHTML = '<tr><td colspan="4">Có lỗi xảy ra khi tải dữ liệu.</td></tr>';
    }
}


/**
 * =================================================================
 * 3. XỬ LÝ CÁC HÀNH ĐỘNG (SỬA, XÓA)
 * =================================================================
 * Sử dụng event delegation để bắt sự kiện click trên toàn bộ table body
 */
usersTableBody.addEventListener('click', (e) => {
    const target = e.target;

    // Kiểm tra xem có phải nút Sửa không
    if (target.closest('.edit-btn')) {
        const btn = target.closest('.edit-btn');
        const userId = btn.dataset.id;
        const currentRole = btn.dataset.currentRole;
        handleEditRole(userId, currentRole);
    }

    // Kiểm tra xem có phải nút Xóa không
    if (target.closest('.delete-btn')) {
        const btn = target.closest('.delete-btn');
        const userId = btn.dataset.id;
        handleDeleteUser(userId);
    }
});

async function handleEditRole(userId, currentRole) {
    const newRole = prompt(`Nhập vai trò mới cho người dùng (hiện tại: ${currentRole}).\nChấp nhận: 'user' hoặc 'admin'`, currentRole);

    if (newRole && (newRole === 'user' || newRole === 'admin')) {
        if (confirm(`Bạn có chắc muốn đổi vai trò của người dùng này thành '${newRole}'?`)) {
            try {
                const userDocRef = doc(db, 'users', userId);
                await updateDoc(userDocRef, {
                    role: newRole
                });
                alert("Cập nhật vai trò thành công!");
                loadUsers(); // Tải lại danh sách để hiển thị thay đổi
            } catch (error) {
                console.error("Lỗi khi cập nhật vai trò: ", error);
                alert("Đã xảy ra lỗi khi cập nhật.");
            }
        }
    } else if (newRole !== null) { // Người dùng nhập gì đó nhưng không hợp lệ
        alert("Vai trò không hợp lệ. Vui lòng chỉ nhập 'user' hoặc 'admin'.");
    }
}

async function handleDeleteUser(userId) {
    if (confirm("Bạn có chắc chắn muốn xóa người dùng này khỏi Firestore?\nLƯU Ý: Hành động này không xóa người dùng khỏi hệ thống Authentication của Firebase.")) {
        try {
            await deleteDoc(doc(db, 'users', userId));
            alert("Xóa thông tin người dùng thành công!");
            loadUsers(); // Tải lại danh sách
        } catch (error) {
            console.error("Lỗi khi xóa người dùng: ", error);
            alert("Đã xảy ra lỗi khi xóa.");
        }
    }
}

/**
 * =================================================================
 * 4. XỬ LÝ ĐĂNG XUẤT
 * =================================================================
 */
logoutBtn.addEventListener('click', () => {
    signOut(auth).then(() => {
        console.log("Đăng xuất thành công.");
        window.location.href = '/client/User/dangnhap.html'; // Chuyển về trang đăng nhập
    }).catch((error) => {
        console.error("Lỗi đăng xuất: ", error);
    });
});