const prisma = require('../src/utils/prisma');


async function main() {
  console.log('🌱 Seeding: Laptop (15 sản phẩm)...');

  const products = [

    // ── NĂM 2022/2023 ─────────────────────────────────────────────────────────

    {
      name: 'Apple MacBook Air 13 M2 8GB/256GB (2022)',
      description: 'MacBook Air M2 13 inch ra mắt tháng 6/2022 là bước lột xác lớn nhất của dòng Air sau nhiều năm với thiết kế hoàn toàn mới: mỏng phẳng, không quạt tản nhiệt, màn hình Liquid Retina 13.6 inch 500 nits sáng hơn thế hệ trước. Chip Apple M2 CPU 8 nhân, GPU 8 nhân, Neural Engine 16 nhân, băng thông bộ nhớ 100GB/s. Pin 18 giờ, trọng lượng 1.24kg, 2 cổng Thunderbolt 4, sạc MagSafe 3.',
      price: 22990000,
      stock: 90,
      category: 'Laptop',
      brand: 'Apple',
      rating: 4.7,
      numReviews: 203,
      discountPercent: 20,
      isNewArrival: false,
      manufactureYear: 2022,
    },
    {
      name: 'Apple MacBook Air 13 M2 8GB/512GB (2022)',
      description: 'MacBook Air M2 13 inch 512GB ra mắt tháng 6/2022, phiên bản phổ biến nhất trong dòng Air M2. Chip Apple M2 với GPU 10 nhân (cao hơn bản 256GB), SSD 512GB tốc độ cao, màn hình Liquid Retina 13.6 inch, pin 18 giờ. Tính đến đầu 2026, đây vẫn là laptop có tỷ lệ giá/hiệu năng tốt nhất cho sinh viên và dân văn phòng. RAM 16GB kể từ tháng 10/2024.',
      price: 27990000,
      stock: 70,
      category: 'Laptop',
      brand: 'Apple',
      rating: 4.8,
      numReviews: 178,
      discountPercent: 15,
      isNewArrival: false,
      manufactureYear: 2022,
    },
    {
      name: 'Apple MacBook Air 15 M2 8GB/256GB (2023)',
      description: 'MacBook Air 15 inch M2 ra mắt tháng 6/2023 là chiếc MacBook Air màn hình lớn đầu tiên trong lịch sử Apple. Màn hình Liquid Retina 15.3 inch 500 nits tuyệt đẹp, chip M2 GPU 10 nhân, 6 loa stereo với Spatial Audio, pin 18 giờ, trọng lượng chỉ 1.51kg. Lựa chọn lý tưởng cho ai muốn không gian làm việc rộng nhưng vẫn cần sự di động.',
      price: 32990000,
      stock: 45,
      category: 'Laptop',
      brand: 'Apple',
      rating: 4.7,
      numReviews: 89,
      discountPercent: 15,
      isNewArrival: false,
      manufactureYear: 2023,
    },
    {
      name: 'Apple MacBook Pro 14 M3 8GB/512GB (2023)',
      description: 'MacBook Pro 14 inch M3 ra mắt tháng 10/2023 với chip M3 tiến trình 3nm đầu tiên trên MacBook, lần đầu có phiên bản đen tuyền Space Black. Màn hình Liquid Retina XDR 120Hz ProMotion, 3 cổng Thunderbolt 4, HDMI 2.1, đọc thẻ SD, sạc MagSafe 3. Hardware Ray Tracing trên GPU lần đầu xuất hiện trong dòng Mac, pin 22 giờ.',
      price: 44990000,
      stock: 25,
      category: 'Laptop',
      brand: 'Apple',
      rating: 4.8,
      numReviews: 54,
      discountPercent: 10,
      isNewArrival: false,
      manufactureYear: 2023,
    },
    {
      name: 'Apple MacBook Pro 14 M3 Pro 18GB/512GB (2023)',
      description: 'MacBook Pro 14 inch M3 Pro ra mắt tháng 10/2023 với chip M3 Pro 11 nhân CPU 14 nhân GPU — cải tiến lớn cho dân sáng tạo chuyên nghiệp. RAM 18GB hợp nhất, SSD 512GB, màn hình Liquid Retina XDR ProMotion 120Hz, hỗ trợ màn hình ngoài 6K. Thunderbolt 5 (3 cổng), HDMI 2.1, đọc thẻ SD. Lựa chọn cho editor video, kỹ sư và nhà thiết kế 3D.',
      price: 54990000,
      stock: 20,
      category: 'Laptop',
      brand: 'Apple',
      rating: 4.9,
      numReviews: 67,
      discountPercent: 10,
      isNewArrival: false,
      manufactureYear: 2023,
    },

    // ── NĂM 2024 ──────────────────────────────────────────────────────────────

    {
      name: 'Apple MacBook Air 13 M3 16GB/256GB (2024)',
      description: 'MacBook Air M3 13 inch ra mắt tháng 3/2024 với chip M3 tiến trình 3nm, nhanh hơn M2 khoảng 17% đơn nhân và 21% đa nhân. RAM khởi điểm tăng lên 16GB, lần đầu hỗ trợ hai màn hình ngoài đồng thời, Wi-Fi 6E tốc độ cao hơn. Màn hình Liquid Retina 13.6 inch 500 nits, pin 18 giờ, 2 cổng Thunderbolt 4. Có 4 màu mới gồm cả Tím Bình Minh đặc trưng.',
      price: 25490000,
      stock: 70,
      category: 'Laptop',
      brand: 'Apple',
      rating: 4.8,
      numReviews: 112,
      discountPercent: 5,
      isNewArrival: false,
      manufactureYear: 2024,
    },
    {
      name: 'Apple MacBook Air 13 M3 16GB/512GB (2024)',
      description: 'MacBook Air M3 13 inch 512GB ra mắt tháng 3/2024 — cấu hình phổ biến nhất. Chip M3 GPU 10 nhân, RAM 16GB, SSD 512GB, hỗ trợ 2 màn hình ngoài cùng lúc, Wi-Fi 6E. Đây là bản cân bằng nhất giữa dung lượng và hiệu năng trong dòng Air M3. Màn hình Liquid Retina 13.6 inch 500 nits sắc nét, pin trâu 18 giờ. Chính hãng VN/A.',
      price: 31490000,
      stock: 55,
      category: 'Laptop',
      brand: 'Apple',
      rating: 4.9,
      numReviews: 98,
      discountPercent: 0,
      isNewArrival: false,
      manufactureYear: 2024,
    },
    {
      name: 'Apple MacBook Air 15 M3 16GB/256GB (2024)',
      description: 'MacBook Air 15 inch M3 ra mắt tháng 3/2024 mang chip M3 mạnh hơn M2 20% vào khung hình 15 inch. Màn hình Liquid Retina 15.3 inch 500 nits, 6 loa stereo Spatial Audio, pin 18 giờ, trọng lượng 1.51kg, hỗ trợ 2 màn hình ngoài đồng thời với MacBook mở. Lựa chọn tuyệt vời cho sinh viên design, content creator muốn màn hình lớn.',
      price: 32990000,
      stock: 40,
      category: 'Laptop',
      brand: 'Apple',
      rating: 4.8,
      numReviews: 72,
      discountPercent: 5,
      isNewArrival: false,
      manufactureYear: 2024,
    },
    {
      name: 'Apple MacBook Pro 14 M4 16GB/512GB (2024)',
      description: 'MacBook Pro 14 inch M4 ra mắt tháng 11/2024 với chip M4 10 nhân CPU 10 nhân GPU, mạnh hơn M3 25% đơn nhân. Lần đầu RAM khởi điểm tăng lên 16GB trên toàn dòng Pro. Màn hình Liquid Retina XDR ProMotion 120Hz, hỗ trợ Thunderbolt 5 băng thông 120Gb/s, camera Center Stage 12MP. Hỗ trợ đầy đủ Apple Intelligence.',
      price: 44990000,
      stock: 30,
      category: 'Laptop',
      brand: 'Apple',
      rating: 4.8,
      numReviews: 36,
      discountPercent: 5,
      isNewArrival: false,
      manufactureYear: 2024,
    },
    {
      name: 'Apple MacBook Pro 14 M4 Pro 24GB/512GB (2024)',
      description: 'MacBook Pro 14 inch M4 Pro ra mắt tháng 11/2024 với chip M4 Pro 12 nhân CPU 20 nhân GPU mạnh nhất trong dòng 14 inch. RAM 24GB hợp nhất, SSD 512GB, màn hình Liquid Retina XDR 120Hz, Thunderbolt 5 (3 cổng), HDMI 2.1, đọc thẻ SD, pin 22 giờ. Nền tảng lý tưởng cho lập trình viên, kỹ sư ML và nhà thiết kế chuyên nghiệp.',
      price: 54990000,
      stock: 25,
      category: 'Laptop',
      brand: 'Apple',
      rating: 4.9,
      numReviews: 41,
      discountPercent: 0,
      isNewArrival: false,
      manufactureYear: 2024,
    },

    // ── NĂM 2025 ──────────────────────────────────────────────────────────────

    {
      name: 'Apple MacBook Air 13 M4 16GB/256GB (2025)',
      description: 'MacBook Air M4 13 inch ra mắt đầu năm 2025 với chip M4 10 nhân CPU, 8 nhân GPU — mạnh hơn M3 tới 25% đơn nhân và 30% đa nhân. RAM khởi điểm 16GB, thêm cổng Thunderbolt 4 thứ 3, Wi-Fi 6E, camera 12MP Center Stage. Màn hình Liquid Retina 13.6 inch 500 nits sắc nét, pin 18 giờ, có thêm màu Xanh Da Trời (Sky Blue) mới.',
      price: 26999000,
      stock: 80,
      category: 'Laptop',
      brand: 'Apple',
      rating: 4.8,
      numReviews: 34,
      discountPercent: 0,
      isNewArrival: true,
      manufactureYear: 2025,
    },
    {
      name: 'Apple MacBook Air 13 M4 16GB/512GB (2025)',
      description: 'MacBook Air M4 13 inch 512GB ra mắt đầu 2025 — cấu hình bán chạy nhất trong dòng Air M4. Chip M4 GPU 10 nhân, RAM 16GB, SSD 512GB, 3 cổng Thunderbolt 4 (tăng từ 2 cổng), Wi-Fi 6E, camera 12MP. Được Apple ráp tại Việt Nam từ năm 2026. Hiệu năng đủ cho mọi tác vụ sáng tạo từ video 4K đến lập trình AI.',
      price: 31990000,
      stock: 60,
      category: 'Laptop',
      brand: 'Apple',
      rating: 4.9,
      numReviews: 27,
      discountPercent: 0,
      isNewArrival: true,
      manufactureYear: 2025,
    },
    {
      name: 'Apple MacBook Air 15 M4 16GB/512GB (2025)',
      description: 'MacBook Air 15 inch M4 ra mắt đầu 2025 là chiếc Air màn hình lớn mạnh nhất, chip M4 GPU 10 nhân, màn hình Liquid Retina 15.3 inch 500 nits rộng rãi. RAM 16GB, SSD 512GB, 3 cổng Thunderbolt 4, Wi-Fi 6E, 6 loa stereo Spatial Audio, pin 18 giờ. Lý tưởng cho designer, content creator cần không gian màn hình rộng nhưng không muốn mang MacBook Pro nặng.',
      price: 36990000,
      stock: 40,
      category: 'Laptop',
      brand: 'Apple',
      rating: 4.8,
      numReviews: 19,
      discountPercent: 0,
      isNewArrival: true,
      manufactureYear: 2025,
    },
    {
      name: 'Apple MacBook Pro 14 M5 Pro 24GB/512GB (2025)',
      description: 'MacBook Pro 14 inch M5 Pro ra mắt năm 2025 với chip M5 Pro thế hệ mới nhất, nhanh hơn M4 Pro đáng kể. RAM 24GB hợp nhất tốc độ cao, SSD 512GB, màn hình Liquid Retina XDR ProMotion 120Hz cải tiến độ sáng đỉnh. Thunderbolt 5 (3 cổng) băng thông khổng lồ 120Gb/s, camera 12MP, pin 24 giờ. Đỉnh cao cho chuyên gia sáng tạo và kỹ sư phần mềm.',
      price: 59990000,
      stock: 20,
      category: 'Laptop',
      brand: 'Apple',
      rating: 4.9,
      numReviews: 12,
      discountPercent: 0,
      isNewArrival: true,
      manufactureYear: 2025,
    },
    {
      name: 'Apple MacBook Pro 16 M5 Max 48GB/1TB (2025)',
      description: 'MacBook Pro 16 inch M5 Max ra mắt năm 2025 là chiếc MacBook mạnh nhất từng được sản xuất. Chip M5 Max với 16 nhân CPU và 40 nhân GPU, RAM 48GB, SSD 1TB, màn hình Liquid Retina XDR 16.2 inch ProMotion 120Hz độ sáng đỉnh 1600 nits. Thunderbolt 5 (3 cổng), HDMI 2.1, SD card. Dành cho render 3D, phim trường chuyên nghiệp và ML pipeline nặng.',
      price: 99990000,
      stock: 10,
      category: 'Laptop',
      brand: 'Apple',
      rating: 5.0,
      numReviews: 7,
      discountPercent: 0,
      isNewArrival: true,
      manufactureYear: 2025,
    },

  ];

  for (const p of products) {
    const created = await prisma.product.create({ data: p });
    console.log(`  ✅ ${created.name}`);
  }

  console.log(`\n🎉 Done! Seeded ${products.length} sản phẩm Laptop.`);
}

main()
  .catch((e) => { console.error('❌', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });