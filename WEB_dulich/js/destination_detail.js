// Dữ liệu chi tiết các địa danh
const destinationsData = {
  VHL: {
    title: "Vịnh Hạ Long",
    description: "Di sản thiên nhiên thế giới với hàng ngàn đảo đá vôi kỳ vĩ trên biển.",
    images: [
      "images/VHL1.jpg",
      "images/VHL2.jpg",
      "images/VHL3.jpg"
    ]
  },
  HOIAN: {
    title: "Phố cổ Hội An",
    description: "Thành phố cổ yên bình, nổi bật với kiến trúc và đèn lồng rực rỡ.",
    images: [
      "images/HOIAN1.jpg",
      "images/HOIAN2.jpg",
      "images/HOIAN3.jpg"
    ]
  },
  SAPA: {
    title: "Sa Pa",
    description: "Thị trấn miền núi thơ mộng với ruộng bậc thang và bản làng dân tộc.",
    images: [
      "images/SAPA1.jpg",
      "images/SAPA2.jpg",
      "images/SAPA3.jpg"
    ]
  },
  DALAT: {
    title: "Đà Lạt",
    description: "Thành phố ngàn hoa, khí hậu mát mẻ quanh năm và nhiều thắng cảnh đẹp.",
    images: [
      "images/DALAT1.jpg",
      "images/DALAT2.jpg",
      "images/DALAT3.jpg"
    ]
  },
  HUE: {
    title: "Huế",
    description: "Kinh đô xưa với quần thể di tích cổ kính và nhã nhạc cung đình.",
    images: [
      "images/HUE1.jpg",
      "images/HUE2.jpg",
      "images/HUE3.jpg"
    ]
  },
  NINHBINH: {
    title: "Ninh Bình",
    description: "Nơi giao hòa giữa núi non, hang động và những dòng sông thơ mộng.",
    images: [
      "images/NINHBINH1.jpg",
      "images/NINHBINH2.jpg",
      "images/NINHBINH3.jpg"
    ]
  },
  CONDAO: {
    title: "Côn Đảo",
    description: "Hòn đảo huyền bí, nổi tiếng với lịch sử linh thiêng và biển xanh trong.",
    images: [
      "images/CONDAO1.jpg",
      "images/CONDAO2.jpg",
      "images/CONDAO3.jpg"
    ]
  },
  MOCCHAU: {
    title: "Mộc Châu",
    description: "Thảo nguyên xanh mướt, hoa mận trắng trời và văn hóa dân tộc độc đáo.",
    images: [
      "images/MOCCHAU1.jpg",
      "images/MOCCHAU2.jpg",
      "images/MOCCHAU3.jpg"
    ]
  },
  PHUQUOC: {
    title: "Phú Quốc",
    description: "Đảo ngọc lớn nhất Việt Nam với biển xanh, cát trắng và hệ sinh thái phong phú.",
    images: [
      "images/PHUQUOC1.jpg",
      "images/PHUQUOC2.jpg",
      "images/PHUQUOC3.jpg"
    ]
  }
};

// Hàm lấy tham số URL
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// Khi DOM load xong
document.addEventListener("DOMContentLoaded", () => {
  const id = getQueryParam('id');

  const data = destinationsData[id];

  if (!data) {
    // Nếu không tìm thấy địa danh
    document.querySelector('.destination-detail h2').textContent = "Địa danh không tồn tại";
    document.querySelector('.destination-detail p').textContent = "";
    document.querySelector('.gallery').innerHTML = "";
    return;
  }

  // Cập nhật tiêu đề và mô tả
  document.querySelector('.destination-detail h2').textContent = data.title;
  document.querySelector('.destination-detail p').textContent = data.description;

  // Cập nhật gallery ảnh
  const galleryDiv = document.querySelector('.gallery');
  galleryDiv.innerHTML = "";
  data.images.forEach(src => {
    const img = document.createElement('img');
    img.src = src;
    img.alt = data.title;
    galleryDiv.appendChild(img);
  });
});
