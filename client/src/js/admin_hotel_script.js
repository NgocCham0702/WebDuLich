import { db } from "./firebase-config.js";
import {
    collection,
    getDocs,
    addDoc,
    doc,
    getDoc,
    updateDoc,
    deleteDoc,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- DOM Elements ---
const hotelTableBody = document.querySelector("#hotelTable tbody");
const hotelFormModal = document.getElementById("hotelFormModal");
const hotelForm = document.getElementById("hotelForm");
const formTitle = document.getElementById("formTitle");
const btnAddHotel = document.getElementById("btnAddHotel");
const btnCancel = document.getElementById("btnCancel");
const btnAddRoom = document.getElementById("btnAddRoom");
const roomsContainer = document.getElementById("roomsContainer");
const closeModalSpan = hotelFormModal.querySelector(".close");

let currentEditId = null;

// --- Khởi tạo dropdown ---
async function populateDropdown(selectId, collectionName, fieldName) {
    const select = document.getElementById(selectId);
    if (!select) return;

    select.innerHTML = '<option value="" disabled selected>-- Đang tải... --</option>';

    try {
        const snapshot = await getDocs(collection(db, collectionName));
        select.innerHTML = '<option value="" disabled selected>-- Chọn --</option>';
        snapshot.forEach((doc) => {
            const data = doc.data();
            const option = document.createElement("option");
            option.value = doc.id;
            option.textContent = data[fieldName] || "Không rõ";
            select.appendChild(option);
        });
    } catch (error) {
        console.error(`Lỗi tải dropdown ${selectId}:`, error);
        select.innerHTML = '<option value="" disabled>Không tải được dữ liệu</option>';
    }
}

// --- Render danh sách khách sạn ---
async function renderHotels() {
    hotelTableBody.innerHTML = `<tr><td colspan="7">Đang tải dữ liệu...</td></tr>`;

    // Load map loại khách sạn và địa điểm để hiển thị tên
    const hotelTypesMap = {};
    const destinationsMap = {};

    try {
        const [hotelTypesSnap, destinationsSnap, hotelsSnap] = await Promise.all([
            getDocs(collection(db, "hotel_types")),
            getDocs(collection(db, "destinations")),
            getDocs(collection(db, "hotels")),
        ]);

        hotelTypesSnap.forEach((doc) => {
            hotelTypesMap[doc.id] = doc.data().name || "Không rõ";
        });
        destinationsSnap.forEach((doc) => {
            destinationsMap[doc.id] = doc.data().name || "Không rõ";
        });

        if (hotelsSnap.empty) {
            hotelTableBody.innerHTML = `<tr><td colspan="7">Chưa có khách sạn nào.</td></tr>`;
            return;
        }

        let rowsHtml = "";
        hotelsSnap.forEach((doc) => {
            const hotel = doc.data();
            const statusText = hotel.isActive ? "Hoạt động" : "Đã ẩn";
            const statusClass = hotel.isActive ? "status-active" : "status-inactive";

            rowsHtml += `
        <tr data-id="${doc.id}">
          <td>${hotel.name || ""}</td>
          <td>${hotel.address || ""}</td>
          <td>${hotelTypesMap[hotel.hotel_type_id] || ""}</td>
          <td>${hotel.rating ?? ""}</td>
          <td>${hotel.reviewCount ?? ""}</td>
          <td><span class="${statusClass}">${statusText}</span></td>
          <td>
            <button class="btn-edit" data-id="${doc.id}">Sửa</button>
            <button class="btn-delete" data-id="${doc.id}">Xóa</button>
          </td>
        </tr>
      `;
        });

        hotelTableBody.innerHTML = rowsHtml;

        // Gán sự kiện cho nút Sửa và Xóa
        document.querySelectorAll(".btn-edit").forEach((btn) => {
            btn.addEventListener("click", (e) => openEditModal(e.target.dataset.id));
        });
        document.querySelectorAll(".btn-delete").forEach((btn) => {
            btn.addEventListener("click", (e) => deleteHotel(e.target.dataset.id));
        });
    } catch (error) {
        console.error("Lỗi tải danh sách khách sạn:", error);
        hotelTableBody.innerHTML = `<tr><td colspan="7" style="color:red;">Lỗi tải dữ liệu.</td></tr>`;
    }
}

// --- Mở modal thêm khách sạn ---
function openAddModal() {
    currentEditId = null;
    formTitle.textContent = "Thêm khách sạn mới";
    hotelForm.reset();
    clearRooms();
    hotelFormModal.style.display = "block";
}

// --- Mở modal sửa khách sạn ---
async function openEditModal(id) {
    currentEditId = id;
    formTitle.textContent = "Sửa thông tin khách sạn";
    hotelForm.reset();
    clearRooms();

    try {
        // Đảm bảo dropdown đã load
        await Promise.all([
            populateDropdown("destination_id", "destinations", "name"),
            populateDropdown("hotel_type_id", "hotel_types", "name"),
        ]);

        const docSnap = await getDoc(doc(db, "hotels", id));
        if (!docSnap.exists()) {
            alert("Không tìm thấy khách sạn.");
            return;
        }
        const data = docSnap.data();

        // Gán dữ liệu lên form
        hotelForm.hotelId.value = id;
        hotelForm.name.value = data.name || "";
        hotelForm.slug.value = data.slug || "";
        hotelForm.destination_id.value = data.destination_id || "";
        hotelForm.hotel_type_id.value = data.hotel_type_id || "";
        hotelForm.address.value = data.address || "";
        hotelForm.description.value = data.description || "";
        hotelForm.imageUrls.value = Array.isArray(data.imageUrls) ? data.imageUrls.join(", ") : "";
        hotelForm.amenities.value = Array.isArray(data.amenities) ? data.amenities.join(", ") : "";
        hotelForm.rating.value = data.rating ?? "";
        hotelForm.reviewCount.value = data.reviewCount ?? "";
        hotelForm.isActive.value = data.isActive ? "true" : "false";

        // Vị trí
        hotelForm.latitude.value = data.location?.latitude ?? "";
        hotelForm.longitude.value = data.location?.longitude ?? "";

        // Thông tin liên hệ
        hotelForm.phone.value = data.phone || "";
        hotelForm.email.value = data.email || "";
        hotelForm.website.value = data.website || "";

        // Chính sách
        hotelForm.checkinTime.value = data.Policy?.checkinTime || "";
        hotelForm.checkoutTime.value = data.Policy?.checkoutTime || "";
        hotelForm.cancellationPolicy.value = data.Policy?.cancellationPolicy || "";
        hotelForm.childrenPolicy.value = data.Policy?.childrenPolicy || "";

        // Phòng có sẵn
        if (Array.isArray(data.availableRooms)) {
            data.availableRooms.forEach((room) => addRoom(room));
        }

        hotelFormModal.style.display = "block";
    } catch (error) {
        console.error("Lỗi tải dữ liệu khách sạn:", error);
        alert("Lỗi tải dữ liệu khách sạn.");
    }
}

// --- Xóa khách sạn ---
async function deleteHotel(id) {
    if (!confirm("Bạn có chắc muốn xóa khách sạn này?")) return;

    try {
        await deleteDoc(doc(db, "hotels", id));
        alert("Xóa khách sạn thành công.");
        renderHotels();
    } catch (error) {
        console.error("Lỗi xóa khách sạn:", error);
        alert("Xóa khách sạn thất bại.");
    }
}

// --- Xóa hết các phòng trong form ---
function clearRooms() {
    roomsContainer.innerHTML = "";
}

// --- Thêm phòng mới vào form ---
function addRoom(room = {}) {
    const roomDiv = document.createElement("div");
    roomDiv.classList.add("room");

    roomDiv.innerHTML = `
    <label>Tên loại phòng: <input type="text" class="room-typeName" value="${room.roomTypeName || ''}" required></label>
    <label>Giá cơ bản (VNĐ): <input type="number" class="room-basePrice" value="${room.basePrice ?? ''}" min="0" required></label>
    <label>Số khách tối đa: <input type="number" class="room-maxGuests" value="${room.maxGuests ?? ''}" min="1" required></label>
    <label>Phụ phí (VNĐ): <input type="number" class="room-surcharge" value="${room.surcharge ?? 0}" min="0" required></label>
    <button type="button" class="btn-remove-room">Xóa phòng</button>
    <hr>
  `;

    roomDiv.querySelector(".btn-remove-room").addEventListener("click", () => {
        roomDiv.remove();
    });

    roomsContainer.appendChild(roomDiv);
}

// --- Lấy dữ liệu phòng từ form ---
function getRoomsData() {
    const rooms = [];
    const roomDivs = roomsContainer.querySelectorAll(".room");
    roomDivs.forEach(div => {
        const roomTypeName = div.querySelector(".room-typeName").value.trim();
        const basePrice = parseFloat(div.querySelector(".room-basePrice").value);
        const maxGuests = parseInt(div.querySelector(".room-maxGuests").value);
        const surcharge = parseFloat(div.querySelector(".room-surcharge").value);

        if (roomTypeName && !isNaN(basePrice) && !isNaN(maxGuests) && !isNaN(surcharge)) {
            rooms.push({
                roomTypeName,
                basePrice,
                maxGuests,
                surcharge
            });
        }
    });
    return rooms;
}


// --- Xử lý submit form ---
async function saveHotel(e) {
    e.preventDefault();

    // Lấy dữ liệu từ form
    const hotelData = {
        name: hotelForm.name.value.trim(),
        slug: hotelForm.slug.value.trim(),
        destination_id: hotelForm.destination_id.value,
        hotel_type_id: hotelForm.hotel_type_id.value,
        address: hotelForm.address.value.trim(),
        description: hotelForm.description.value.trim(),
        imageUrls: hotelForm.imageUrls.value
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s),
        amenities: hotelForm.amenities.value
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s),
        rating: parseFloat(hotelForm.rating.value) || 0,
        reviewCount: parseInt(hotelForm.reviewCount.value) || 0,
        isActive: hotelForm.isActive.value === "true",
        location: {
            latitude: parseFloat(hotelForm.latitude.value) || 0,
            longitude: parseFloat(hotelForm.longitude.value) || 0,
        },
        phone: hotelForm.phone.value.trim(),
        email: hotelForm.email.value.trim(),
        website: hotelForm.website.value.trim(),
        Policy: {
            checkinTime: hotelForm.checkinTime.value,
            checkoutTime: hotelForm.checkoutTime.value,
            cancellationPolicy: hotelForm.cancellationPolicy.value.trim(),
            childrenPolicy: hotelForm.childrenPolicy.value.trim(),
        },
        availableRooms: getRoomsData(),
    };

    try {
        if (currentEditId) {
            // Cập nhật khách sạn
            await updateDoc(doc(db, "hotels", currentEditId), hotelData);
            alert("Cập nhật khách sạn thành công.");
        } else {
            // Thêm khách sạn mới
            await addDoc(collection(db, "hotels"), hotelData);
            alert("Thêm khách sạn thành công.");
        }
        closeModal();
        renderHotels();
    } catch (error) {
        console.error("Lỗi lưu khách sạn:", error);
        alert("Lỗi lưu khách sạn.");
    }
}

// --- Đóng modal ---
function closeModal() {
    hotelFormModal.style.display = "none";
    hotelForm.reset();
    clearRooms();
    currentEditId = null;
}

// --- Khởi tạo sự kiện ---
function initEventListeners() {
    btnAddHotel.addEventListener("click", openAddModal);
    btnCancel.addEventListener("click", closeModal);
    hotelForm.addEventListener("submit", saveHotel);
    closeModalSpan.addEventListener("click", closeModal);
    btnAddRoom.addEventListener("click", () => addRoom());
    window.addEventListener("click", (e) => {
        if (e.target === hotelFormModal) {
            closeModal();
        }
    });
}

// --- Khởi tạo ---
async function init() {
    await Promise.all([
        populateDropdown("destination_id", "destinations", "name"),
        populateDropdown("hotel_type_id", "hotel_types", "name"),
    ]);
    await renderHotels();
    initEventListeners();
}

init();
