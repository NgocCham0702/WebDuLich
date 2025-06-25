// build-css.js

const fs = require('fs/promises');
const path = require('path');
const postcss = require('postcss');
const tailwindcss = require('tailwindcss');
const autoprefixer = require('autoprefixer');

// Đường dẫn file vào và ra
const inputFile = path.join(__dirname, 'client', 'src', 'css', 'input.css');
const outputFile = path.join(__dirname, 'dist', 'output.css');
async function buildCss() {
    try {
        console.log('Reading input CSS file...');
        // Đọc nội dung file input.css
        const css = await fs.readFile(inputFile, 'utf8');

        console.log('Processing CSS with PostCSS, TailwindCSS, and Autoprefixer...');
        // Dùng PostCSS để xử lý
        const result = await postcss([
            tailwindcss,
            autoprefixer
        ]).process(css, { from: inputFile, to: outputFile });

        // Đảm bảo thư mục 'dist' tồn tại
        await fs.mkdir(path.dirname(outputFile), { recursive: true });

        // Ghi kết quả vào file output.css
        await fs.writeFile(outputFile, result.css);

        // Ghi file map nếu có
        if (result.map) {
            await fs.writeFile(outputFile + '.map', result.map.toString());
        }

        console.log(`✅ Successfully built CSS: ${outputFile}`);

    } catch (error) {
        console.error('❌ Error building CSS:', error);
    }
}

// Chạy hàm build
buildCss();