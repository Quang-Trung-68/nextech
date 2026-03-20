const prisma = require('./src/utils/prisma');
const { generateAccessToken } = require('./src/utils/jwt');

// 1x1 transparent PNG
const base64Png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

async function testUpload() {
  try {
    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!adminUser) return;
    
    const { token } = generateAccessToken({ userId: adminUser.id, role: adminUser.role });

    const formData = new FormData();
    const buffer = Buffer.from(base64Png, 'base64');
    const blob = new Blob([buffer], { type: 'image/png' });
    formData.append('images', blob, 'test.png');
    
    const uploadRes = await fetch('http://localhost:3000/api/admin/products/upload-images', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    
    const text = await uploadRes.text();
    console.log("Upload Status:", uploadRes.status);
    console.log("Upload Response:", text);
    
  } catch (err) {
    console.error("Fetch Error:", err);
  } finally {
    process.exit(0);
  }
}
testUpload();
