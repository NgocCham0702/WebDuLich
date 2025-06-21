document.addEventListener("DOMContentLoaded", () => {
  const destinations = [
    "Vịnh Hạ Long",
    "Phố cổ Hội An",
    "Sa Pa",
    "Đà Lạt",
    "Huế",
    "Ninh Bình",
    "Côn Đảo",
    "Mộc Châu",
    "Phú Quốc"
  ];

  const input = document.querySelector('.search-bar input[type="text"]');
  const suggestionsList = document.querySelector('.suggestions-list');

  input.addEventListener('input', () => {
    const query = input.value.trim().toLowerCase();
    suggestionsList.innerHTML = '';

    if (!query) {
      suggestionsList.style.display = 'none';
      return;
    }

    // Lọc địa danh có chứa chuỗi query (không phân biệt hoa thường)
    const filtered = destinations.filter(name =>
      name.toLowerCase().includes(query)
    );

    if (filtered.length === 0) {
      suggestionsList.style.display = 'none';
      return;
    }

    // Tạo danh sách gợi ý
    filtered.forEach(name => {
      const li = document.createElement('li');
      li.textContent = name;
      li.addEventListener('click', () => {
        input.value = name;
        suggestionsList.style.display = 'none';
      });
      suggestionsList.appendChild(li);
    });

    suggestionsList.style.display = 'block';
  });

  // Ẩn danh sách khi click ra ngoài
  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !suggestionsList.contains(e.target)) {
      suggestionsList.style.display = 'none';
    }
  });
});
