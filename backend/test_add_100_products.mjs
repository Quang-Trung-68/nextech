import prisma from './src/utils/prisma.js';

const CATEGORIES = ['smartphone', 'laptop', 'tablet', 'accessory'];
const BRANDS = ['Apple', 'Samsung', 'Sony', 'Dell', 'LG'];

const ADJECTIVES = ['Pro', 'Max', 'Ultra', 'Lite', 'Plus', 'Mini', 'Air', 'Gamer', 'Elite', 'Essential'];
const NOUNS = ['Edition', 'Series', 'X', 'Z', 'S', 'Fold', 'Flip', 'M1', 'M2', 'M3'];

const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomPrice = (min, max) => Math.floor(Math.random() * (max - min) + min);
const getRandomStock = (min, max) => Math.floor(Math.random() * (max - min) + min);

const generateMockProducts = (count) => {
  const products = [];
  for (let i = 0; i < count; i++) {
    const brand = getRandomElement(BRANDS);
    const category = getRandomElement(CATEGORIES);
    const adjective = getRandomElement(ADJECTIVES);
    const noun = getRandomElement(NOUNS);
    
    let baseName = '';
    if (category === 'smartphone') baseName = 'Phone';
    if (category === 'laptop') baseName = 'Book';
    if (category === 'tablet') baseName = 'Pad';
    if (category === 'accessory') baseName = 'Pods';

    const name = `${brand} ${baseName} ${adjective} ${noun} ${i + 1}`;
    
    // Generate realistic prices based on category
    let price = 0;
    if (category === 'smartphone') price = getRandomPrice(5000000, 35000000);
    if (category === 'laptop') price = getRandomPrice(10000000, 60000000);
    if (category === 'tablet') price = getRandomPrice(5000000, 25000000);
    if (category === 'accessory') price = getRandomPrice(200000, 5000000);

    products.push({
      name,
      description: `This is a high-quality ${category} manufactured by ${brand}. Features include incredible performance, stunning display, and all-day battery life.`,
      price: price,
      stock: getRandomStock(10, 200),
      category: category,
      brand: brand,
      rating: parseFloat((Math.random() * 2 + 3).toFixed(1)), // 3.0 to 5.0
      numReviews: getRandomStock(0, 500),
    });
  }
  return products;
};

async function main() {
  console.log('Generating 50 mock products...');
  const mockProducts = generateMockProducts(50);
  
  console.log('Inserting products into database...');
  const result = await prisma.product.createMany({
    data: mockProducts,
  });

  console.log(`Successfully added ${result.count} products!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
