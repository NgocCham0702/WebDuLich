import { db } from './firebase-config.js';
import { collection, getDocs, doc, getDoc, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Lấy các element chính
const destinationsGrid = document.getElementById('destinations-grid');
const popup = document.getElementById('destination-popup');
const popupBody = document.getElementById('popup-body');
const closePopupBtn = document.getElementById('close-popup-btn');

/**
 * Hàm tạo HTML cho card địa danh.
 * Lưu ý: Thẻ <a> đã được thay bằng <div> với các data-attributes.
 */
function createDestinationCard(destData, destId) {
    const imageUrl = destData.imageUrls?.[0] || 'https://via.placeholder.com/400x300.png?text=No+Image';
    const tagsHtml = (destData.tags || []).slice(0, 2).map(tag => `<span class="tag">${tag}</span>`).join('');

    return `
        <div class="destination-card-v2" data-id="${destId}" role="button" tabindex="0">
            <div class="card-image-wrapper">
                <img src="${imageUrl}" alt="Ảnh của ${destData.name}">
                <span class="card-location-tag"><i class="fas fa-map-marker-alt"></i> ${destData.location || ''}</span>
            </div>
            <div class="card-content">
                <h3>${destData.title || destData.name}</h3>
                <p class="slogan">${destData.content || ''}</p>
                <div class="card-footer">
                    <div class="card-tags">${tagsHtml}</div>
                    <span class="card-link">Xem chi tiết →</span>
                </div>
            </div>
        </div>
    `;
}

/**
 * Mở popup và tải dữ liệu chi tiết
 * @param {string} destId - ID của địa điểm cần hiển thị
 */
async function openDetailPopup(destId) {
    popup.classList.remove('hidden');
    popupBody.innerHTML = `<div class="popup-loading"><p>Đang tải chi tiết...</p></div>`;

    try {
        const docRef = doc(db, "destinations", destId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            popupBody.innerHTML = `<p style="color:red;">Không tìm thấy dữ liệu cho địa điểm này.</p>`;
            return;
        }

        const data = docSnap.data();

        // Tạo HTML với các class CSS tương ứng
        const introductionHtml = data.introduction
            ? `<div><h3>${data.introduction.heading}</h3><p>${data.introduction.content}</p></div>`
            : '';

        const attractionsHtml = data.attractions?.list?.length > 0
            ? `<div><h3>${data.attractions.heading}</h3><ul>${data.attractions.list.map(item => `<li>${item}</li>`).join('')}</ul></div>`
            : '';

        const cuisineHtml = data.cuisine
            ? `<div><h3>${data.cuisine.heading}</h3><p>${data.cuisine.content}</p></div>`
            : '';

        const bestTimeToVisitHtml = data.bestTimeToVisit
            ? `<div><h3>${data.bestTimeToVisit.heading}</h3><p>${data.bestTimeToVisit.content}</p></div>`
            : '';

        const galleryHtml = data.imageUrls?.length > 0
            ? `<div><h3>Bộ sưu tập ảnh</h3><div class="popup-gallery">${data.imageUrls.map(url => `<img src="${url}" alt="Ảnh địa điểm">`).join('')}</div></div>`
            : '';

        // Nút Đặt phòng
        const bookingBtnHtml = `
            <div class="btn-booking-container">
                <a href="/client/User/page/danh sach khach san.html?destination_id=${destId}" class="btn-booking">
                    Xem các khách sạn tại đây
                </a>
            </div>`;

        // Gộp tất cả lại
        const popupHtml = `
            <h2>${data.title || data.name}</h2>
            <p class="popup-slogan">${data.slogan || ''}</p>
            ${introductionHtml}
            ${attractionsHtml}
            ${cuisineHtml}
            ${bestTimeToVisitHtml}
            ${galleryHtml}
            ${bookingBtnHtml}
        `;

        popupBody.innerHTML = popupHtml;

    } catch (error) {
        console.error("Lỗi khi tải chi tiết popup:", error);
        popupBody.innerHTML = `<p style="color:red;">Đã xảy ra lỗi khi tải dữ liệu chi tiết.</p>`;
    }
}


/**
 * Hàm chính để tải và hiển thị danh sách địa danh
 */
async function displayAllDestinations() {
    // ... (code hàm này giữ nguyên như trước) ...
    if (!destinationsGrid) return;
    destinationsGrid.innerHTML = Array(3).fill('<div class="loading-placeholder">...</div>').join('');
    try {
        const q = query(collection(db, "destinations"), where("isActive", "==", true));
        const querySnapshot = await getDocs(q);
        destinationsGrid.innerHTML = '';
        if (querySnapshot.empty) {
            destinationsGrid.innerHTML = '<p>Chưa có địa danh nào.</p>';
            return;
        }
        querySnapshot.forEach((doc) => {
            const cardHtml = createDestinationCard(doc.data(), doc.id);
            destinationsGrid.insertAdjacentHTML('beforeend', cardHtml);
        });
    } catch (error) {
        console.error("Lỗi khi tải danh sách địa danh:", error);
        destinationsGrid.innerHTML = '<p>Lỗi tải dữ liệu.</p>';
    }
}

// --- EVENT LISTENERS ---

// Chạy hàm chính khi trang tải
document.addEventListener('DOMContentLoaded', displayAllDestinations);

// Bắt sự kiện click trên toàn bộ grid để mở popup (Event Delegation)
destinationsGrid.addEventListener('click', (e) => {
    const card = e.target.closest('.destination-card-v2');
    if (card) {
        const destId = card.dataset.id;
        openDetailPopup(destId);
    }
});

// Đóng popup
function closePopup() {
    popup.classList.add('hidden');
    popupBody.innerHTML = ''; // Dọn dẹp nội dung
}

closePopupBtn.addEventListener('click', closePopup);
popup.addEventListener('click', (e) => {
    // Chỉ đóng khi click vào lớp overlay màu đen, không phải nội dung popup
    if (e.target === popup) {
        closePopup();
    }
});

// Đóng popup bằng phím Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !popup.classList.contains('hidden')) {
        closePopup();
    }
});