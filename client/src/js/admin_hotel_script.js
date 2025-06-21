// ===================================================================
// JAVASCRIPT FOR HOTEL ADMIN PANEL
// ===================================================================

// STEP 1: IMPORT CÁC MODULE CẦN THIẾT
// -------------------------------------------------------------------
// Đảm bảo đường dẫn đến file config của bạn là chính xác
import { db } from "./firebase-config.js"; 
import {
    collection,
    getDocs,
    addDoc,
    doc,
    getDoc,
    updateDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// STEP 2: LẤY CÁC THAM CHIẾU ĐẾN PHẦN TỬ DOM
// -------------------------------------------------------------------
// Nút và Bảng chính
const btnAddHotel = document.getElementById('btnAddHotel');
const hotelTableBody = document.querySelector('#hotelTable tbody');

// Modal và Form
const modal = document.getElementById('hotelFormModal');
const form = document.getElementById('hotelForm');
const formTitle = document.getElementById('formTitle');
const closeModalBtn = document.querySelector('.modal .close');
const btnCancel = document.getElementById('btnCancel');

// Các trường trong Form
const hotelIdInput = document.getElementById('hotelId');
const nameInput = document.getElementById('name');
const slugInput = document.getElementById('slug');
// ... (Tất cả các trường input khác) ...

// Vùng chứa phòng và nút thêm phòng
const roomsContainer = document.getElementById('roomsContainer');
const btnAddRoom = document.getElementById('btnAddRoom');

// Biến trạng thái để biết đang sửa hay thêm mới
let currentEditId = null;

// ===================================================================
// CÁC HÀM XỬ LÝ
// ===================================================================

// --- Hàm hiển thị/ẩn Modal ---
const toggleModal = (show) => {
    modal.style.display = show ? 'block' : 'none';
};

// --- Hàm tạo slug tự động từ tên ---
const generateSlug = (str) => {
    str = str.replace(/^\s+|\s+$/g, ''); // trim
    str = str.toLowerCase();

    // remove accents, swap ñ for n, etc
    const from = "àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ·/_,:;";
    const to   = "aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd------";
    for (let i = 0, l = from.length; i < l; i++) {
        str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
    }

    str = str.replace(/[^a-z0-9 -]/g, '') // remove invalid chars
             .replace(/\s+/g, '-') // collapse whitespace and replace by -
             .replace(/-+/g, '-'); // collapse dashes

    return str;
};

// --- Hàm reset form về trạng thái ban đầu ---
const resetForm = () => {
    form.reset();
    hotelIdInput.value = '';
    roomsContainer.innerHTML = ''; // Xóa hết các trường phòng đã thêm
    currentEditId = null;
    formTitle.textContent = 'Thêm khách sạn mới';
};

// --- Hàm render danh sách khách sạn ra bảng ---
const renderHotels = async () => {
    hotelTableBody.innerHTML = '<tr><td colspan="7">Đang tải dữ liệu...</td></tr>';
    let rowsHtml = '';
    try {
        const querySnapshot = await getDocs(collection(db, "hotels")); // Lấy collection 'hotels'
        
        if(querySnapshot.empty) {
            hotelTableBody.innerHTML = '<tr><td colspan="7">Chưa có khách sạn nào.</td></tr>';
            return;
        }

        querySnapshot.forEach((doc) => {
            const hotel = doc.data();
            const statusClass = hotel.isActive ? 'status-active' : 'status-inactive';
            const statusText = hotel.isActive ? 'Hoạt động' : 'Đã ẩn';
            
            rowsHtml += `
                <tr data-id="${doc.id}">
                    <td>${hotel.name}</td>
                    <td>${hotel.address}</td>
                    <td>${hotel.hotel_type_id || 'Chưa rõ'}</td>
                    <td>${hotel.rating} ⭐</td>
                    <td>${hotel.reviewCount}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td class="actions">
                        <button class="btn btn-edit">Sửa</button>
                        <button class="btn btn-delete">Xóa</button>
                    </td>
                </tr>
            `;
        });
        hotelTableBody.innerHTML = rowsHtml;
    } catch (error) {
        console.error("Lỗi khi tải danh sách khách sạn: ", error);
        hotelTableBody.innerHTML = '<tr><td colspan="7" style="color:red;">Lỗi tải dữ liệu.</td></tr>';
    }
};

// --- Hàm thêm một bộ trường nhập liệu cho phòng ---
const addRoomField = (room = {}) => {
    const roomDiv = document.createElement('div');
    roomDiv.classList.add('room-group');
    roomDiv.innerHTML = `
        <input type="text" class="room-name" placeholder="Tên loại phòng (vd: Deluxe)" value="${room.name || ''}" required>
        <input type="number" class="room-price" placeholder="Giá (VND)" value="${room.price || ''}" required>
        <input type="number" class="room-capacity" placeholder="Sức chứa (người)" value="${room.capacity || ''}" required>
        <button type="button" class="btn-remove-room">Xóa phòng</button>
    `;
    roomsContainer.appendChild(roomDiv);

    // Thêm sự kiện xóa cho phòng vừa tạo
    roomDiv.querySelector('.btn-remove-room').addEventListener('click', () => {
        roomDiv.remove();
    });
};

// --- Hàm mở Modal để sửa khách sạn ---
const openEditModal = async (id) => {
    resetForm();
    currentEditId = id;
    formTitle.textContent = 'Sửa thông tin khách sạn';

    try {
        const docRef = doc(db, "hotels", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            hotelIdInput.value = id;
            
            // Đổ dữ liệu vào các trường input
            for (const key in data) {
                const input = document.getElementById(key);
                if (input) {
                    // Xử lý các trường hợp đặc biệt
                    if (key === 'amenities' || key === 'imageUrls') {
                        input.value = Array.isArray(data[key]) ? data[key].join(', ') : '';
                    } else if (input.type === 'select-one') {
                         input.value = data[key].toString();
                    } else {
                        input.value = data[key];
                    }
                }
            }
            
            // Đổ dữ liệu phòng
            if (data.rooms && Array.isArray(data.rooms)) {
                data.rooms.forEach(room => addRoomField(room));
            }

            toggleModal(true);
        } else {
            console.log("Không tìm thấy khách sạn!");
            alert("Lỗi: Không tìm thấy khách sạn để sửa.");
        }
    } catch (error) {
        console.error("Lỗi khi lấy thông tin khách sạn: ", error);
        alert("Đã xảy ra lỗi khi tải dữ liệu.");
    }
};

// --- Hàm xử lý khi submit form (Thêm mới hoặc Cập nhật) ---
const handleFormSubmit = async (event) => {
    event.preventDefault();

    // Thu thập dữ liệu từ form
    const hotelData = {
        name: document.getElementById('name').value,
        slug: document.getElementById('slug').value,
        destination_id: document.getElementById('destination_id').value,
        hotel_type_id: document.getElementById('hotel_type_id').value,
        address: document.getElementById('address').value,
        location: {
            latitude: parseFloat(document.getElementById('latitude').value),
            longitude: parseFloat(document.getElementById('longitude').value)
        },
        contact: {
            phone: document.getElementById('phone').value,
            email: document.getElementById('email').value,
            website: document.getElementById('website').value
        },
        description: document.getElementById('description').value,
        amenities: document.getElementById('amenities').value.split(',').map(s => s.trim()).filter(s => s),
        imageUrls: document.getElementById('imageUrls').value.split(',').map(s => s.trim()).filter(s => s),
        rating: parseFloat(document.getElementById('rating').value),
        reviewCount: parseInt(document.getElementById('reviewCount').value, 10),
        policy: {
            checkinTime: document.getElementById('checkinTime').value,
            checkoutTime: document.getElementById('checkoutTime').value,
            cancellationPolicy: document.getElementById('cancellationPolicy').value,
            childrenPolicy: document.getElementById('childrenPolicy').value
        },
        isActive: document.getElementById('isActive').value === 'true',
        rooms: []
    };

    // Thu thập dữ liệu phòng
    document.querySelectorAll('.room-group').forEach(group => {
        hotelData.rooms.push({
            name: group.querySelector('.room-name').value,
            price: parseFloat(group.querySelector('.room-price').value),
            capacity: parseInt(group.querySelector('.room-capacity').value, 10)
        });
    });

    try {
        if (currentEditId) {
            // Cập nhật khách sạn đã có
            const docRef = doc(db, "hotels", currentEditId);
            await updateDoc(docRef, hotelData);
            alert('Cập nhật khách sạn thành công!');
        } else {
            // Thêm khách sạn mới
            await addDoc(collection(db, "hotels"), hotelData);
            alert('Thêm khách sạn mới thành công!');
        }
        toggleModal(false);
        renderHotels(); // Tải lại bảng
    } catch (error) {
        console.error("Lỗi khi lưu khách sạn: ", error);
        alert('Đã xảy ra lỗi khi lưu. Vui lòng thử lại.');
    }
};

// --- Hàm xử lý xóa khách sạn ---
const handleDeleteHotel = async (id) => {
    if (!confirm('Bạn có chắc chắn muốn xóa khách sạn này? Hành động này không thể hoàn tác.')) {
        return;
    }

    try {
        await deleteDoc(doc(db, "hotels", id));
        alert('Xóa khách sạn thành công!');
        renderHotels();
    } catch (error) {
        console.error("Lỗi khi xóa khách sạn: ", error);
        alert('Đã xảy ra lỗi khi xóa.');
    }
};

// ===================================================================
// GẮN CÁC SỰ KIỆN
// ===================================================================

// Tải dữ liệu lần đầu khi trang được mở
document.addEventListener('DOMContentLoaded', () => {
    renderHotels(); // Hàm này vẫn giữ nguyên
    
    // GỌI HÀM MỚI Ở ĐÂY
    // Giả sử collection 'destinations' có trường tên là 'name'
    populateDropdown('destination_id', 'destinations', 'name'); 
    
    // Giả sử collection 'hotel_types' có trường tên là 'type_name'
    populateDropdown('hotel_type_id', 'hotel_types', 'type_name'); 
});
// Sự kiện mở modal để thêm mới
btnAddHotel.addEventListener('click', () => {
    resetForm();
    toggleModal(true);
});

// Sự kiện đóng modal
closeModalBtn.addEventListener('click', () => toggleModal(false));
btnCancel.addEventListener('click', () => toggleModal(false));
window.addEventListener('click', (event) => {
    if (event.target == modal) {
        toggleModal(false);
    }
});

// Sự kiện submit form
form.addEventListener('submit', handleFormSubmit);

// Sự kiện cho các nút trong bảng (Sửa, Xóa) - Sử dụng event delegation
hotelTableBody.addEventListener('click', (event) => {
    const target = event.target;
    const row = target.closest('tr');
    if (!row) return;

    const id = row.dataset.id;
    if (target.classList.contains('btn-edit')) {
        openEditModal(id);
    } else if (target.classList.contains('btn-delete')) {
        handleDeleteHotel(id);
    }
});

// Sự kiện tự động tạo slug
nameInput.addEventListener('input', () => {
    slugInput.value = generateSlug(nameInput.value);
});

// Sự kiện thêm trường nhập liệu cho phòng
btnAddRoom.addEventListener('click', () => addRoomField());
// --- HÀM MỚI: Đổ dữ liệu từ một collection vào ô select ---
const populateDropdown = async (elementId, collectionName, textField) => {
    const selectElement = document.getElementById(elementId);
    selectElement.innerHTML = `<option value="" disabled selected>-- Chọn một mục --</option>`; // Reset và thêm option mặc định

    try {
        const querySnapshot = await getDocs(collection(db, collectionName));
        querySnapshot.forEach((doc) => {
            const option = document.createElement('option');
            option.value = doc.id; // Giá trị là ID của document
            option.textContent = doc.data()[textField]; // Chữ hiển thị là tên
            selectElement.appendChild(option);
        });
    } catch (error) {
        console.error(`Lỗi khi tải ${collectionName}:`, error);
        selectElement.innerHTML = `<option value="" disabled selected>-- Lỗi tải dữ liệu --</option>`;
    }
};