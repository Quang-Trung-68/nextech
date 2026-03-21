const prisma = require('./src/utils/prisma');
const InvoiceService = require('./src/services/invoice.service');

async function main() {
  console.log('🔄 Đang kiểm tra các đơn hàng chưa có Invoice...');
  
  // Lấy tất cả các order chưa có invoice
  const orders = await prisma.order.findMany({
    where: {
      invoice: null
    },
    select: {
      id: true
    }
  });

  if (orders.length === 0) {
    console.log('✅ Tất cả đơn hàng đều đã có Invoice.');
    return;
  }

  console.log(`Tìm thấy ${orders.length} đơn hàng cũ chưa có Invoice. Bắt đầu tạo...`);

  let count = 0;
  for (const { id } of orders) {
    try {
      await prisma.$transaction(async (tx) => {
        await InvoiceService.createDraftForOrder(id, tx);
      });
      count++;
    } catch (err) {
      console.error(`❌ Lỗi khi tạo Invoice cho đơn hàng ${id}:`, err.message);
    }
  }

  console.log(`🎉 Đã tạo thành công Invoice DRAFT cho ${count}/${orders.length} đơn hàng cũ.`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
