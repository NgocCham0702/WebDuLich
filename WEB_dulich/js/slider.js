const slides = document.querySelector('.slides');
const slideCount = slides.children.length;
let index = 0;

const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

function showSlide(i) {
  if (i < 0) index = slideCount - 1;
  else if (i >= slideCount) index = 0;
  else index = i;
  slides.style.transform = `translateX(-${index * 100}%)`;
}

prevBtn.addEventListener('click', () => {
  showSlide(index - 1);
  resetTimer();
});

nextBtn.addEventListener('click', () => {
  showSlide(index + 1);
  resetTimer();
});

let timer = setInterval(() => {
  showSlide(index + 1);
}, 3000);

function resetTimer() {
  clearInterval(timer);
  timer = setInterval(() => {
    showSlide(index + 1);
  }, 3000);
}

// Khởi đầu
showSlide(index);
