// ===================================================================
// JAVASCRIPT FOR DESTINATIONS ADMIN PANEL
// ===================================================================

// STEP 1: IMPORT
import { db } from "./firebase-config.js"; // Sửa đường dẫn nếu cần
import {
    collection,
    getDocs,
    addDoc,
    doc,
    getDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// STEP 2: DOM REFERENCES
const btnAddDestination = document.getElementById('btnAddDestination');
const tableBody = document.querySelector('#destinationTable tbody');
const modal = document.getElementById('destinationFormModal');
const form = document.getElementById('destinationForm');
const formTitle = document.getElementById('formTitle');
const closeModalBtn = document.querySelector('.modal .close');
const btnCancel = document.querySelector('.btn-cancel');
const nameInput = document.getElementById('name');
const slugInput = document.getElementById('slug');

let currentEditId = null;

// STEP 3: HELPER FUNCTIONS
const toggleModal = (show) => modal.style.display = show ? 'block' : 'none';
const generateSlug = (str) => str.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
const resetForm = () => {
    form.reset();
    currentEditId = null;
    formTitle.textContent = 'Thêm Địa điểm';
    document.getElementById('imagePreviewContainer').innerHTML = ''; // THÊM DÒNG NÀY

};
// --- Thêm một hàm mới để xử lý xem trước ảnh ---
const updateImagePreview = () => {
    const imageUrlsInput = document.getElementById('imageUrls');
    const previewContainer = document.getElementById('imagePreviewContainer');

    // Xóa các ảnh xem trước cũ
    previewContainer.innerHTML = '';

    // Lấy các URL từ ô input
    const urls = imageUrlsInput.value.split(',').map(url => url.trim()).filter(Boolean);

    if (urls.length > 0) {
        urls.forEach((url, index) => {
            const imgWrapper = document.createElement('div');
            imgWrapper.className = 'preview-image-wrapper';

            const img = document.createElement('img');
            img.src = url;
            // Xử lý nếu URL ảnh bị lỗi
            img.onerror = () => {
                img.src = 'https://via.placeholder.com/150x100.png?text=Invalid+URL';
            };

            imgWrapper.appendChild(img);

            // Đánh dấu ảnh đầu tiên là ảnh bìa
            if (index === 0) {
                const bannerTag = document.createElement('span');
                bannerTag.className = 'preview-banner-tag';
                bannerTag.textContent = 'Ảnh bìa';
                imgWrapper.appendChild(bannerTag);
            }

            previewContainer.appendChild(imgWrapper);
        });
    }
};
// STEP 4: CORE FUNCTIONS

// --- Render danh sách địa điểm ra bảng ---
const renderDestinations = async () => {
    tableBody.innerHTML = '<tr><td colspan="5">Đang tải...</td></tr>';
    let html = '';
    try {
        const querySnapshot = await getDocs(collection(db, "destinations"));
        if (querySnapshot.empty) {
            tableBody.innerHTML = '<tr><td colspan="5">Chưa có địa điểm nào.</td></tr>';
            return;
        }
        querySnapshot.forEach((doc) => {
            const dest = doc.data();
            // Lấy URL ảnh đầu tiên, nếu không có thì dùng ảnh placeholder
            const thumbnailUrl = dest.imageUrls && dest.imageUrls.length > 0
                ? dest.imageUrls[0]
                : 'https://haycafe.vn/wp-content/uploads/2022/06/hinh-nen-vo-dien-de-thuong.jpg';

            html += `
                 <tr data-id="${doc.id}">
                    <td><img src="${thumbnailUrl}" alt="Ảnh bìa ${dest.name}" class="table-thumbnail"></td>
                    <td><strong>${dest.name}</strong></td>
                    <td>${dest.location}</td>
                    <td><span class="status-badge ${dest.isActive ? 'status-active' : 'status-inactive'}">${dest.isActive ? 'Hoạt động' : 'Đã ẩn'}</span></td>
                    <td class="actions">
                        <button class="btn btn-edit">Sửa</button>
                        <button class="btn btn-delete">Xóa</button>
                    </td>
                </tr>
            `;
        });
        tableBody.innerHTML = html;
    } catch (error) {
        console.error("Lỗi tải địa điểm:", error);
        tableBody.innerHTML = '<tr><td colspan="5" style="color:red;">Lỗi tải dữ liệu.</td></tr>';
    }
};

// --- Mở modal để sửa ---
const openEditModal = async (id) => {
    resetForm();
    currentEditId = id;
    formTitle.textContent = 'Sửa thông tin Địa điểm';
    try {
        const docRef = doc(db, "destinations", id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            alert("Lỗi: Không tìm thấy địa điểm!");
            return;
        }
        const data = docSnap.data();

        // Đổ dữ liệu vào form
        document.getElementById('destinationId').value = id;
        nameInput.value = data.name || '';
        slugInput.value = data.slug || '';
        document.getElementById('title').value = data.title || '';
        document.getElementById('slogan').value = data.slogan || '';

        // Dữ liệu lồng nhau
        document.getElementById('intro_heading').value = data.introduction?.heading || '';
        document.getElementById('intro_content').value = data.introduction?.content || '';

        document.getElementById('attractions_heading').value = data.attractions?.heading || '';
        document.getElementById('attractions_list').value = data.attractions?.list?.join(', ') || '';

        document.getElementById('cuisine_heading').value = data.cuisine?.heading || '';
        document.getElementById('cuisine_content').value = data.cuisine?.content || '';

        document.getElementById('best_time_heading').value = data.bestTimeToVisit?.heading || '';
        document.getElementById('best_time_content').value = data.bestTimeToVisit?.content || '';

        // Dữ liệu mảng
        document.getElementById('imageUrls').value = data.imageUrls?.join(', ') || '';
        document.getElementById('tags').value = data.tags?.join(', ') || '';

        document.getElementById('location').value = data.location || '';
        document.getElementById('isActive').value = data.isActive.toString();

        toggleModal(true);
        updateImagePreview(); // GỌI HÀM Ở ĐÂY

    } catch (error) {
        console.error("Lỗi lấy thông tin địa điểm:", error);
    }
};

// --- Xử lý submit form (Thêm/Sửa) ---
const handleFormSubmit = async (e) => {
    e.preventDefault();
    const destinationData = {
        name: nameInput.value,
        slug: slugInput.value,
        title: document.getElementById('title').value,
        slogan: document.getElementById('slogan').value,
        introduction: {
            heading: document.getElementById('intro_heading').value,
            content: document.getElementById('intro_content').value
        },
        attractions: {
            heading: document.getElementById('attractions_heading').value,
            list: document.getElementById('attractions_list').value.split(',').map(s => s.trim()).filter(Boolean)
        },
        cuisine: {
            heading: document.getElementById('cuisine_heading').value,
            content: document.getElementById('cuisine_content').value
        },
        bestTimeToVisit: {
            heading: document.getElementById('best_time_heading').value,
            content: document.getElementById('best_time_content').value
        },
        imageUrls: document.getElementById('imageUrls').value.split(',').map(s => s.trim()).filter(Boolean),
        tags: document.getElementById('tags').value.split(',').map(s => s.trim()).filter(Boolean),
        location: document.getElementById('location').value,
        isActive: document.getElementById('isActive').value === 'true',
        updatedAt: serverTimestamp() // Luôn cập nhật thời gian sửa
    };

    try {
        if (currentEditId) {
            // Cập nhật
            const docRef = doc(db, "destinations", currentEditId);
            await updateDoc(docRef, destinationData);
            alert('Cập nhật thành công!');
        } else {
            // Thêm mới
            destinationData.createdAt = serverTimestamp(); // Chỉ thêm thời gian tạo khi thêm mới
            await addDoc(collection(db, "destinations"), destinationData);
            alert('Thêm mới thành công!');
        }
        toggleModal(false);
        renderDestinations();
    } catch (error) {
        console.error("Lỗi khi lưu:", error);
        alert('Lỗi khi lưu dữ liệu.');
    }
};

// --- Xóa địa điểm ---
const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc chắn muốn xóa địa điểm này?')) return;
    try {
        await deleteDoc(doc(db, "destinations", id));
        alert('Xóa thành công!');
        renderDestinations();
    } catch (error) {
        console.error("Lỗi khi xóa:", error);
        alert('Lỗi khi xóa dữ liệu.');
    }
};

// STEP 5: EVENT LISTENERS
document.addEventListener('DOMContentLoaded', renderDestinations);
const imageUrlsInput = document.getElementById('imageUrls');
imageUrlsInput.addEventListener('input', updateImagePreview);
btnAddDestination.addEventListener('click', () => {
    resetForm();
    toggleModal(true);
});
nameInput.addEventListener('input', () => slugInput.value = generateSlug(nameInput.value));
closeModalBtn.addEventListener('click', () => toggleModal(false));
btnCancel.addEventListener('click', () => toggleModal(false));
form.addEventListener('submit', handleFormSubmit);

tableBody.addEventListener('click', (e) => {
    const target = e.target;
    const row = target.closest('tr');
    if (!row) return;
    const id = row.dataset.id;
    if (target.classList.contains('btn-edit')) {
        openEditModal(id);
    }
    if (target.classList.contains('btn-delete')) {
        handleDelete(id);
    }
});
