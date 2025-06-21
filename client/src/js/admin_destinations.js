// =================================================================
// TỔNG QUAN FILE JAVASCRIPT QUẢN LÝ ĐỊA ĐIỂM
// =================================================================

// --- NHẬP KHẨU CÁC THƯ VIỆN CẦN THIẾT ---
import { db, auth } from './firebase-config.js'; // Luôn import file config đầu tiên
import { 
    collection, getDocs, getDoc, doc, 
    addDoc, updateDoc, deleteDoc, 
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { 
    getStorage, ref, uploadBytes, getDownloadURL 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// --- KHỞI TẠO CÁC DỊCH VỤ PHỤ ---
const storage = getStorage(); // Khởi tạo Firebase Storage

// =================================================================
// BỘ ĐỊNH TUYẾN PHÍA CLIENT (CLIENT-SIDE ROUTER) ĐƠN GIẢN
// =================================================================
// Kiểm tra xem chúng ta đang ở trang nào để gọi đúng hàm
document.addEventListener('DOMContentLoaded', () => {
    // Luồng xác thực chung cho tất cả các trang admin
    onAuthStateChanged(auth, user => {
        if (!user) {
            console.log("Chưa đăng nhập, chuyển hướng...");
            window.location.href = '/client/User/dangnhap.html';
            return;
        }

        // Kiểm tra quyền admin
        const userDocRef = doc(db, 'users', user.uid);
        getDoc(userDocRef).then(userDocSnap => {
            if (userDocSnap.exists() && userDocSnap.data().role === 'admin') {
                // Nếu là admin, chạy logic của trang hiện tại
                route();
            } else {
                alert("Bạn không có quyền truy cập trang quản trị!");
                window.location.href = '/client/index.html';
            }
        });
    });

    // Hàm định tuyến
    function route() {
        // Nếu tìm thấy bảng danh sách địa điểm, ta đang ở trang list
        if (document.getElementById('destinations-table-body')) {
            initDestinationsListPage();
        }
        // Nếu tìm thấy form, ta đang ở trang form
        else if (document.getElementById('destination-form')) {
            initDestinationFormPage();
        }
    }
});

// =================================================================
// LOGIC CHO TRANG DANH SÁCH (admin_destinations.html)
// =================================================================
function initDestinationsListPage() {
    const tableBody = document.getElementById('destinations-table-body');

    // Tải và hiển thị danh sách
    async function loadDestinations() {
        tableBody.innerHTML = '<tr><td colspan="4">Đang tải...</td></tr>';
        try {
            const querySnapshot = await getDocs(collection(db, 'destinations'));
            tableBody.innerHTML = '';
            if (querySnapshot.empty) {
                tableBody.innerHTML = '<tr><td colspan="4">Không có địa điểm nào.</td></tr>';
                return;
            }
            querySnapshot.forEach(docSnap => {
                const data = docSnap.data();
                const id = docSnap.id;
                const imageUrl = data.imageUrl || 'https://via.placeholder.com/100x60.png?text=N/A';
                const row = `
                    <tr>
                        <td><img src="${imageUrl}" alt="${data.name}" class="table-image"></td>
                        <td>${data.name || 'N/A'}</td>
                        <td>${data.location || 'N/A'}</td>
                        <td class="action-buttons">
                            <a href="admin_destination_form.html?id=${id}" class="btn btn-sm btn-warning"><i class="fas fa-edit"></i> Sửa</a>
                            <button class="btn btn-sm btn-danger delete-btn" data-id="${id}" data-name="${data.name}"><i class="fas fa-trash"></i> Xóa</button>
                        </td>
                    </tr>
                `;
                tableBody.insertAdjacentHTML('beforeend', row);
            });
        } catch (error) {
            console.error("Lỗi tải địa điểm: ", error);
            tableBody.innerHTML = '<tr><td colspan="4">Lỗi khi tải dữ liệu.</td></tr>';
        }
    }

    // Xử lý sự kiện xóa
    tableBody.addEventListener('click', async (e) => {
        const deleteButton = e.target.closest('.delete-btn');
        if (deleteButton) {
            const id = deleteButton.dataset.id;
            const name = deleteButton.dataset.name;
            if (confirm(`Bạn có chắc muốn xóa "${name}"?`)) {
                try {
                    await deleteDoc(doc(db, 'destinations', id));
                    alert('Xóa thành công!');
                    loadDestinations(); // Tải lại danh sách
                } catch (error) {
                    console.error("Lỗi khi xóa: ", error);
                    alert('Xóa thất bại. Vui lòng thử lại.');
                }
            }
        }
    });

    // Chạy hàm tải lần đầu
    loadDestinations();
}


// =================================================================
// LOGIC CHO TRANG FORM (admin_destination_form.html)
// =================================================================
// =================================================================
// LOGIC CHO TRANG FORM (admin_destination_form.html) - PHIÊN BẢN 2 TRONG 1
// =================================================================
function initDestinationFormPage() {
    // --- Lấy các element từ DOM ---
    const form = document.getElementById('destination-form');
    const formTitle = document.getElementById('form-title');
    const submitBtn = document.getElementById('submit-btn');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('image-preview');
    
    // Các element mới cho việc chọn nguồn ảnh
    const imageSourceRadios = document.querySelectorAll('input[name="imageSource"]');
    const uploadContainer = document.getElementById('upload-container');
    const urlContainer = document.getElementById('url-container');
    const imageUrlInput = document.getElementById('imageUrl');
    const imageFileInput = document.getElementById('image');

    // Lấy ID từ URL để xác định là "Thêm" hay "Sửa"
    const urlParams = new URLSearchParams(window.location.search);
    const destinationId = urlParams.get('id');
    const isEditMode = !!destinationId;
// 2. Nếu isEditMode là true, đây là chế độ SỬA
    if (isEditMode) {
        // Thay đổi tiêu đề và nút bấm
        document.getElementById('form-title').textContent = 'Chỉnh Sửa Địa Điểm';
        document.getElementById('submit-btn').innerHTML = '<i class="fas fa-save"></i> Cập Nhật';

        // 3. Tải dữ liệu của địa điểm này từ Firestore
        getDoc(doc(db, 'destinations', destinationId)).then(docSnap => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                
                // 4. Điền dữ liệu đã tải vào các ô input
                form.name.value = data.name || '';
                form.location.value = data.location || '';
                form.description.value = data.description || '';
                if (data.imageUrl) {
                    document.getElementById('image-preview-container').style.display = 'block';
                    document.getElementById('image-preview').src = data.imageUrl;
                    document.getElementById('imageUrl').value = data.imageUrl;
                }
            } else {
                alert('Không tìm thấy địa điểm!');
                window.location.href = 'admin_destinations.html';
            }
        });
    }

    // 5. Trong hàm submit, kiểm tra lại isEditMode
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        // ... lấy dữ liệu từ form ...
        
        const dataToSave = { /* ... */ };

        if (isEditMode) {
            // Chế độ sửa: Dùng updateDoc
            await updateDoc(doc(db, 'destinations', destinationId), dataToSave);
            alert('Cập nhật địa điểm thành công!');
        } else {
            // Chế độ thêm: Dùng addDoc
            await addDoc(collection(db, 'destinations'), dataToSave);
            alert('Thêm địa điểm mới thành công!');
        }
        
        window.location.href = 'admin_destinations.html';
    });
}
// =================================================================
// LOGIC CHUNG (VD: Đăng xuất)
// =================================================================
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        signOut(auth).then(() => {
            console.log("Đăng xuất thành công.");
            window.location.href = '/client/User/dangnhap.html';
        });
    });
}