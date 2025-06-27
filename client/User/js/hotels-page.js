import { db } from './firebase-config.js';
import { collection, getDocs, query, where, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- DOM ELEMENTS ---
const destinationFilter = document.getElementById('filter-destination');
const typeFilter = document.getElementById('filter-type');
const applyFiltersBtn = document.getElementById('apply-filters-btn');
const hotelsGrid = document.getElementById('hotels-grid');

// Popup elements
const popup = document.getElementById('hotel-detail-popup');

const popupBody = document.getElementById('popup-body');
const closePopupBtn = document.getElementById('close-popup-btn');

// --- DATA CACHING ---
let allHotelsData = [];
let destinationsMap = new Map();
let hotelTypesMap = new Map();

// --- HELPER FUNCTIONS ---

/**
 * Tạo HTML cho một thẻ khách sạn trên lưới
 */
function createHotelCard(hotelData, hotelId) {
    const imageUrl = hotelData.imageUrls?.[0] || hotelData.image || 'https://via.placeholder.com/400x300.png';
    const destinationName = destinationsMap.get(hotelData.destination_id) || 'Không rõ';
    const basePrice = hotelData.availableRooms?.[0]?.basePrice || hotelData.price || 0;
    const description = hotelData.description || '';

    return `
        <div class="hotel-card" data-hotel-id="${hotelId}">
            <img src="${imageUrl}" alt="${hotelData.name}" class="hotel-card-image">
            <div class="hotel-card-content">
                <h3 class="hotel-card-title">${hotelData.name}</h3>
                <p class="hotel-card-description">${description}</p>
                <div class="hotel-card-info-row">
                    
                    <span class="hotel-card-price">
                        ${basePrice.toLocaleString('vi-VN')}₫ / đêm
                    </span>
                    <span class="hotel-card-rating">
                        ${hotelData.rating} <i class="fas fa-star"></i>
                    </span>
                </div>
<a href="/client/User/page/dat phong.html?hotelId=${hotelId}" class="hotel-card-book-btn">Đặt phòng</a>
            </div>
        </div>
    `;
}


/**
 * Hiển thị danh sách khách sạn ra grid
 */
function renderHotels(hotels) {
    hotelsGrid.innerHTML = '';
    if (hotels.length === 0) {
        hotelsGrid.innerHTML = `<p class="col-span-full text-center text-gray-500">Không tìm thấy khách sạn nào phù hợp.</p>`;
        return;
    }
    hotels.forEach(hotel => {
        const cardHtml = createHotelCard(hotel.data, hotel.id);
        hotelsGrid.insertAdjacentHTML('beforeend', cardHtml);
    });
}

/**
 * Tạo nội dung HTML chi tiết cho popup
 */
function createPopupContent(hotelData) {
    // Xử lý ảnh chính và gallery
    const mainImage = hotelData.imageUrls?.[0] || hotelData.image || 'https://via.placeholder.com/600x400.png';
    const galleryImages = (hotelData.imageUrls || []).filter(url => url).slice(1, 7); // Lấy 6 ảnh nhỏ
    const morePhotosCount = (hotelData.imageUrls || []).filter(url => url).length - 7;

    // Các tiện nghi nổi bật
    const amenities = hotelData.amenities || [];
    const features = hotelData.features || [];

    // Giá
    const basePrice = hotelData.availableRooms?.[0]?.basePrice || hotelData.price || 0;

    // Địa chỉ
    const address = hotelData.address || "Chưa cập nhật";

    // Tên khách sạn
    const name = hotelData.name || "Khách sạn không tên";

    // Đánh giá
    const rating = hotelData.rating ? `${hotelData.rating} <i class="fas fa-star" style="color:#f4a261"></i>` : "Chưa có đánh giá";
    const reviewCount = hotelData.reviewCount ? `(${hotelData.reviewCount} đánh giá)` : "";

    // Mô tả
    const description = hotelData.description || "";

    // Các tiện ích phổ biến (icon tuỳ chọn)
    const popularFacilities = [
        { icon: "fas fa-swimming-pool", label: "Hồ bơi ngoài trời", check: amenities.includes("Hồ bơi") },
        { icon: "fas fa-parking", label: "Chỗ đậu xe miễn phí", check: amenities.some(a => a.toLowerCase().includes("parking")) || amenities.some(a => a.toLowerCase().includes("đậu xe")) },
        { icon: "fas fa-wifi", label: "WiFi miễn phí", check: amenities.some(a => a.toLowerCase().includes("wifi")) },
        { icon: "fas fa-users", label: "Phòng gia đình", check: features.some(f => f.toLowerCase().includes("gia đình")) },
        { icon: "fas fa-smoking-ban", label: "Phòng không hút thuốc", check: amenities.some(a => a.toLowerCase().includes("không hút thuốc")) },
        { icon: "fas fa-mug-hot", label: "Bữa sáng rất ngon", check: amenities.some(a => a.toLowerCase().includes("breakfast")) || amenities.some(a => a.toLowerCase().includes("bữa sáng")) }
    ];

    // Tạo HTML
    return `
    <div class="popup-hotel-header">
        <h2 class="popup-hotel-title">${name}</h2>
        <div class="popup-hotel-rating">
            ${rating} <span class="popup-hotel-review-count">${reviewCount}</span>
        </div>
        <div class="popup-hotel-address">
            <i class="fas fa-map-marker-alt"></i> ${address}
        </div>
    </div>
    <div class="popup-hotel-gallery">
        <div class="popup-hotel-main-image">
            <img src="${mainImage}" alt="${name}">
        </div>
        <div class="popup-hotel-thumbnails">
            ${galleryImages.map(url => `<img src="${url}" alt="Ảnh khách sạn">`).join("")}
            ${morePhotosCount > 0 ? `<div class="popup-hotel-more-photos">+${morePhotosCount} ảnh</div>` : ""}
        </div>
    </div>
    <div class="popup-hotel-pricing">
        <span class="popup-hotel-price">${basePrice.toLocaleString('vi-VN')}₫</span>
        <span class="popup-hotel-price-desc">/ đêm</span>
        <a href="/client/User/page/dat phong.html?hotelId=${hotelData.id || ''}" class="popup-hotel-book-btn">Đặt phòng</a>
    </div>
    <div class="popup-hotel-description">
        <h3>Giới thiệu chỗ nghỉ</h3>
        <p>${description}</p>
    </div>
    <div class="popup-hotel-amenities">
        <h3>Tiện nghi nổi bật</h3>
        <div class="popup-hotel-amenities-list">
            ${popularFacilities.filter(f => f.check).map(f => `
                <div class="popup-hotel-amenity">
                    <i class="${f.icon}"></i> ${f.label}
                </div>
            `).join("")}
        </div>
    </div>
    <div class="popup-hotel-all-amenities">
        <h4>Các tiện nghi khác:</h4>
        <div class="popup-hotel-amenities-list">
            ${amenities.map(a => `<span class="popup-hotel-amenity-badge">${a}</span>`).join("")}
        </div>
    </div>
    `;
}



// --- EVENT HANDLERS ---

/**
 * Mở popup và điền dữ liệu
 */
async function openPopup(hotelId) {
    popupBody.innerHTML = `
  <div class="loading-indicator" style="color:#666; text-align:center; padding: 40px 0;">
    Đang tải chi tiết...
  </div>`;
    popup.classList.remove('hidden');


    try {
        const docRef = doc(db, 'hotels', hotelId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const hotelData = docSnap.data();
            hotelData.id = hotelId; // để truyền vào link đặt phòng
            const popupHtml = createPopupContent(hotelData);
            popupBody.innerHTML = popupHtml;
        } else {
            popupBody.innerHTML = '<p>Không tìm thấy thông tin khách sạn.</p>';
        }
    } catch (error) {
        console.error("Lỗi khi tải chi tiết khách sạn:", error);
        popupBody.innerHTML = '<p>Lỗi tải dữ liệu.</p>';
    }
}


/**
 * Đóng popup
 */
function closePopup() {
    popup.classList.add('hidden');
}

/**
 * Áp dụng bộ lọc
 */
function applyAllFilters() {
    let filteredHotels = [...allHotelsData];
    const selectedDest = destinationFilter.value;
    const selectedType = typeFilter.value;

    if (selectedDest !== 'all') {
        filteredHotels = filteredHotels.filter(hotel => hotel.data.destination_id === selectedDest);
    }
    if (selectedType !== 'all') {
        filteredHotels = filteredHotels.filter(hotel => hotel.data.hotel_type_id === selectedType);
    }

    renderHotels(filteredHotels);
}


// --- INITIALIZATION ---

/**
 * Hàm khởi tạo chính của trang
 */
async function initializePage() {
    hotelsGrid.innerHTML = `<p class="col-span-full text-center">Đang tải...</p>`;

    // Tải dữ liệu cho bộ lọc
    try {
        const [destSnap, typeSnap] = await Promise.all([
            getDocs(collection(db, 'destinations')),
            getDocs(collection(db, 'hotel_types'))
        ]);

        destSnap.forEach(doc => {
            destinationsMap.set(doc.id, doc.data().name);
            destinationFilter.add(new Option(doc.data().name, doc.id));
        });
        typeSnap.forEach(doc => {
            hotelTypesMap.set(doc.id, doc.data().name);
            typeFilter.add(new Option(doc.data().name, doc.id));
        });

    } catch (error) {
        console.error("Lỗi khi tải dữ liệu cho bộ lọc:", error);
    }

    // Tải tất cả khách sạn
    try {
        const q = query(collection(db, "hotels"), where("isActive", "==", true));
        const querySnapshot = await getDocs(q);
        allHotelsData = querySnapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }));
        renderHotels(allHotelsData);
    } catch (error) {
        console.error("Lỗi khi tải danh sách khách sạn:", error);
        hotelsGrid.innerHTML = `<p class="col-span-full text-center text-red-500">Lỗi tải dữ liệu.</p>`;
    }

    // Gắn các sự kiện
    applyFiltersBtn.addEventListener('click', applyAllFilters);
    closePopupBtn.addEventListener('click', closePopup);
    popup.addEventListener('click', (e) => {
        if (e.target === popup) closePopup(); // Đóng popup khi click ra ngoài
    });

    // Sự kiện click trên grid để mở popup (dùng event delegation)
    hotelsGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.hotel-card');
        if (card) {
            const hotelId = card.dataset.hotelId;
            openPopup(hotelId);
        }
    });
}

// Chạy hàm khởi tạo
document.addEventListener('DOMContentLoaded', initializePage);