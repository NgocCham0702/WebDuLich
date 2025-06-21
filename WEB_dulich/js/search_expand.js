document.addEventListener("DOMContentLoaded", () => {
  const searchBar = document.querySelector('.search-bar');
  const input = searchBar.querySelector('input[type="text"]');
  const suggestionsList = searchBar.querySelector('.suggestions-list');

  input.addEventListener('focus', () => {
    searchBar.classList.add('expanded');
    if (suggestionsList.children.length > 0) {
      suggestionsList.style.display = 'block';
    }
  });

  input.addEventListener('blur', () => {
    // Ẩn gợi ý và thu nhỏ thanh tìm kiếm sau 200ms để tránh mất focus khi click gợi ý
    setTimeout(() => {
      searchBar.classList.remove('expanded');
      suggestionsList.style.display = 'none';
    }, 200);
  });

  input.addEventListener('input', () => {
    // Hiển thị danh sách gợi ý khi có input, ẩn khi rỗng
    if (input.value.trim() !== '') {
      suggestionsList.style.display = 'block';
    } else {
      suggestionsList.style.display = 'none';
    }
  });

  // (Phần tạo gợi ý bạn có thể giữ lại hoặc tùy chỉnh)
});
