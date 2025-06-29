// Import hàm khởi tạo UI xác thực
import { initializeAuthUI } from '/client/src/js/auth_check.js';

async function loadComponent(url, elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const html = await response.text();
        element.innerHTML = html;
        console.log(`✅ Đã tải component ${url} vào #${elementId}.`);

        // Khởi tạo UI xác thực sau khi chèn header vào DOM
        initializeAuthUI();

    } catch (error) {
        console.error(`Lỗi khi tải component:`, error);
        element.innerHTML = '<p class="text-red-500 text-center">Lỗi tải header.</p>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadComponent('/client/header.html', 'header-placeholder');
    // Nếu có footer, bạn có thể load tương tự
    // loadComponent('/client/partials/footer.html', 'footer-placeholder');
});
