import { db } from './firebase-config.js';
import { collection, getDocs, addDoc, serverTimestamp, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// DOM Elements
const bookingForm = document.getElementById('bookingForm');
const hotelTypeSelect = document.getElementById('hotelType');
const hotelNameSelect = document.getElementById('hotelNameSelect');
hotelNameSelect.addEventListener('change', updateRoomOptions);
const roomTypeSelect = document.getElementById('roomTypeSelect');
roomTypeSelect.addEventListener('change', updateGuestsByRoom);
const guestsInput = document.getElementById('guests');
const priceRangeInput = document.getElementById('priceRange');
const checkInInput = document.getElementById('checkIn');
const checkOutInput = document.getElementById('checkOut');
const messageBox = document.getElementById('messageBox');
const messageText = document.getElementById('messageText');

// Data cache
let hotelTypesData = [];
let allHotelsData = [];
function showMessage(message, isSuccess) {
    messageText.textContent = message;
    // Reset class và thêm các class cơ bản
    messageBox.className = 'fixed top-4 left-1/2 -translate-x-1/2 rounded-3xl px-10 py-4 shadow-2xl flex items-center gap-4 opacity-0 pointer-events-none select-none z-50 transition-all duration-300';

    // Thay đổi màu chữ và nền theo isSuccess
    if (isSuccess) {
        // Nền trắng, chữ màu đỏ (đỏ đậm)
        messageBox.style.backgroundColor = '#ffffff'; // nền trắng
        messageBox.style.color = '#dc2626'; // màu đỏ (Tailwind red-600)
        messageBox.querySelector('i').className = "fas fa-check-circle text-3xl";
        messageBox.querySelector('i').style.color = '#dc2626'; // icon màu đỏ
    } else {
        // Nền trắng, chữ màu đỏ (đỏ đậm)
        messageBox.style.backgroundColor = '#ffffff'; // nền trắng
        messageBox.style.color = '#dc2626'; // màu đỏ
        messageBox.querySelector('i').className = "fas fa-times-circle text-3xl";
        messageBox.querySelector('i').style.color = '#dc2626'; // icon màu đỏ
    }

    messageBox.classList.add('show', 'opacity-100', 'top-8');

    setTimeout(() => {
        messageBox.classList.remove('show', 'opacity-100', 'top-8');
        // Reset style sau khi ẩn
        messageBox.style.backgroundColor = '';
        messageBox.style.color = '';
        messageBox.querySelector('i').style.color = '';
    }, 4000);
}


// Load hotel types and hotels
async function initializeBookingForm() {
    try {
        const [typeSnap, hotelSnap] = await Promise.all([
            getDocs(query(collection(db, "hotel_types"), where("isActive", "==", true))),
            getDocs(query(collection(db, "hotels"), where("isActive", "==", true)))
        ]);

        hotelTypesData = typeSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        hotelTypesData.forEach(type => {
            hotelTypeSelect.add(new Option(type.name, type.id));
        });

        allHotelsData = hotelSnap.docs.map(doc => ({ id: doc.id, data: doc.data() }));
    } catch (error) {
        console.error("Lỗi khi tải dữ liệu cho form đặt phòng:", error);
        showMessage("Không thể tải dữ liệu. Vui lòng thử lại sau.", false);
    }
}

// Update hotel names based on selected hotel type
function updateHotelNameOptions() {
    const selectedTypeId = hotelTypeSelect.value;
    hotelNameSelect.innerHTML = '<option value="" disabled selected>Chọn tên khách sạn</option>';
    //roomTypeSelect.innerHTML = '<option value="" disabled selected>Chọn loại phòng</option>';
    priceRangeInput.value = '';

    if (selectedTypeId) {
        const filteredHotels = allHotelsData.filter(hotel => hotel.data.hotel_type_id === selectedTypeId);
        filteredHotels.forEach(hotel => {
            hotelNameSelect.add(new Option(hotel.data.name, hotel.id));
        });
    }
}

// Update room types based on selected hotel
function updateRoomOptions() {
    const hotelNameSelect = document.getElementById('hotelNameSelect');
    const roomTypeSelect = document.getElementById('roomTypeSelect');
    const guestsInput = document.getElementById('guests');

    const selectedHotelId = hotelNameSelect.value;
    roomTypeSelect.innerHTML = '<option value="" disabled selected>Chọn loại phòng</option>';
    guestsInput.value = ''; // reset số khách khi đổi khách sạn

    if (!selectedHotelId) return;

    const selectedHotel = allHotelsData.find(hotel => hotel.id === selectedHotelId);
    if (selectedHotel && selectedHotel.data.availableRooms) {
        selectedHotel.data.availableRooms.forEach(room => {
            const option = new Option(room.roomTypeName, room.roomTypeName);
            option.dataset.price = room.basePrice;
            option.dataset.maxGuests = room.maxGuests;
            roomTypeSelect.add(option);
        });
    }
}


function updateGuestsByRoom() {
    const guestsInput = document.getElementById('guests');
    const roomTypeSelect = document.getElementById('roomTypeSelect');
    const selectedOption = roomTypeSelect.selectedOptions[0];

    if (selectedOption && selectedOption.dataset.maxGuests) {
        guestsInput.value = selectedOption.dataset.maxGuests;
    } else {
        guestsInput.value = '';
    }
}




// Calculate and update price
function updatePrice() {
    const selectedRoomOption = roomTypeSelect.options[roomTypeSelect.selectedIndex];
    const checkInDate = new Date(checkInInput.value);
    const checkOutDate = new Date(checkOutInput.value);

    if (!selectedRoomOption?.dataset.price || !checkInInput.value || !checkOutInput.value || checkOutDate <= checkInDate) {
        priceRangeInput.value = '';
        return;
    }

    const basePrice = parseFloat(selectedRoomOption.dataset.price);
    const numberOfNights = (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24);
    const totalPrice = basePrice * numberOfNights;

    priceRangeInput.value = `${totalPrice.toLocaleString('vi-VN')} ₫`;
}

// Get hotelId from URL
function getHotelIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('hotelId');
}

// Select hotel and related options by hotelId
async function selectHotelById(hotelId) {
    if (!hotelId) return;

    if (hotelTypesData.length === 0 || allHotelsData.length === 0) {
        await initializeBookingForm();
    }

    const hotel = allHotelsData.find(h => h.id === hotelId);
    if (!hotel) {
        console.warn("Không tìm thấy khách sạn với ID:", hotelId);
        return;
    }

    hotelTypeSelect.value = hotel.data.hotel_type_id;
    updateHotelNameOptions();

    hotelNameSelect.value = hotelId;
    updateRoomOptions();

    if (roomTypeSelect.options.length > 1) {
        roomTypeSelect.selectedIndex = 1;
        updatePrice();
    }
}

// Event listeners
hotelTypeSelect.addEventListener('change', () => {
    updateHotelNameOptions();
    // roomTypeSelect.innerHTML = '<option value="" disabled selected>Chọn loại phòng</option>';
    priceRangeInput.value = '';
});
hotelNameSelect.addEventListener('change', () => {
    updateRoomOptions();
    priceRangeInput.value = '';
});
roomTypeSelect.addEventListener('change', updateGuestsByRoom);
checkInInput.addEventListener('change', updatePrice);
checkOutInput.addEventListener('change', updatePrice);

// Form submit
bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!bookingForm.checkValidity()) {
        showMessage("Vui lòng điền đầy đủ thông tin.", false);
        return;
    }

    const submitButton = bookingForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Đang xử lý...';

    const checkInDate = new Date(checkInInput.value);
    const checkOutDate = new Date(checkOutInput.value);
    const totalPrice = parseFloat(priceRangeInput.value.replace(/[^0-9]/g, '')) || 0;

    const bookingData = {
        customerName: document.getElementById('fullName').value,
        customerEmail: document.getElementById('email').value,
        customerPhone: document.getElementById('phone').value,
        hotelId: hotelNameSelect.value,
        hotelName: hotelNameSelect.options[hotelNameSelect.selectedIndex]?.text || '',
        hotelTypeId: hotelTypeSelect.value,
        hotelType: hotelTypeSelect.options[hotelTypeSelect.selectedIndex]?.text || '',
        roomType: roomTypeSelect.value,
        guests: Number(guestsSelect.value),
        checkinDate: checkInDate,
        checkoutDate: checkOutDate,
        totalPrice: totalPrice,
        status: 'pending',
        createdAt: serverTimestamp()
    };

    try {
        await addDoc(collection(db, 'bookings'), bookingData);
        showMessage("Đặt phòng thành công! Chúng tôi sẽ liên hệ với bạn sớm.", true);
        bookingForm.reset();
        hotelNameSelect.innerHTML = '<option value="" disabled selected>Chọn tên khách sạn</option>';
        roomTypeSelect.innerHTML = '<option value="" disabled selected>Chọn loại phòng</option>';
        priceRangeInput.value = '';
    } catch (error) {
        console.error("Lỗi khi thêm booking: ", error);
        showMessage("Đã có lỗi xảy ra. Vui lòng thử lại.", false);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Xác Nhận Đặt Phòng';
    }
});

// Initialize form and select hotel if hotelId in URL
document.addEventListener('DOMContentLoaded', async () => {
    await initializeBookingForm();
    const hotelId = getHotelIdFromUrl();
    if (hotelId) {
        await selectHotelById(hotelId);
    }
});
