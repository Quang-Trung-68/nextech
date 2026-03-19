const prisma = require('../src/utils/prisma');

async function main() {
  console.log('🌱 Seeding: Điện thoại (15 sản phẩm)...');

  const products = [

    // ── NĂM 2022/2023 ────────────────────────────────────────────────────────

    {
      name: 'Apple iPhone SE 3 64GB (2022)',
      description: 'iPhone SE thế hệ 3 ra mắt tháng 3/2022 là mẫu iPhone giá rẻ nhất của Apple, sử dụng chip A15 Bionic — cùng chip với iPhone 13 Pro. Thiết kế kế thừa iPhone 8 với màn hình 4.7 inch LCD Touch ID quen thuộc, hỗ trợ 5G và sạc nhanh. Lựa chọn entry-level lý tưởng cho người mới dùng iPhone hoặc yêu thích màn hình nhỏ.',
      price: 12990000,
      stock: 200,
      category: 'Điện thoại',
      brand: 'Apple',
      rating: 4.3,
      numReviews: 188,
      discountPercent: 20,
      isNewArrival: false,
      manufactureYear: 2022,
    },
    {
      name: 'Apple iPhone 14 128GB (2022)',
      description: 'iPhone 14 ra mắt tháng 9/2022 với chip A15 Bionic, màn hình Super Retina XDR 6.1 inch, tính năng Crash Detection và Emergency SOS qua vệ tinh lần đầu xuất hiện trên iPhone. Camera chính 12MP khẩu độ f/1.5 cải thiện chụp ảnh đêm đáng kể so với iPhone 13. Kết nối 5G, hỗ trợ sạc MagSafe 15W.',
      price: 17990000,
      stock: 120,
      category: 'Điện thoại',
      brand: 'Apple',
      rating: 4.5,
      numReviews: 145,
      discountPercent: 20,
      isNewArrival: false,
      manufactureYear: 2022,
    },
    {
      name: 'Apple iPhone 14 Plus 128GB (2022)',
      description: 'iPhone 14 Plus ra mắt tháng 10/2022 với màn hình lớn 6.7 inch Super Retina XDR nhưng mức giá thấp hơn Pro Max đáng kể. Chip A15 Bionic, pin dài nhất trong lịch sử dòng Plus (26 giờ xem video), camera kép 12MP. Phù hợp người yêu thích màn hình lớn với ngân sách vừa phải.',
      price: 21990000,
      stock: 80,
      category: 'Điện thoại',
      brand: 'Apple',
      rating: 4.4,
      numReviews: 98,
      discountPercent: 20,
      isNewArrival: false,
      manufactureYear: 2022,
    },
    {
      name: 'Apple iPhone 15 128GB (2023)',
      description: 'iPhone 15 ra mắt tháng 9/2023, lần đầu tiên dòng iPhone thường dùng chip A16 Bionic (vốn là chip của Pro năm trước) và Dynamic Island thay thế tai thỏ. Cổng USB-C thay Lightning, camera chính 48MP lần đầu trên dòng thường, hỗ trợ sạc MagSafe 15W. Màn hình Super Retina XDR 6.1 inch với viền mỏng hơn.',
      price: 22990000,
      stock: 90,
      category: 'Điện thoại',
      brand: 'Apple',
      rating: 4.6,
      numReviews: 167,
      discountPercent: 15,
      isNewArrival: false,
      manufactureYear: 2023,
    },
    {
      name: 'Apple iPhone 15 Pro Max 256GB (2023)',
      description: 'iPhone 15 Pro Max ra mắt tháng 9/2023 là flagship cao cấp nhất của Apple năm đó, sử dụng chip A17 Pro tiến trình 3nm đầu tiên trên smartphone. Khung Titan Grade 5 nhẹ hơn 19g so với thế hệ trước, camera telephoto zoom quang 5x lần đầu trên iPhone, quay video ProRes 4K/60fps trực tiếp lên ổ đĩa ngoài. Dynamic Island và Action Button tiện dụng.',
      price: 34990000,
      stock: 40,
      category: 'Điện thoại',
      brand: 'Apple',
      rating: 4.8,
      numReviews: 134,
      discountPercent: 10,
      isNewArrival: false,
      manufactureYear: 2023,
    },

    // ── NĂM 2024 ──────────────────────────────────────────────────────────────

    {
      name: 'Apple iPhone 16e 128GB (2024)',
      description: 'iPhone 16e ra mắt đầu năm 2024 thay thế dòng SE, trang bị chip A16 Bionic, màn hình OLED 6.1 inch với Dynamic Island — lần đầu xuất hiện trên iPhone phổ thông. Camera đơn 48MP cải tiến đáng kể, hỗ trợ tính năng Apple Intelligence cơ bản, sạc MagSafe 15W. Là cửa ngõ tiếp cận hệ sinh thái Apple Intelligence với mức giá tốt nhất.',
      price: 18990000,
      stock: 180,
      category: 'Điện thoại',
      brand: 'Apple',
      rating: 4.5,
      numReviews: 87,
      discountPercent: 0,
      isNewArrival: false,
      manufactureYear: 2024,
    },
    {
      name: 'Apple iPhone 16 128GB (2024)',
      description: 'iPhone 16 ra mắt tháng 9/2024 với chip A18 trên tiến trình 3nm, là thiết bị đầu tiên được Apple tuyên bố thiết kế riêng cho Apple Intelligence. Cụm camera dọc mới với nút Camera Control vật lý lần đầu xuất hiện, camera chính 48MP f/1.6, video 4K/120fps Dolby Vision. Màn hình Super Retina XDR 6.1 inch 60Hz, pin 22 giờ, sạc MagSafe 25W.',
      price: 22990000,
      stock: 100,
      category: 'Điện thoại',
      brand: 'Apple',
      rating: 4.7,
      numReviews: 89,
      discountPercent: 5,
      isNewArrival: false,
      manufactureYear: 2024,
    },
    {
      name: 'Apple iPhone 16 Plus 128GB (2024)',
      description: 'iPhone 16 Plus ra mắt tháng 9/2024 với màn hình lớn 6.7 inch và pin 27 giờ — lâu nhất trong dòng iPhone 16. Chip A18 hỗ trợ Apple Intelligence đầy đủ, Camera Control vật lý, camera kép 48MP + 12MP góc siêu rộng, video 4K/120fps. Lựa chọn tối ưu cho người muốn màn hình lớn mà không cần zoom Pro.',
      price: 26990000,
      stock: 65,
      category: 'Điện thoại',
      brand: 'Apple',
      rating: 4.7,
      numReviews: 54,
      discountPercent: 5,
      isNewArrival: false,
      manufactureYear: 2024,
    },
    {
      name: 'Apple iPhone 16 Pro 256GB (2024)',
      description: 'iPhone 16 Pro ra mắt tháng 9/2024 với chip A18 Pro và lần đầu nâng kích thước màn hình lên 6.3 inch, hỗ trợ ProMotion 120Hz Always-On Display. Hệ thống camera 3 ống kính bao gồm camera chính 48MP, Ultra Wide 48MP và telephoto 12MP zoom 5x, quay video 4K/120fps ProRes. Hỗ trợ Apple Intelligence toàn diện và sạc MagSafe 25W.',
      price: 29990000,
      stock: 60,
      category: 'Điện thoại',
      brand: 'Apple',
      rating: 4.8,
      numReviews: 76,
      discountPercent: 0,
      isNewArrival: false,
      manufactureYear: 2024,
    },
    {
      name: 'Apple iPhone 16 Pro Max 256GB (2024)',
      description: 'iPhone 16 Pro Max ra mắt tháng 9/2024 với màn hình lớn nhất trong lịch sử iPhone Pro đến thời điểm đó — 6.9 inch ProMotion 120Hz Always-On. Chip A18 Pro, pin 33 giờ xem video, camera telephoto 5x zoom quang, hỗ trợ ghi âm thanh Spatial Audio. Đây là thiết bị đầu tiên được Apple tuyên bố tối ưu toàn diện cho Apple Intelligence.',
      price: 34990000,
      stock: 45,
      category: 'Điện thoại',
      brand: 'Apple',
      rating: 4.9,
      numReviews: 102,
      discountPercent: 0,
      isNewArrival: false,
      manufactureYear: 2024,
    },

    // ── NĂM 2025 ──────────────────────────────────────────────────────────────

    {
      name: 'Apple iPhone 17e 128GB (2025)',
      description: 'iPhone 17e ra mắt tháng 3/2025 là mẫu iPhone giá tốt nhất trong dòng 2025, trang bị chip A16 Bionic, màn hình OLED 6.1 inch Dynamic Island, camera 48MP và hỗ trợ Apple Intelligence cơ bản. Lần đầu iPhone phổ thông có sạc không dây MagSafe 15W ở tầm giá này. Là lựa chọn lý tưởng cho người mới chuyển sang iOS.',
      price: 18990000,
      stock: 200,
      category: 'Điện thoại',
      brand: 'Apple',
      rating: 4.5,
      numReviews: 43,
      discountPercent: 0,
      isNewArrival: true,
      manufactureYear: 2025,
    },
    {
      name: 'Apple iPhone 17 256GB (2025)',
      description: 'iPhone 17 ra mắt tháng 9/2025 với chip A19 trên tiến trình 3nm thế hệ mới, màn hình LTPO 6.3 inch ProMotion 120Hz Always-On Display — lần đầu có mặt trên dòng iPhone thường. Camera kép 48MP cải tiến với camera trước 18MP, hỗ trợ đầy đủ Apple Intelligence. Có trong 5 màu: Tím Oải Hương, Xanh Sage, Xanh Khói, Trắng, Đen.',
      price: 24999000,
      stock: 120,
      category: 'Điện thoại',
      brand: 'Apple',
      rating: 4.7,
      numReviews: 35,
      discountPercent: 0,
      isNewArrival: true,
      manufactureYear: 2025,
    },
    {
      name: 'Apple iPhone Air 256GB (2025)',
      description: 'iPhone Air ra mắt tháng 9/2025 là mẫu iPhone mỏng nhất từ trước đến nay với độ dày chỉ 5.5mm, thay thế dòng Plus. Màn hình LTPO 6.5 inch ProMotion 120Hz, chip A19, RAM 8GB, chỉ hỗ trợ eSIM (không có khe SIM vật lý). Camera đơn 48MP cải tiến và camera trước 18MP, trọng lượng siêu nhẹ. Có 4 màu: Xanh Da Trời, Vàng Nhạt, Trắng, Đen.',
      price: 31999000,
      stock: 70,
      category: 'Điện thoại',
      brand: 'Apple',
      rating: 4.8,
      numReviews: 27,
      discountPercent: 0,
      isNewArrival: true,
      manufactureYear: 2025,
    },
    {
      name: 'Apple iPhone 17 Pro 256GB (2025)',
      description: 'iPhone 17 Pro ra mắt tháng 9/2025 sử dụng chip A19 Pro tiến trình 3nm, màn hình ProMotion 6.3 inch với cải tiến độ sáng đỉnh. Hệ thống camera 3 ống kính 48MP với telephoto zoom quang 8x lần đầu trên dòng Pro không Max, quay video ProRes 4K/120fps. Khung nhôm cao cấp thay Titan, hỗ trợ sạc có dây 40W và MagSafe 25W.',
      price: 34999000,
      stock: 55,
      category: 'Điện thoại',
      brand: 'Apple',
      rating: 4.9,
      numReviews: 19,
      discountPercent: 0,
      isNewArrival: true,
      manufactureYear: 2025,
    },
    {
      name: 'Apple iPhone 17 Pro Max 256GB (2025)',
      description: 'iPhone 17 Pro Max ra mắt tháng 9/2025 là flagship đỉnh cao nhất của Apple, màn hình 6.9 inch ProMotion 120Hz Always-On, chip A19 Pro với RAM 12GB. Camera telephoto độc quyền zoom quang 16x — dài nhất từng xuất hiện trên iPhone, hệ thống Fusion 48MP 3 ống kính. Pin 37 giờ xem video, sạc có dây 40W. Lần đầu Việt Nam mở bán cùng đợt với Mỹ.',
      price: 37999000,
      stock: 50,
      category: 'Điện thoại',
      brand: 'Apple',
      rating: 4.9,
      numReviews: 28,
      discountPercent: 0,
      isNewArrival: true,
      manufactureYear: 2025,
    },

  ];

  for (const p of products) {
    const created = await prisma.product.create({ data: p });
    console.log(`  ✅ ${created.name}`);
  }

  console.log(`\n🎉 Done! Seeded ${products.length} sản phẩm Điện thoại.`);
}

main()
  .catch((e) => { console.error('❌', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });