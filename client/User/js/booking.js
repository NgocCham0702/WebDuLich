// =================================================================
// BOOKING.JS - PHIÊN BẢN KẾT NỐI FIREBASE
// =================================================================

// 1. IMPORT CÁC THÀNH PHẦN TỪ FIREBASE
import { db } from '/client/src/js/firebase-config.js'; // Giả sử bạn có file này
import { collection, getDocs, query, where, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- Lấy các element từ DOM (giữ nguyên) ---
const hotelTypeSelect = document.getElementById("hotelType");
const hotelNameSelect = document.getElementById("hotelName");
const roomTypeSelect = document.getElementById("roomType");
const guestsSelect = document.getElementById("guests");
const priceRangeInput = document.getElementById("priceRange");
const checkInInput = document.getElementById("checkIn");
const checkOutInput = document.getElementById("checkOut");
const fullNameInput = document.getElementById("fullName");
const emailInput = document.getElementById("email");
const phoneInput = document.getElementById("phone");
const bookingForm = document.getElementById("bookingForm");
const messageBox = document.getElementById("messageBox");
const messageText = document.getElementById("messageText");

// Biến toàn cục để lưu trữ dữ liệu tải về, thay thế cho hotelsData
let allHotelsData = [];
let allHotelTypesData = [];

// =================================================================
// 2. TẢI DỮ LIỆU ĐỘNG TỪ FIRESTORE KHI TRANG ĐƯỢC TẢI
// =================================================================

async function initialLoad() {
    try {
        // Tải danh sách các loại khách sạn
        const hotelTypesSnapshot = await getDocs(collection(db, "hotel_types"));
        allHotelTypesData = hotelTypesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Tải toàn bộ danh sách khách sạn
        const hotelsSnapshot = await getDocs(collection(db, "hotels"));
        allHotelsData = hotelsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Điền vào dropdown Loại Khách Sạn
        populateHotelTypes();

    } catch (error) {
        console.error("Lỗi khi tải dữ liệu ban đầu: ", error);
        alert("Không thể tải dữ liệu từ server. Vui lòng thử lại sau.");
    }
}

function populateHotelTypes() {
    hotelTypeSelect.innerHTML = '<option value="" disabled selected>Chọn loại khách sạn</option>';
    allHotelTypesData
        .sort((a, b) => a.order - b.order) // Sắp xếp theo thứ tự (nếu có)
        .forEach(type => {
            const option = document.createElement("option");
            option.value = type.id; // Dùng ID làm giá trị
            option.textContent = type.name; // Tên để hiển thị
            hotelTypeSelect.appendChild(option);
        });
}

// =================================================================
// 3. CẬP NHẬT LẠI CÁC EVENT LISTENER
// =================================================================

// Khi người dùng chọn một LOẠI khách sạn
hotelTypeSelect.addEventListener("change", () => {
    const selectedTypeId = hotelTypeSelect.value;

    // Lọc ra các khách sạn thuộc loại đã chọn
    const filteredHotels = allHotelsData.filter(hotel => hotel.hotel_type_id === selectedTypeId);

    // Điền vào dropdown Tên Khách Sạn
    hotelNameSelect.innerHTML = '<option value="" disabled selected>Chọn tên khách sạn</option>';
    filteredHotels.forEach(hotel => {
        const option = document.createElement("option");
        option.value = hotel.id; // Dùng ID của khách sạn làm giá trị
        option.textContent = hotel.name;
        hotelNameSelect.appendChild(option);
    });

    // Reset các dropdown phụ thuộc
    updateRoomOptions();
    updatePrice();
});

// Khi người dùng chọn một TÊN khách sạn
hotelNameSelect.addEventListener("change", () => {
    updateRoomOptions();
    updatePrice();
});

function updateRoomOptions() {
    const selectedHotelId = hotelNameSelect.value;
    const selectedHotel = allHotelsData.find(hotel => hotel.id === selectedHotelId);

    // Lấy các phòng có sẵn từ CSDL của khách sạn đó
    const availableRooms = selectedHotel ? selectedHotel.availableRooms.map(room => room.roomTypeName) : [];

    // Cập nhật dropdown loại phòng
    const options = roomTypeSelect.options;
    for (let i = 1; i < options.length; i++) { // Bỏ qua placeholder
        const roomOption = options[i];
        if (availableRooms.includes(roomOption.value)) {
            roomOption.disabled = false;
        } else {
            roomOption.disabled = true;
        }
    }
    if (roomTypeSelect.options[roomTypeSelect.selectedIndex]?.disabled) {
        roomTypeSelect.selectedIndex = 0;
    }
}

function updatePrice() {
    const selectedHotelId = hotelNameSelect.value;
    const selectedRoomType = roomTypeSelect.value;

    if (!selectedHotelId || !selectedRoomType) {
        priceRangeInput.value = "";
        return;
    }

    const selectedHotel = allHotelsData.find(hotel => hotel.id === selectedHotelId);
    const selectedRoom = selectedHotel.availableRooms.find(room => room.roomTypeName === selectedRoomType);

    const basePrice = selectedRoom ? selectedRoom.basePrice : 0;
    // Bạn có thể thêm logic tính giá phức tạp hơn ở đây (dựa vào số đêm, số khách...)

    priceRangeInput.value = basePrice > 0 ? `${basePrice.toLocaleString('vi-VN')}₫ / đêm` : "Vui lòng liên hệ";
}

// Cập nhật giá khi thay đổi loại phòng hoặc số khách
roomTypeSelect.addEventListener("change", updatePrice);
guestsSelect.addEventListener("change", updatePrice);


// =================================================================
// 4. CẬP NHẬT HÀM SUBMIT FORM
// =================================================================

bookingForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!bookingForm.checkValidity()) {
        bookingForm.reportValidity();
        return;
    }

    // Vô hiệu hóa nút submit để tránh double-click
    const submitButton = bookingForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = "Đang xử lý...";

    // Thu thập dữ liệu từ form để lưu vào Firestore
    try {
        // Lấy text của các lựa chọn, không phải ID
        const selectedHotelTypeName = hotelTypeSelect.options[hotelTypeSelect.selectedIndex].text;
        const selectedHotelName = hotelNameSelect.options[hotelNameSelect.selectedIndex].text;

        const bookingData = {
            customerName: fullNameInput.value,
            customerEmail: emailInput.value,
            customerPhone: phoneInput.value,
            hotelType: selectedHotelTypeName,
            hotelName: selectedHotelName,
            roomType: roomTypeSelect.value,
            guests: parseInt(guestsSelect.value),
            checkinDate: new Date(checkInInput.value),
            checkoutDate: new Date(checkOutInput.value),
            totalPrice: parseFloat(priceRangeInput.value.replace(/[^0-9]/g, '')) || 0, // Tính toán lại giá cuối cùng ở đây
            status: "pending", // Trạng thái mặc định
            createdAt: serverTimestamp()
        };

        // Thêm document mới vào collection 'bookings'
        const docRef = await addDoc(collection(db, "bookings"), bookingData);
        console.log("Document written with ID: ", docRef.id);

        showMessage("Đặt phòng thành công! Chúng tôi sẽ liên hệ với bạn sớm.", true);
        bookingForm.reset(); // Xóa form sau khi thành công

    } catch (error) {
        console.error("Lỗi khi thêm booking: ", error);
        showMessage("Đã xảy ra lỗi. Vui lòng thử lại.", false);
    } finally {
        // Bật lại nút submit
        submitButton.disabled = false;
        submitButton.textContent = "Xác Nhận Đặt Phòng";
    }
});

// Hàm showMessage giữ nguyên
function showMessage(message, success) {
    messageText.textContent = message;
    messageBox.className = `fixed top-4 left-1/2 -translate-x-1/2 rounded-3xl px-10 py-4 shadow-2xl flex items-center gap-4 z-50 transition-all duration-500 transform ${success ? 'bg-green-500 text-white' : 'bg-red-500 text-white'} opacity-100 scale-100`;
    setTimeout(() => {
        messageBox.className = messageBox.className.replace('opacity-100 scale-100', 'opacity-0 scale-90');
    }, 3500);
}


// --- KHỞI CHẠY HÀM TẢI DỮ LIỆU ---
initialLoad();