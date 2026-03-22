const PDFDocument = require('pdfkit');
const { format } = require('date-fns');
const path = require('path');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Format số tiền VND: 28.000.000 đ
 * @param {number|string|import('@prisma/client').Prisma.Decimal} amount
 * @returns {string}
 */
const formatVND = (amount) => {
  const num = Math.round(Number(amount));
  return num.toLocaleString('vi-VN') + ' đ';
};

/**
 * Format ngày theo DD/MM/YYYY
 * @param {Date|string|null} date
 * @returns {string}
 */
const formatDate = (date) => {
  if (!date) return '';
  return format(new Date(date), 'dd/MM/yyyy');
};

// ─── PDF Service ──────────────────────────────────────────────────────────────

const PdfService = {
  /**
   * Tạo PDF hóa đơn và trả về Buffer.
   * Không ghi file — on-the-fly streaming vào memory.
   *
   * @param {import('@prisma/client').Invoice & { items: import('@prisma/client').InvoiceItem[] }} invoice
   * @returns {Promise<Buffer>}
   */
  generateBuffer(invoice) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });

      // Đăng ký font hỗ trợ Tiếng Việt (Unicode)
      const fontRegular = path.join(__dirname, '../assets/fonts/Roboto-Regular.ttf');
      const fontBold = path.join(__dirname, '../assets/fonts/Roboto-Bold.ttf');
      doc.registerFont('Roboto', fontRegular);
      doc.registerFont('Roboto-Bold', fontBold);

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const isIssued = invoice.status === 'ISSUED';
      const isDraft = invoice.status === 'DRAFT';
      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const margin = 50;
      const contentWidth = pageWidth - margin * 2;

      // ── WATERMARK (chỉ khi DRAFT) ────────────────────────────────────────
      if (isDraft) {
        doc.save();
        doc.opacity(0.12);
        // Note: Watermark font needs to be Roboto as well to support Tiếng Việt if ever needed
        doc.fontSize(80).fillColor('#dddddd').font('Roboto-Bold');
        const watermarkText = 'NHÁP';
        const textWidth = doc.widthOfString(watermarkText);
        const textHeight = 80;
        doc.translate(pageWidth / 2, pageHeight / 2);
        doc.rotate(45);
        doc.text(watermarkText, -textWidth / 2, -textHeight / 2);
        doc.restore();
      }

      // ── HEADER ────────────────────────────────────────────────────────────
      doc.fontSize(20).fillColor('#1d4ed8').font('Roboto-Bold').text('NexTech', margin, margin);

      // Bên phải: tiêu đề + số hóa đơn + ngày
      const rightX = pageWidth / 2;
      const rightWidth = pageWidth / 2 - margin;

      if (isIssued) {
        doc
          .fontSize(14)
          .fillColor('#1e293b')
          .font('Roboto-Bold')
          .text('HÓA ĐƠN BÁN HÀNG (VAT)', rightX, margin, { width: rightWidth, align: 'right' });
      } else {
        doc
          .fontSize(14)
          .fillColor('#aaaaaa')
          .font('Roboto-Bold')
          .text('HÓA ĐƠN NHÁP', rightX, margin, { width: rightWidth, align: 'right' });
      }

      doc
        .fontSize(11)
        .fillColor('#475569')
        .font('Roboto')
        .text(`Số: ${invoice.invoiceNumber}`, rightX, doc.y + 4, { width: rightWidth, align: 'right' });

      const invoiceDate = isIssued ? invoice.issuedAt : invoice.createdAt;
      doc
        .font('Roboto')
        .text(`Ngày: ${formatDate(invoiceDate)}`, rightX, doc.y + 2, { width: rightWidth, align: 'right' });

      doc.moveDown(1);

      // ── ĐƯỜNG KẺ NGANG ────────────────────────────────────────────────────
      const lineY = doc.y + 5;
      doc.moveTo(margin, lineY).lineTo(pageWidth - margin, lineY).strokeColor('#e2e8f0').lineWidth(1).stroke();
      doc.y = lineY + 12;

      // ── THÔNG TIN 2 CỘT (Người bán | Người mua) ──────────────────────────
      const colWidth = (contentWidth - 20) / 2;
      const colLeftX = margin;
      const colRightX = margin + colWidth + 20;
      const infoY = doc.y;

      // Đường kẻ dọc ngăn cách — đủ cao cho COMPANY (5 dòng) hay CÁ NHÂN (3 dòng)
      doc
        .moveTo(margin + colWidth + 10, infoY - 5)
        .lineTo(margin + colWidth + 10, infoY + 160)
        .strokeColor('#e2e8f0')
        .lineWidth(1)
        .stroke();

      // Cột trái — NGƯỜI BÁN
      doc
        .fontSize(9)
        .fillColor('#94a3b8')
        .font('Roboto-Bold')
        .text('NGƯỜI BÁN', colLeftX, infoY, { width: colWidth });

      doc
        .fontSize(11)
        .fillColor('#1e293b')
        .font('Roboto-Bold')
        .text(invoice.sellerName, colLeftX, doc.y + 4, { width: colWidth });

      doc
        .fontSize(10)
        .fillColor('#475569')
        .font('Roboto')
        .text(`MST: ${invoice.sellerTaxCode}`, colLeftX, doc.y + 3, { width: colWidth })
        .text(invoice.sellerAddress, colLeftX, doc.y + 3, { width: colWidth });

      // Cột phải — NGƯỜI MUA
      // Lấy loại người mua từ order (nếu có), fallback: có buyerCompany → COMPANY
      const buyerType = invoice.order?.vatBuyerType
        ?? (invoice.buyerCompany ? 'COMPANY' : 'INDIVIDUAL');
      const buyerTypeLabel = buyerType === 'COMPANY' ? 'DOANH NGHIỆP' : 'CÁ NHÂN';

      doc
        .fontSize(9)
        .fillColor('#94a3b8')
        .font('Roboto-Bold')
        .text(`NGƯỜI MUA — ${buyerTypeLabel}`, colRightX, infoY, { width: colWidth });

      let buyerY = infoY + 13;

      if (buyerType === 'COMPANY') {
        // ── CÔNG TY ──
        // Dòng 1: Tên công ty (nổi bật)
        if (invoice.buyerCompany) {
          doc
            .fontSize(11)
            .fillColor('#1e293b')
            .font('Roboto-Bold')
            .text(invoice.buyerCompany, colRightX, buyerY, { width: colWidth });
          buyerY = doc.y + 2;
        }

        // Dòng 2: Đại diện
        if (invoice.buyerName) {
          doc
            .fontSize(10)
            .fillColor('#475569')
            .font('Roboto')
            .text(`Đại diện: ${invoice.buyerName}`, colRightX, buyerY, { width: colWidth });
          buyerY = doc.y + 2;
        }

        // Dòng 3: MST
        if (invoice.buyerTaxCode) {
          doc
            .fontSize(10)
            .fillColor('#475569')
            .font('Roboto')
            .text(`MST: ${invoice.buyerTaxCode}`, colRightX, buyerY, { width: colWidth });
          buyerY = doc.y + 2;
        }

        // Dòng 4: Địa chỉ công ty
        if (invoice.buyerAddress) {
          doc
            .fontSize(10)
            .fillColor('#475569')
            .font('Roboto')
            .text(invoice.buyerAddress, colRightX, buyerY, { width: colWidth });
          buyerY = doc.y + 2;
        }

        // Dòng 5: Email nhận hóa đơn
        const companyEmail = invoice.order?.vatBuyerEmail ?? invoice.buyerEmail;
        if (companyEmail) {
          doc
            .fontSize(10)
            .fillColor('#475569')
            .font('Roboto')
            .text(`Email HĐ: ${companyEmail}`, colRightX, buyerY, { width: colWidth });
          buyerY = doc.y + 2;
        }
      } else {
        // ── CÁ NHÂN ──
        // Dòng 1: Họ tên
        doc
          .fontSize(11)
          .fillColor('#1e293b')
          .font('Roboto-Bold')
          .text(invoice.buyerName, colRightX, buyerY, { width: colWidth });
        buyerY = doc.y + 2;

        // Dòng 2: Địa chỉ
        if (invoice.buyerAddress) {
          doc
            .fontSize(10)
            .fillColor('#475569')
            .font('Roboto')
            .text(invoice.buyerAddress, colRightX, buyerY, { width: colWidth });
          buyerY = doc.y + 2;
        }

        // Dòng 3: Email (cá nhân — email tài khoản)
        if (invoice.buyerEmail) {
          doc
            .fontSize(10)
            .fillColor('#475569')
            .font('Roboto')
            .text(`Email: ${invoice.buyerEmail}`, colRightX, buyerY, { width: colWidth });
          buyerY = doc.y + 2;
        }
      }

      // Reset Y sau 2 cột — lấy Y lớn hơn để tránh overlap dù buyer có nhiều hay ít dòng
      doc.y = Math.max(buyerY + 8, infoY + 130);

      // ── ĐƯỜNG KẺ NGANG ────────────────────────────────────────────────────
      const line2Y = doc.y;
      doc.moveTo(margin, line2Y).lineTo(pageWidth - margin, line2Y).strokeColor('#e2e8f0').lineWidth(1).stroke();
      doc.y = line2Y + 12;

      // ── BẢNG SẢN PHẨM ────────────────────────────────────────────────────
      // Định nghĩa cột
      const colDefs = [
        { label: 'STT',        width: 30,  align: 'center' },
        { label: 'Tên sản phẩm', width: 160, align: 'left' },
        { label: 'SKU',        width: 70,  align: 'left' },
        { label: 'SL',         width: 30,  align: 'center' },
        { label: 'Đơn giá',    width: 90,  align: 'right' },
        { label: 'Thành tiền', width: 90,  align: 'right' },
      ];

      const tableX = margin;
      const headerHeight = 22;
      const rowHeight = 20;

      // Header background
      doc
        .rect(tableX, doc.y, contentWidth, headerHeight)
        .fillColor('#f5f5f5')
        .fill();

      // Header text
      let curX = tableX + 4;
      const headerY = doc.y + 6;
      colDefs.forEach((col) => {
        doc
          .fontSize(9)
          .fillColor('#1e293b')
          .font('Roboto-Bold')
          .text(col.label, curX, headerY, { width: col.width, align: col.align });
        curX += col.width;
      });

      doc.y = doc.y + headerHeight;

      // Rows
      invoice.items.forEach((item, idx) => {
        const rowY = doc.y;

        doc.fontSize(9).font('Roboto');
        const nameHeight = doc.heightOfString(item.productName, { width: colDefs[1].width, align: colDefs[1].align });
        const dynamicRowHeight = Math.max(20, nameHeight + 10);

        const isAlt = idx % 2 === 1;

        if (isAlt) {
          doc.rect(tableX, rowY, contentWidth, dynamicRowHeight).fillColor('#fafafa').fill();
        }

        curX = tableX + 4;
        const rowData = [
          { value: String(idx + 1), width: colDefs[0].width, align: colDefs[0].align },
          { value: item.productName, width: colDefs[1].width, align: colDefs[1].align },
          { value: item.sku || '—', width: colDefs[2].width, align: colDefs[2].align },
          { value: String(item.quantity), width: colDefs[3].width, align: colDefs[3].align },
          { value: formatVND(item.unitPrice), width: colDefs[4].width, align: colDefs[4].align },
          { value: formatVND(item.totalPrice), width: colDefs[5].width, align: colDefs[5].align },
        ];

        rowData.forEach((cell) => {
          doc
            .fontSize(9)
            .fillColor('#1e293b')
            .font('Roboto')
            .text(cell.value, curX, rowY + 5, { width: cell.width, align: cell.align });
          curX += cell.width;
        });

        // Border bottom
        doc
          .moveTo(tableX, rowY + dynamicRowHeight)
          .lineTo(tableX + contentWidth, rowY + dynamicRowHeight)
          .strokeColor('#e2e8f0')
          .lineWidth(0.5)
          .stroke();

        doc.y = rowY + dynamicRowHeight;
      });

      // ── TỔNG KẾT (căn phải) ──────────────────────────────────────────────
      const summaryX = pageWidth - margin - 220;
      doc.moveDown(1);

      const summaryRow = (label, value, bold = false, large = false) => {
        const labelFont = bold ? 'Roboto-Bold' : 'Roboto';
        const fontSize = large ? 12 : 10;

        doc
          .fontSize(fontSize)
          .fillColor('#64748b')
          .font(labelFont)
          .text(label, summaryX, doc.y, { width: 120, align: 'left', continued: false });

        doc
          .fontSize(fontSize)
          .fillColor(bold && large ? '#1d4ed8' : '#1e293b')
          .font(bold ? 'Roboto-Bold' : 'Roboto')
          .text(value, summaryX + 120, doc.y - (fontSize === 12 ? 14 : 12), { width: 100, align: 'right' });

        doc.moveDown(0.4);
      };

      summaryRow('Tạm tính:', formatVND(invoice.subtotal));

      if (Number(invoice.discountAmount) > 0) {
        summaryRow('Giảm giá:', `-${formatVND(invoice.discountAmount)}`);
      }

      const vatPct = Math.round(Number(invoice.vatRate) * 100);
      summaryRow(`VAT (${vatPct}%):`, formatVND(invoice.vatAmount));

      // Đường kẻ trước tổng cộng
      const totalLineY = doc.y + 2;
      doc
        .moveTo(summaryX, totalLineY)
        .lineTo(pageWidth - margin, totalLineY)
        .strokeColor('#94a3b8')
        .lineWidth(0.8)
        .stroke();
      doc.y = totalLineY + 6;

      summaryRow('TỔNG CỘNG:', formatVND(invoice.totalAmount), true, true);

      // ── FOOTER ───────────────────────────────────────────────────────────
      // Cách lề dưới 20 points tính từ margin. Page break trigger khi doc.y + box_height > pageHeight - margin.
      const footerY = pageHeight - margin - 20;
      doc
        .moveTo(margin, footerY - 15)
        .lineTo(pageWidth - margin, footerY - 15)
        .strokeColor('#e2e8f0')
        .lineWidth(1)
        .stroke();

      doc
        .fontSize(10)
        .fillColor('#94a3b8')
        .font('Roboto')
        .text(
          'Cảm ơn quý khách đã mua hàng tại NexTech!',
          margin,
          footerY,
          { width: contentWidth, align: 'center', lineBreak: false }
        );

      doc.end();
    });
  },
};

module.exports = PdfService;
