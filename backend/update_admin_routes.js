const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'src', 'routes');
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.routes.js'));

for (const file of files) {
  const filePath = path.join(routesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  let modified = false;

  // If the file requires { protect, restrictTo } from auth, we might need to add adminProtect
  if (content.includes("restrictTo('ADMIN')")) {
    if (!content.includes('adminProtect')) {
      content = content.replace(
        /const \{.*\} = require\(['"]\.\.\/middleware\/auth['"]\);/,
        match => `${match}\nconst { adminProtect } = require('../middleware/adminAuth');`
      );
    }
    
    // Replace array or inline
    content = content.replace(/protect,\s*restrictTo\('ADMIN'\)/g, 'adminProtect');
    content = content.replace(/protect,\s*\n\s*restrictTo\('ADMIN'\)/g, 'adminProtect');
    
    // Sometimes it's a global use: router.use(protect, restrictTo('ADMIN'))
    content = content.replace(/router\.use\(protect,\s*restrictTo\('ADMIN'\)\);/g, 'router.use(adminProtect);');
    
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  }
}
