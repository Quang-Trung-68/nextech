require('dotenv').config();
const prisma = require('./src/utils/prisma');

async function test() {
  const order = await prisma.order.findFirst({
    where: { paymentMethod: 'STRIPE' },
    orderBy: { createdAt: 'desc' },
    include: {
      orderItems: {
        include: { product: true }
      },
      user: true
    }
  });

  if (!order) {
    console.log("No order found");
    return process.exit(0);
  }

  console.log("Found order:", order.id);

  // mock process.env
  process.env.APP_NAME = 'Test App';
  process.env.FRONTEND_URL = 'http://localhost:5173';
  process.env.GMAIL_USER = 'test@example.com';

  try {
    const ejs = require('ejs');
    const path = require('path');
    const templatePath = path.join(__dirname, 'src/templates/orderConfirmation.ejs');
    const html = await ejs.renderFile(templatePath, {
      appName: 'MyShop',
      order: order,
      appUrl: 'http://localhost'
    });
    console.log("EJS Render success! Length:", html.length);
  } catch(e) {
    console.error("EJS Render error:", e.message);
  }
}

test().finally(() => process.exit(0));
