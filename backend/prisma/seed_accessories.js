const prisma = require('../src/utils/prisma');

async function main() {
  console.log('🌱 Seeding: accessory (15 sản phẩm)...');

  const products = [

    // ── NĂM 2021/2022 ─────────────────────────────────────────────────────────

    {
      name: 'Apple AirTag 1 Pack (2021)',
      description: 'AirTag ra mắt tháng 4/2021 là thiết bị định vị thông minh của Apple, tích hợp chip U1 Ultra Wideband và Bluetooth. Gắn vào chìa khóa, ví, hành lý để định vị chính xác qua ứng dụng Find My. Tính năng Precision Finding chỉ hướng bằng mũi tên trực quan trên iPhone. Chống nước IP67, pin CR2032 dùng trên 1 năm. Giá rẻ nhất trong accessory Apple.',
      price: 890000,
      stock: 300,
      category: 'accessory',
      brand: 'Apple',
      rating: 4.7,
      numReviews: 289,
      discountPercent: 10,
      isNewArrival: false,
      manufactureYear: 2021,
    },
    {
      name: 'Apple AirTag 4 Pack (2021)',
      description: 'Combo 4 AirTag ra mắt năm 2021, tiết kiệm hơn mua lẻ — phù hợp để gắn nhiều vật dụng quan trọng cùng lúc. Mỗi AirTag tích hợp chip U1, loa tích hợp để phát âm thanh định vị, chống nước IP67, pin 1 năm. Sử dụng mạng lưới Find My hàng triệu thiết bị Apple toàn cầu. Hỗ trợ Precision Finding chỉ hướng chính xác trên iPhone có chip U1.',
      price: 2990000,
      stock: 200,
      category: 'accessory',
      brand: 'Apple',
      rating: 4.7,
      numReviews: 189,
      discountPercent: 10,
      isNewArrival: false,
      manufactureYear: 2021,
    },
    {
      name: 'Apple AirPods 3 Lightning (2021)',
      description: 'AirPods thế hệ 3 ra mắt tháng 10/2021 với thiết kế cuống ngắn giống AirPods Pro nhưng không có nút tai. Chip H1, Spatial Audio với dynamic head tracking lần đầu trên AirPods thường, Adaptive EQ, chống nước IPX4. Pin 6 giờ/tổng 30 giờ với hộp sạc. Lựa chọn open-ear thoải mái nhất trong tầm giá dưới 4 triệu của Apple.',
      price: 3490000,
      stock: 100,
      category: 'accessory',
      brand: 'Apple',
      rating: 4.5,
      numReviews: 256,
      discountPercent: 20,
      isNewArrival: false,
      manufactureYear: 2021,
    },
    {
      name: 'Apple Watch Series 9 41mm GPS (2023)',
      description: 'Apple Watch Series 9 ra mắt tháng 9/2023 với chip S9 SiP mới giúp màn hình sáng gấp đôi (lên đến 2000 nits) và tính năng Double Tap điều khiển bằng cử chỉ ngón tay mà không cần chạm màn hình. Màn hình LTPO Always-On 41mm, theo dõi sức khỏe toàn diện, phát hiện va chạm, Emergency SOS qua vệ tinh. Pin 18 giờ, sạc nhanh 0-80% trong 45 phút.',
      price: 10990000,
      stock: 80,
      category: 'accessory',
      brand: 'Apple',
      rating: 4.7,
      numReviews: 143,
      discountPercent: 15,
      isNewArrival: false,
      manufactureYear: 2023,
    },
    {
      name: 'Apple AirPods Pro 2 USB-C (2023)',
      description: 'AirPods Pro thế hệ 2 phiên bản USB-C ra mắt tháng 9/2023, cập nhật đồng bộ cổng sạc với iPhone 15. Chip H2 với ANC mạnh gấp đôi thế hệ trước, Adaptive Audio tự điều chỉnh theo môi trường, Conversation Awareness nhận biết hội thoại. Tính năng sức khỏe thính giác tiên phong: Hearing Test, Hearing Aid, Hearing Protection. Chống nước IP54 tai nghe và hộp sạc.',
      price: 5490000,
      stock: 150,
      category: 'accessory',
      brand: 'Apple',
      rating: 4.8,
      numReviews: 312,
      discountPercent: 15,
      isNewArrival: false,
      manufactureYear: 2023,
    },

    // ── NĂM 2024 ──────────────────────────────────────────────────────────────

    {
      name: 'Apple Watch SE 3 40mm GPS (2024)',
      description: 'Apple Watch SE thế hệ 3 ra mắt năm 2024 là lối vào hệ sinh thái Apple Watch với mức giá hợp lý nhất. Chip S9, màn hình Retina 40mm, theo dõi nhịp tim, SpO2, phát hiện té ngã và va chạm, Emergency SOS qua vệ tinh. Thiếu màn hình Always-On và ECG so với Series nhưng vẫn đủ cho 90% nhu cầu theo dõi sức khỏe hàng ngày. Pin 18 giờ.',
      price: 6990000,
      stock: 100,
      category: 'accessory',
      brand: 'Apple',
      rating: 4.5,
      numReviews: 112,
      discountPercent: 5,
      isNewArrival: false,
      manufactureYear: 2024,
    },
    {
      name: 'Apple AirPods 4 (không ANC) USB-C (2024)',
      description: 'AirPods 4 tiêu chuẩn ra mắt tháng 9/2024 với chip H2, thiết kế open-ear mới tối ưu từ dữ liệu hàng triệu người dùng — thoải mái hơn thế hệ trước. Spatial Audio, Adaptive EQ, Conversation Awareness, Personalised Volume, pin 30 giờ tổng, cổng USB-C. Không có ANC nhưng là lựa chọn tốt nhất cho người muốn tai nghe nhạc thoải mái suốt ngày.',
      price: 3590000,
      stock: 180,
      category: 'accessory',
      brand: 'Apple',
      rating: 4.4,
      numReviews: 134,
      discountPercent: 0,
      isNewArrival: false,
      manufactureYear: 2024,
    },
    {
      name: 'Apple AirPods 4 ANC USB-C (2024)',
      description: 'AirPods 4 ANC ra mắt tháng 9/2024 — lần đầu tiên Apple tích hợp chống ồn chủ động (ANC) vào tai nghe open-ear, vốn chỉ có trên Pro. Chip H2, ANC và Transparency Mode, Spatial Audio, Conversation Awareness, pin 30 giờ tổng, USB-C, chống nước IP54, tìm tai nghe bằng âm thanh trong hộp sạc. Khoảng cách giá với Pro 2 chỉ còn hơn 1 triệu.',
      price: 4790000,
      stock: 200,
      category: 'accessory',
      brand: 'Apple',
      rating: 4.6,
      numReviews: 178,
      discountPercent: 0,
      isNewArrival: false,
      manufactureYear: 2024,
    },
    {
      name: 'Apple AirPods Max USB-C (2024)',
      description: 'AirPods Max phiên bản USB-C ra mắt tháng 9/2024 cập nhật cổng sạc từ Lightning sang USB-C. Tai nghe chụp tai over-ear cao cấp nhất của Apple với driver 40mm do Apple thiết kế, ANC mạnh nhất trong dòng AirPods, Spatial Audio động với theo dõi đầu, 8 micro hướng chùm sóng. Khung nhôm và lưới đệm tai thở thoải mái dài giờ. Pin 20 giờ ANC.',
      price: 13990000,
      stock: 30,
      category: 'accessory',
      brand: 'Apple',
      rating: 4.7,
      numReviews: 56,
      discountPercent: 0,
      isNewArrival: false,
      manufactureYear: 2024,
    },
    {
      name: 'Apple Watch Series 10 42mm GPS (2024)',
      description: 'Apple Watch Series 10 ra mắt tháng 9/2024 là chiếc Apple Watch mỏng nhất từ trước đến nay. Màn hình LTPO OLED lớn hơn và sáng hơn trong thiết kế mỏng đáng kể so với Series 9, tính năng phát hiện ngưng thở khi ngủ lần đầu xuất hiện. Chip S10, sạc nhanh 0-80% chỉ trong 30 phút, pin 18 giờ, chống nước 50m, có thêm màu Rose Gold đặc biệt.',
      price: 10990000,
      stock: 70,
      category: 'accessory',
      brand: 'Apple',
      rating: 4.7,
      numReviews: 87,
      discountPercent: 5,
      isNewArrival: false,
      manufactureYear: 2024,
    },

    // ── NĂM 2025 ──────────────────────────────────────────────────────────────

    {
      name: 'Apple AirTag Gen 2 1 Pack (2025)',
      description: 'AirTag thế hệ 2 ra mắt năm 2025 với cải tiến đáng kể so với thế hệ đầu: phạm vi phát hiện rộng hơn 1.5x nhờ chip U2 cải tiến, loa to hơn 50% dễ nghe hơn khi định vị. Chống nước nâng cấp lên IP67, thiết kế gọn nhẹ hơn nhẹ. Vẫn dùng pin CR2032 dùng 1 năm, tích hợp Find My toàn cầu. Giá không đổi, giá trị tăng đáng kể.',
      price: 890000,
      stock: 300,
      category: 'accessory',
      brand: 'Apple',
      rating: 4.7,
      numReviews: 52,
      discountPercent: 0,
      isNewArrival: true,
      manufactureYear: 2025,
    },
    {
      name: 'Apple AirPods Pro 3 USB-C (2025)',
      description: 'AirPods Pro thế hệ 3 ra mắt năm 2025 với chip H3 mới nâng ANC lên mức đỉnh cao mới, mạnh hơn thế hệ 2 đáng kể. Hearing Health Suite toàn diện: kiểm tra thính lực, hỗ trợ trợ thính không kê đơn, bảo vệ thính giác chủ động. Spatial Audio cá nhân hóa cải tiến, chống nước IP54, hộp sạc USB-C hỗ trợ Qi2. Pin 6 giờ ANC, tổng 36 giờ với hộp sạc.',
      price: 6790000,
      stock: 120,
      category: 'accessory',
      brand: 'Apple',
      rating: 4.8,
      numReviews: 67,
      discountPercent: 0,
      isNewArrival: true,
      manufactureYear: 2025,
    },
    {
      name: 'Apple Watch Series 11 42mm GPS (2025)',
      description: 'Apple Watch Series 11 ra mắt tháng 9/2025 với chip S11 mới, màn hình LTPO OLED sáng hơn 30% so với Series 10. Thêm cảm biến theo dõi huyết áp — tính năng được chờ đợi từ lâu. Tích hợp Apple Intelligence cho phép trả lời thông báo thông minh và tóm tắt hoạt động. Pin 20 giờ cải tiến, sạc 0-80% trong 30 phút, cổng USB-C.',
      price: 11990000,
      stock: 60,
      category: 'accessory',
      brand: 'Apple',
      rating: 4.7,
      numReviews: 31,
      discountPercent: 0,
      isNewArrival: true,
      manufactureYear: 2025,
    },
    {
      name: 'Apple Watch Ultra 3 49mm Titanium (2025)',
      description: 'Apple Watch Ultra 3 ra mắt năm 2025 là đồng hồ thể thao chuyên nghiệp đỉnh cao nhất của Apple. Khung Titan cấp hàng không, màn hình LTPO MicroLED 49mm độ sáng 3000 nits, pin 72 giờ (chế độ bình thường) hoặc 60 ngày (ultra-low power mode). Lặn sâu 100m, GPS đa băng tần chính xác, Action Button và cảm biến nhiệt độ, độ cao, la bàn. Dành cho vận động viên chuyên nghiệp.',
      price: 27990000,
      stock: 20,
      category: 'accessory',
      brand: 'Apple',
      rating: 4.9,
      numReviews: 21,
      discountPercent: 0,
      isNewArrival: true,
      manufactureYear: 2025,
    },
    {
      name: 'Apple AirPods Max 2 USB-C (2026)',
      description: 'AirPods Max thế hệ 2 ra mắt đầu 2026 là bản nâng cấp lớn sau nhiều năm: chip H3 mới với ANC cải tiến mạnh hơn, Spatial Audio cá nhân hóa thế hệ 2, Bluetooth 5.4 độ trễ thấp hơn. Thiết kế khung nhôm và lưới đệm tai giữ nguyên nhưng nhẹ hơn, hộp đựng mới tiện lợi hơn. Cổng USB-C, pin 25 giờ ANC. Vẫn là tai nghe chụp tai tốt nhất trong hệ sinh thái Apple.',
      price: 14990000,
      stock: 20,
      category: 'accessory',
      brand: 'Apple',
      rating: 4.8,
      numReviews: 14,
      discountPercent: 0,
      isNewArrival: true,
      manufactureYear: 2026,
    },

  ];

  for (const p of products) {
    const created = await prisma.product.create({ data: p });
    console.log(`  ✅ ${created.name}`);
  }

  console.log(`\n🎉 Done! Seeded ${products.length} sản phẩm accessory.`);
}

main()
  .catch((e) => { console.error('❌', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });