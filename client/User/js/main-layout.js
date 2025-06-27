/**
 * Tải và chèn nội dung của một file HTML vào một selector được chỉ định.
 * @param {string} componentPath - Đường dẫn đến file HTML thành phần (ví dụ: 'components/header.html').
 * @param {string} targetSelector - Selector CSS của element đích để chèn HTML vào (ví dụ: '#main-header').
 */
async function loadComponent(componentPath, targetSelector) {
    const targetElement = document.querySelector(targetSelector);
    if (!targetElement) {
        console.error(`Không tìm thấy element đích với selector: ${targetSelector}`);
        return;
    }

    try {
        const response = await fetch(componentPath);
        if (!response.ok) {
            throw new Error(`Không thể tải component: ${response.statusText}`);
        }
        const html = await response.text();
        targetElement.innerHTML = html;

        // Sau khi chèn xong header, cần chạy lại các script liên quan đến nó (nếu có)
        // Ví dụ: script cho thanh tìm kiếm
        if (targetSelector === '#main-header') {
            initializeHeaderScripts();
        }

    } catch (error) {
        console.error(`Lỗi khi tải component từ '${componentPath}':`, error);
        targetElement.innerHTML = `<p style="color:red; text-align:center;">Lỗi tải ${targetSelector}</p>`;
    }
}


/**
 * Hàm này sẽ chạy lại các script cần thiết cho header sau khi nó được nạp.
 * Ví dụ: script cho thanh tìm kiếm mở rộng, gợi ý tìm kiếm,...
 */
function initializeHeaderScripts() {
    // Nếu bạn có file search_expand.js, bạn có thể gọi hàm khởi tạo của nó ở đây
    // Ví dụ: if (typeof initSearchExpand === 'function') initSearchExpand();

    // Tạm thời để trống, bạn có thể thêm code vào sau
    console.log("Header scripts initialized (nếu có).");

    // Xử lý logic active cho menu
    const currentPage = window.location.pathname.split('/').pop(); // Lấy tên file hiện tại, vd: 'destinations.html'
    const navLinks = document.querySelectorAll('.nav-menu li a');
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Chạy hàm tải khi toàn bộ DOM đã sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
    loadComponent('components/header.html', '#main-header');
});