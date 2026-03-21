const prisma = require('../src/utils/prisma');

async function main() {
  console.log('🌱 Seeding: tablet (15 sản phẩm)...');

  const products = [

    // ── NĂM 2021/2022 ─────────────────────────────────────────────────────────

    {
      name: 'Apple iPad Mini 6 Wi-Fi 64GB (2021)',
      description: 'iPad Mini 6 ra mắt tháng 9/2021 là bước lột xác thiết kế lớn nhất dòng Mini: màn hình 8.3 inch viền mỏng, Touch ID tích hợp nút nguồn, cổng USB-C lần đầu thay Lightning. Chip A15 Bionic hiệu năng mạnh, hỗ trợ Apple Pencil thế hệ 2. Nhỏ gọn, dễ cầm một tay, lý tưởng cho đọc sách, ghi chú và giải trí di động.',
      price: 14990000,
      stock: 60,
      category: 'tablet',
      brand: 'Apple',
      rating: 4.6,
      numReviews: 167,
      discountPercent: 25,
      isNewArrival: false,
      manufactureYear: 2021,
    },
    {
      name: 'Apple iPad Gen 10 Wi-Fi 64GB (2022)',
      description: 'iPad thế hệ 10 ra mắt tháng 10/2022 là bước cải tiến lớn của dòng iPad phổ thông: thiết kế mới hoàn toàn với màn hình 10.9 inch viền phẳng, chip A14 Bionic, cổng USB-C, màu sắc tươi sáng. Hỗ trợ Wi-Fi 6, camera trước 12MP Center Stage đặt trên cạnh ngang tiện video call. Mức giá tốt nhất để trải nghiệm iPad hiện đại.',
      price: 9990000,
      stock: 120,
      category: 'tablet',
      brand: 'Apple',
      rating: 4.5,
      numReviews: 198,
      discountPercent: 20,
      isNewArrival: false,
      manufactureYear: 2022,
    },
    {
      name: 'Apple iPad Air 5 M1 Wi-Fi 64GB (2022)',
      description: 'iPad Air 5 ra mắt tháng 3/2022 là tablet tầm trung đầu tiên của Apple dùng chip M1, mang lại hiệu năng ngang máy Mac cho người dùng sáng tạo. Màn hình Liquid Retina 10.9 inch 500 nits, Touch ID tích hợp nút nguồn, USB-C, hỗ trợ Apple Pencil thế hệ 2 và Magic Keyboard. Đây là tablet với giá/hiệu năng cực kỳ tốt năm 2022.',
      price: 16990000,
      stock: 80,
      category: 'tablet',
      brand: 'Apple',
      rating: 4.6,
      numReviews: 145,
      discountPercent: 25,
      isNewArrival: false,
      manufactureYear: 2022,
    },
    {
      name: 'Apple iPad Pro M2 11 inch Wi-Fi 128GB (2022)',
      description: 'iPad Pro M2 11 inch ra mắt tháng 10/2022 với chip Apple M2 cho hiệu năng CPU nhanh hơn 15% và GPU nhanh hơn 35% so với M1. Màn hình Liquid Retina XDR ProMotion 120Hz, hỗ trợ Apple Pencil Hover, Face ID, Thunderbolt 4. Độ mỏng 5.9mm, camera sau 12MP + 10MP Ultra Wide. Công cụ chuyên nghiệp cho thiết kế đồ họa và chỉnh sửa video.',
      price: 24990000,
      stock: 40,
      category: 'tablet',
      brand: 'Apple',
      rating: 4.7,
      numReviews: 87,
      discountPercent: 20,
      isNewArrival: false,
      manufactureYear: 2022,
    },
    {
      name: 'Apple iPad Pro M2 12.9 inch Wi-Fi 256GB (2022)',
      description: 'iPad Pro M2 12.9 inch ra mắt tháng 10/2022 với chip M2 mạnh mẽ và màn hình miniLED Liquid Retina XDR Pro 12.9 inch đặc trưng — độ sáng cục bộ 1600 nits. Hỗ trợ Apple Pencil Hover, ProMotion 120Hz, Face ID, Thunderbolt 4, SSD 256GB tốc độ cao. tablet thay thế laptop thực sự cho chuyên gia với màn hình lớn.',
      price: 39990000,
      stock: 25,
      category: 'tablet',
      brand: 'Apple',
      rating: 4.8,
      numReviews: 63,
      discountPercent: 20,
      isNewArrival: false,
      manufactureYear: 2022,
    },

    // ── NĂM 2024 ──────────────────────────────────────────────────────────────

    {
      name: 'Apple iPad Gen 11 Wi-Fi 128GB (2024)',
      description: 'iPad thế hệ 11 ra mắt đầu 2024, nâng cấp quan trọng so với Gen 10: chip A16 Bionic mạnh hơn nhiều, dung lượng khởi điểm tăng lên 128GB, màn hình 10.9 inch Liquid Retina. Hỗ trợ Apple Pencil USB-C và Smart Keyboard, kết nối Wi-Fi 6. Đây là iPad phổ thông giá tốt nhất cho học sinh, sinh viên và gia đình năm 2024.',
      price: 9990000,
      stock: 150,
      category: 'tablet',
      brand: 'Apple',
      rating: 4.5,
      numReviews: 134,
      discountPercent: 0,
      isNewArrival: false,
      manufactureYear: 2024,
    },
    {
      name: 'Apple iPad Mini 7 Wi-Fi 128GB (2024)',
      description: 'iPad Mini 7 ra mắt tháng 10/2024 giữ nguyên thiết kế 8.3 inch nhưng nâng cấp chip lên A17 Pro — cùng chip với iPhone 15 Pro. Lần đầu dòng Mini hỗ trợ Apple Pencil Pro với các tính năng bóp và xoay bút. Apple Intelligence, Wi-Fi 6E, camera sau 12MP. tablet nhỏ gọn mạnh nhất từng có, hoàn hảo cho người hay di chuyển.',
      price: 15990000,
      stock: 70,
      category: 'tablet',
      brand: 'Apple',
      rating: 4.6,
      numReviews: 91,
      discountPercent: 0,
      isNewArrival: false,
      manufactureYear: 2024,
    },
    {
      name: 'Apple iPad Air M2 11 inch Wi-Fi 128GB (2024)',
      description: 'iPad Air M2 11 inch ra mắt tháng 5/2024 là iPad Air đầu tiên có 2 kích thước. Chip M2 CPU 8 nhân, GPU 9 nhân, Neural Engine 40% nhanh hơn M1, RAM 8GB. Màn hình Liquid Retina 11 inch 500 nits, Touch ID, USB-C, Wi-Fi 6E, hỗ trợ Apple Pencil Pro và Magic Keyboard. Tối ưu cho học tập, làm việc văn phòng và sáng tạo nội dung.',
      price: 16999000,
      stock: 75,
      category: 'tablet',
      brand: 'Apple',
      rating: 4.7,
      numReviews: 112,
      discountPercent: 5,
      isNewArrival: false,
      manufactureYear: 2024,
    },
    {
      name: 'Apple iPad Air M2 13 inch Wi-Fi 128GB (2024)',
      description: 'iPad Air M2 13 inch ra mắt tháng 5/2024 là phiên bản màn hình lớn đầu tiên của dòng Air. Màn hình Liquid Retina 13 inch rộng rãi, chip M2 RAM 8GB, USB-C tốc độ cao, hỗ trợ Apple Pencil Pro và Magic Keyboard 13 inch mới. Wi-Fi 6E, camera trước 12MP Center Stage đặt cạnh ngang. Lựa chọn lý tưởng thay thế laptop cho dân văn phòng.',
      price: 22990000,
      stock: 45,
      category: 'tablet',
      brand: 'Apple',
      rating: 4.8,
      numReviews: 56,
      discountPercent: 5,
      isNewArrival: false,
      manufactureYear: 2024,
    },
    {
      name: 'Apple iPad Pro M4 11 inch Wi-Fi 256GB (2024)',
      description: 'iPad Pro M4 11 inch ra mắt tháng 5/2024 đánh dấu bước nhảy vọt thiết kế: mỏng chỉ 5.3mm — mỏng nhất trong lịch sử iPad Pro. Màn hình Ultra Retina XDR OLED Tandem 2 lớp độ tương phản vô cực, chip M4 10 nhân CPU 10 nhân GPU với hiệu năng CPU nhanh hơn M2 50%. Apple Pencil Pro, Magic Keyboard mới, Thunderbolt 4, RAM 8GB.',
      price: 29990000,
      stock: 35,
      category: 'tablet',
      brand: 'Apple',
      rating: 4.9,
      numReviews: 67,
      discountPercent: 0,
      isNewArrival: false,
      manufactureYear: 2024,
    },

    // ── NĂM 2025 ──────────────────────────────────────────────────────────────

    {
      name: 'Apple iPad Air M3 11 inch Wi-Fi 128GB (2025)',
      description: 'iPad Air M3 11 inch ra mắt đầu 2025 với chip M3 CPU 8 nhân GPU 9 nhân mạnh hơn M2 20%, hỗ trợ đầy đủ Apple Intelligence. Màn hình Liquid Retina 11 inch 500 nits, RAM 8GB, dung lượng từ 128GB đến 1TB, Wi-Fi 6E, USB-C. Tương thích Apple Pencil Pro và Magic Keyboard. Lựa chọn "điểm ngọt" hoàn hảo cho sinh viên và dân sáng tạo bán chuyên.',
      price: 18990000,
      stock: 65,
      category: 'tablet',
      brand: 'Apple',
      rating: 4.7,
      numReviews: 38,
      discountPercent: 0,
      isNewArrival: true,
      manufactureYear: 2025,
    },
    {
      name: 'Apple iPad Air M3 13 inch Wi-Fi 256GB (2025)',
      description: 'iPad Air M3 13 inch ra mắt đầu 2025, phiên bản màn hình lớn của dòng Air M3. Màn hình Liquid Retina 13 inch 500 nits rộng rãi, chip M3 RAM 8GB, SSD 256GB, hỗ trợ Apple Intelligence đầy đủ. Wi-Fi 6E, USB-C tốc độ cao, camera trước 12MP Center Stage đặt cạnh ngang. Kết hợp Magic Keyboard biến iPad thành "laptop thu nhỏ" hoàn hảo.',
      price: 24990000,
      stock: 40,
      category: 'tablet',
      brand: 'Apple',
      rating: 4.7,
      numReviews: 24,
      discountPercent: 0,
      isNewArrival: true,
      manufactureYear: 2025,
    },
    {
      name: 'Apple iPad Pro M5 11 inch Wi-Fi 256GB (2025)',
      description: 'iPad Pro M5 11 inch ra mắt mùa thu 2025 với chip Apple M5 được tối ưu đặc biệt cho AI — Neural Engine xử lý 38 nghìn tỷ phép tính/giây. Màn hình Ultra Retina XDR OLED Tandem 120Hz ProMotion, RAM 12GB, Face ID, Thunderbolt 4. Hiệu năng GPU nhanh gấp 4 lần chip M2, hỗ trợ ProRes video quay trực tiếp. Thiết bị AI chuyên nghiệp mạnh nhất trong lịch sử iPad.',
      price: 29999000,
      stock: 45,
      category: 'tablet',
      brand: 'Apple',
      rating: 4.8,
      numReviews: 21,
      discountPercent: 0,
      isNewArrival: true,
      manufactureYear: 2025,
    },
    {
      name: 'Apple iPad Pro M5 13 inch Wi-Fi 256GB (2025)',
      description: 'iPad Pro M5 13 inch ra mắt mùa thu 2025 với màn hình Ultra Retina XDR OLED Tandem 13 inch lớn nhất dòng Pro, chip M5 RAM 12GB, SSD 256GB. Thunderbolt 4 (2 cổng), Face ID, Wi-Fi 7 tốc độ cao hơn Wi-Fi 6E. tablet thay thế laptop thực sự với khả năng đa nhiệm chuyên nghiệp, chạy ứng dụng nặng như DaVinci Resolve và Procreate mượt mà.',
      price: 39999000,
      stock: 20,
      category: 'tablet',
      brand: 'Apple',
      rating: 4.9,
      numReviews: 14,
      discountPercent: 0,
      isNewArrival: true,
      manufactureYear: 2025,
    },
    {
      name: 'Apple iPad Pro M5 13 inch Wi-Fi 512GB (2025)',
      description: 'iPad Pro M5 13 inch 512GB ra mắt mùa thu 2025 — phiên bản flagship tối thượng của dòng iPad. Chip M5 RAM 12GB, SSD 512GB tốc độ cao, màn hình Ultra Retina XDR OLED Tandem 13 inch 120Hz ProMotion, Thunderbolt 4 (2 cổng), Wi-Fi 7. Hỗ trợ Apple Pencil Pro, Magic Keyboard thế hệ mới. Thiết bị lý tưởng cho nhà quay phim, kiến trúc sư và kỹ sư AI chuyên nghiệp.',
      price: 49999000,
      stock: 15,
      category: 'tablet',
      brand: 'Apple',
      rating: 4.9,
      numReviews: 9,
      discountPercent: 0,
      isNewArrival: true,
      manufactureYear: 2025,
    },

  ];

  for (const p of products) {
    const data = { ...p };
    if (data.discountPercent > 0) {
      data.salePrice = data.price - (data.price * data.discountPercent / 100);
    }
    delete data.discountPercent;

    const created = await prisma.product.create({ data });
    console.log(`  ✅ ${created.name}`);
  }

  console.log(`\n🎉 Done! Seeded ${products.length} sản phẩm tablet.`);
}

main()
  .catch((e) => { console.error('❌', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });