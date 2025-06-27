import { db, auth } from './firebase-config.js';
import { collection, getDocs, getDoc, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// BỘ ĐỊNH TUYẾN
document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, user => {
        if (!user) { window.location.href = '/client/User/dangnhap.html'; return; }
        getDoc(doc(db, 'users', user.uid)).then(userDoc => {
            if (userDoc.exists() && userDoc.data().role === 'admin') {
                document.getElementById('logout-btn').addEventListener('click', () => signOut(auth));
                if (document.getElementById('bookings-table-body')) initBookingsListPage();
                else if (document.getElementById('booking-form')) initBookingFormPage();
            } else {
                alert("Bạn không có quyền truy cập!");
                window.location.href = '/client/index.html';
            }
        });
    });
});

// TRANG DANH SÁCH - PHIÊN BẢN ĐÃ CÓ NÚT HÀNH ĐỘNG
async function initBookingsListPage() {
    const tableBody = document.getElementById('bookings-table-body');

    const loadBookings = async () => {
        tableBody.innerHTML = `<tr><td colspan="6">Đang tải...</td></tr>`;
        try {
            const querySnapshot = await getDocs(collection(db, "bookings"));
            tableBody.innerHTML = "";
            if (querySnapshot.empty) {
                tableBody.innerHTML = `<tr><td colspan="6">Không có đơn đặt phòng nào.</td></tr>`;
                return;
            }
            querySnapshot.forEach(docSnap => {
                const data = docSnap.data();
                const id = docSnap.id;
                const checkin = data.checkinDate?.toDate().toLocaleDateString('vi-VN') || 'N/A';
                const checkout = data.checkoutDate?.toDate().toLocaleDateString('vi-VN') || 'N/A';

                // *** THAY ĐỔI QUAN TRỌNG Ở ĐÂY ***
                // Đã thêm cột "Hành Động" với các nút Sửa và Xóa
                const row = `
                    <tr>
                        <td>
                            <div><strong>${data.customerName || 'N/A'}</strong></div>
                            <small>${data.customerEmail || ''}</small>
                        </td>
                        <td>${data.hotelName || 'N/A'}</td>
                        <td>${checkin} - ${checkout}</td>
                        <td>${(data.totalPrice || 0).toLocaleString('vi-VN')}₫</td>
                        <td><span class="status status-${data.status || 'pending'}">${data.status || 'pending'}</span></td>
                        <td class="action-buttons">
  <a href="admin_booking_form.html?id=${id}" class=" btn-xanh">
    <i class="fas fa-edit"></i> Sửa
  </a>
  <button class="btn btn-sm btn-danger delete-btn" data-id="${id}" data-name="${data.customerName}">
    <i class="fas fa-trash"></i> Xóa
  </button>
</td>

                    </tr>
                `;
                tableBody.insertAdjacentHTML('beforeend', row);
            });
        } catch (error) {
            console.error("Lỗi khi tải danh sách đặt phòng:", error);
            tableBody.innerHTML = `<tr><td colspan="6">Có lỗi xảy ra khi tải dữ liệu.</td></tr>`;
        }
    };

    // *** THÊM MỚI EVENT LISTENER CHO NÚT XÓA ***
    tableBody.addEventListener('click', async e => {
        const deleteButton = e.target.closest('.delete-btn');
        if (deleteButton) {
            const bookingId = deleteButton.dataset.id;
            const customerName = deleteButton.dataset.name || "khách hàng này";

            if (confirm(`Bạn có chắc chắn muốn xóa đơn đặt phòng của ${customerName}?`)) {
                try {
                    await deleteDoc(doc(db, 'bookings', bookingId));
                    alert('Xóa đơn đặt phòng thành công!');
                    loadBookings(); // Tải lại danh sách để cập nhật giao diện
                } catch (error) {
                    console.error("Lỗi khi xóa đơn đặt phòng:", error);
                    alert("Đã xảy ra lỗi khi xóa.");
                }
            }
        }
    });

    // Tải danh sách lần đầu
    loadBookings();
}

// TRANG FORM
function initBookingFormPage() {
    // --- Dữ liệu và elements cho dropdown động ---
    const hotelsData = { "Giá Rẻ": [{ name: "Khách Sạn Hoa Hồng", priceFactor: 0.0, allowedRooms: ["Đơn", "Đôi"] }, { name: "Khách Sạn Bình Minh", priceFactor: 0.05, allowedRooms: ["Đơn", "Đôi"] }], "Tầm Trung": [{ name: "Khách Sạn Ngọc Lan", priceFactor: 0.0, allowedRooms: ["Đơn", "Đôi"] }, { name: "Khách Sạn Phương Đông", priceFactor: 0.07, allowedRooms: ["Đơn", "Đôi"] }], "Hiện Đại": [{ name: "Khách Sạn Mặt Trời", priceFactor: 0.0, allowedRooms: ["Đơn", "Đôi", "Suite", "Gia Đình"] }, { name: "Khách Sạn Thiên Đường", priceFactor: 0.06, allowedRooms: ["Đơn", "Đôi", "Suite", "Gia Đình"] }], "Sang Trọng": [{ name: "Khách Sạn Hoàng Gia", priceFactor: 0.0, allowedRooms: ["Đơn", "Đôi", "Suite", "Gia Đình"] }, { name: "Khách Sạn Kim Cương", priceFactor: 0.08, allowedRooms: ["Đơn", "Đôi", "Suite", "Gia Đình"] }] };
    const hotelTypeSelect = document.getElementById("hotelType");
    const hotelNameSelect = document.getElementById("hotelName");

    hotelTypeSelect.addEventListener("change", () => {
        const selectedType = hotelTypeSelect.value;
        hotelNameSelect.innerHTML = '<option value="">Chọn tên</option>';
        if (hotelsData[selectedType]) {
            hotelsData[selectedType].forEach(hotel => {
                const option = document.createElement("option");
                option.value = hotel.name;
                option.textContent = hotel.name;
                hotelNameSelect.appendChild(option);
            });
        }
    });

    // --- Logic chính của form ---
    const form = document.getElementById('booking-form');
    const urlParams = new URLSearchParams(window.location.search);
    const bookingId = urlParams.get('id');
    const isEditMode = !!bookingId;

    // Helper chuyển Timestamp sang YYYY-MM-DD cho input[type=date]
    const toInputDate = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    if (isEditMode) {
        document.getElementById('form-title').textContent = "Chỉnh Sửa Đơn Đặt Phòng";
        getDoc(doc(db, 'bookings', bookingId)).then(docSnap => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                form.customerName.value = data.customerName;
                form.customerEmail.value = data.customerEmail;
                form.customerPhone.value = data.customerPhone;
                form.hotelType.value = data.hotelType;
                // Trigger event để load đúng danh sách khách sạn
                hotelTypeSelect.dispatchEvent(new Event('change'));
                // Set giá trị hotelName sau khi đã load xong
                setTimeout(() => { form.hotelName.value = data.hotelName; }, 100);
                form.roomType.value = data.roomType;
                form.guests.value = data.guests;
                form.checkinDate.value = toInputDate(data.checkinDate);
                form.checkoutDate.value = toInputDate(data.checkoutDate);
                form.totalPrice.value = data.totalPrice;
                form.status.value = data.status;
            }
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('submit-btn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang lưu...';

        const dataToSave = {
            customerName: form.customerName.value,
            customerEmail: form.customerEmail.value,
            customerPhone: form.customerPhone.value,
            hotelType: form.hotelType.value,
            hotelName: form.hotelName.value,
            roomType: form.roomType.value,
            guests: Number(form.guests.value),
            checkinDate: new Date(form.checkinDate.value),
            checkoutDate: new Date(form.checkoutDate.value),
            totalPrice: Number(form.totalPrice.value),
            status: form.status.value,
            updatedAt: serverTimestamp()
        };

        try {
            if (isEditMode) {
                await updateDoc(doc(db, 'bookings', bookingId), dataToSave);
                alert('Cập nhật thành công!');
            } else {
                dataToSave.createdAt = serverTimestamp();
                await addDoc(collection(db, 'bookings'), dataToSave);
                alert('Thêm mới thành công!');
            }
            window.location.href = 'admin_bookings.html';
        } catch (error) {
            console.error("Lỗi: ", error);
            alert("Đã xảy ra lỗi!");
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Lưu Đơn';
        }
    });
}