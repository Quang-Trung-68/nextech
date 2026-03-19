const bcrypt = require('bcryptjs');

const prisma = require('../src/utils/prisma');

async function main() {
  console.log('Start seeding...');

  // Hash Passwords
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('Admin123', salt);
  const userPassword = await bcrypt.hash('User123', salt);

  // 1. Create Users
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@test.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  const normalUser = await prisma.user.create({
    data: {
      name: 'Normal User',
      email: 'user@test.com',
      password: userPassword,
      role: 'USER',
    },
  });

  console.log('Created Users:', { admin: admin.email, user: normalUser.email });

  // 2. Create Products
  const products = [
    {
      name: 'iPhone 15 Pro Max',
      description: 'The latest iPhone with A17 Pro chip, titanium design, and a 48MP main camera.',
      price: 1199.99,
      images: ['https://example.com/images/iphone15pro.jpg'],
      stock: 50,
      category: 'Smartphones',
      rating: 4.8,
      numReviews: 12,
    },
    {
      name: 'MacBook Air M2',
      description: 'Supercharged by M2, perfectly portable with all-day battery life.',
      price: 1099.00,
      images: ['https://example.com/images/macbook-air-m2.jpg'],
      stock: 30,
      category: 'Laptops',
      rating: 4.9,
      numReviews: 8,
    },
    {
      name: 'Sony WH-1000XM5',
      description: 'Industry leading noise canceling wireless headphones with up to 30-hour battery life.',
      price: 398.00,
      images: ['https://example.com/images/sony-xm5.jpg'],
      stock: 100,
      category: 'Audio',
      rating: 4.7,
      numReviews: 45,
    },
    {
      name: 'Nintendo Switch OLED',
      description: '7-inch OLED screen, 64GB internal storage, enhanced audio.',
      price: 349.99,
      images: ['https://example.com/images/switch-oled.jpg'],
      stock: 20,
      category: 'Gaming',
      rating: 4.6,
      numReviews: 22,
    },
    {
      name: 'Logitech MX Master 3S',
      description: 'Wireless performance mouse, ultra-fast scrolling, ergonomic design.',
      price: 99.99,
      images: ['https://example.com/images/mx-master-3s.jpg'],
      stock: 150,
      category: 'Accessories',
      rating: 4.8,
      numReviews: 60,
    }
  ];

  for (const p of products) {
    const createdProduct = await prisma.product.create({
      data: p,
    });
    console.log(`Created product: ${createdProduct.name}`);
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
