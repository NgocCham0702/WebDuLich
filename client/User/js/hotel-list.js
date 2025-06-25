// =================================================================
// HOTEL-LIST.JS - PHIÊN BẢN MỚI: HIỂN THỊ DANH SÁCH KHÁCH SẠN CỤ THỂ
// =================================================================

// 1. IMPORT CÁC THÀNH PHẦN TỪ FIREBASE
import { db } from '/client/src/js/firebase-config.js'; // Sửa lại đường dẫn này nếu cần
import { collection, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- LẤY CÁC ELEMENTS CỦA MODAL ---
const modal = document.getElementById("modal");
// ... (giữ nguyên các element khác của modal)
const modalContent = document.getElementById("modal-content");
const modalImage = document.getElementById("modal-image");
const modalTitle = document.getElementById("modal-title");
const modalDescription = document.getElementById("modal-description");
const modalHtmlContent = document.getElementById("modal-html-content");
const modalClose = document.getElementById("modal-close");
const modalBookBtn = document.getElementById("modal-book-btn");
const hotelListContainer = document.getElementById("hotel-list-container");


// =================================================================
// 2. TẢI VÀ RENDER DỮ LIỆU TỪ COLLECTION `hotels`
// =================================================================

async function loadAndRenderHotels() {
    try {
        // *** THAY ĐỔI 1: Truy vấn đến collection 'hotels' ***
        // Sắp xếp theo rating giảm dần để khách sạn tốt nhất lên đầu
        const q = query(collection(db, "hotels"), where("isActive", "==", true), orderBy("rating", "desc"));
        const querySnapshot = await getDocs(q);

        hotelListContainer.innerHTML = '';

        if (querySnapshot.empty) {
            hotelListContainer.innerHTML = '<p class="col-span-full text-center">Không có khách sạn nào được tìm thấy.</p>';
            return;
        }

        querySnapshot.forEach(doc => {
            const hotelData = doc.data();
            const hotelId = doc.id;

            // *** THAY ĐỔI 2: Gọi hàm tạo card mới ***
            const articleElement = createHotelCard(hotelData, hotelId);
            hotelListContainer.appendChild(articleElement);
        });

    } catch (error) {
        console.error("Lỗi khi tải danh sách khách sạn: ", error);
        // Gợi ý lỗi phổ biến nhất cho người dùng
        if (error.code === 'failed-precondition') {
            hotelListContainer.innerHTML = `<p class="col-span-full text-center text-red-600">Lỗi: Cần tạo Index trên Firestore. Vui lòng nhấn F12, vào tab Console, tìm link màu xanh và click vào đó để tạo Index.</p>`;
        } else {
            hotelListContainer.innerHTML = '<p class="col-span-full text-center text-red-600">Đã xảy ra lỗi khi tải dữ liệu.</p>';
        }
    }
}


// --- HÀM TẠO CARD HTML MỚI CHO TỪNG KHÁCH SẠN ---
function createHotelCard(data, id) {
    const article = document.createElement('article');
    article.className = "bg-white rounded-3xl shadow-lg overflow-hidden hover:shadow-2xl transition cursor-pointer flex flex-col group focus:outline-none focus:ring-4 focus:ring-rose-300 relative";
    article.setAttribute('aria-label', data.name);
    article.setAttribute('role', 'button');
    article.setAttribute('tabindex', '0');

    // Tạo nội dung cho modal từ các trường của khách sạn
    const amenitiesList = (data.amenities || []).map(item => `<li>${item}</li>`).join('');
    const modalContentHTML = `
        <h3 class="text-xl font-semibold mb-2">Mô tả</h3>
        <p class="mb-4">${data.description || 'Chưa có mô tả.'}</p>
        <h3 class="text-xl font-semibold mb-2">Tiện ích nổi bật</h3>
        <ul class="list-disc list-inside mb-4">${amenitiesList}</ul>
        <h3 class="text-xl font-semibold mb-2">Chính sách</h3>
        <p><strong>Giờ nhận phòng:</strong> ${data.policies?.checkinTime || 'N/A'}</p>
        <p><strong>Giờ trả phòng:</strong> ${data.policies?.checkoutTime || 'N/A'}</p>
    `;
    const placeholderImage = 'https://picsum.photos/400/250';

    // Lưu trữ dữ liệu vào data attributes
    article.setAttribute('data-img', data.imageUrls?.[0] || placeholderImage);
    article.setAttribute('data-title', data.name);
    article.setAttribute('data-description', data.address); // Dùng địa chỉ làm mô tả ngắn
    article.setAttribute('data-content', modalContentHTML);

    // Nút Đặt phòng sẽ dẫn đến trang chi tiết của khách sạn này
    const detailUrl = `hotel-detail.html?id=${id}`; // Bạn sẽ cần tạo trang này
    article.setAttribute('data-book-url', detailUrl);

    // Render HTML bên trong card
    article.innerHTML = `
        <div class="relative">
            <img alt="${data.name}" class="w-full h-52 object-cover rounded-t-3xl" src="${data.imageUrls?.[0] || placeholderImage}" />
            <div class="absolute top-2 right-2 bg-pink-600 text-white text-sm font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <i class="fas fa-star"></i>
                <span>${data.rating || 'N/A'}</span>
            </div>
        </div>
        <div class="p-6 flex flex-col flex-grow">
            <h2 class="text-2xl font-semibold text-pink-700 mb-2 group-hover:text-rose-600 transition">
                ${data.name}
            </h2>
            <p class="text-rose-600 flex-grow mb-4">
                <i class="fas fa-map-marker-alt mr-2"></i>${data.address}
            </p>
        </div>
        <div class="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-3xl transition-opacity cursor-pointer pointer-events-none group-hover:pointer-events-auto">
            <span class="text-white text-lg font-semibold bg-pink-600 bg-opacity-80 px-4 py-2 rounded-lg shadow-lg select-none">
                Xem Chi Tiết
            </span>
        </div>
    `;
    return article;
}


// --- LOGIC CỦA MODAL (Giữ nguyên) ---
// ... (toàn bộ code của openModal, closeModal, và các event listener giữ nguyên)
function openModal(article) {
    const imgSrc = article.getAttribute("data-img");
    const title = article.getAttribute("data-title");
    const description = article.getAttribute("data-description");
    const content = article.getAttribute("data-content");
    const bookUrl = article.getAttribute("data-book-url") || "#";

    modalImage.src = imgSrc;
    modalImage.alt = title + " - Hình ảnh chi tiết";
    modalTitle.textContent = title;
    modalDescription.textContent = description;
    modalHtmlContent.innerHTML = content;
    modalBookBtn.href = bookUrl;

    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = 'hidden';
    modalContent.focus();
}

function closeModal() {
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = '';
}

hotelListContainer.addEventListener('click', (e) => {
    const article = e.target.closest('article[role="button"]');
    if (article) {
        openModal(article);
    }
});

hotelListContainer.addEventListener('keydown', (e) => {
    const article = e.target.closest('article[role="button"]');
    if (article && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        openModal(article);
    }
});

modalClose.addEventListener("click", closeModal);
modal.addEventListener("click", (e) => {
    if (e.target === modal) {
        closeModal();
    }
});
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("show")) {
        closeModal();
    }
});

// --- KHỞI CHẠY HÀM CHÍNH ---
document.addEventListener('DOMContentLoaded', loadAndRenderHotels);