const fs = require('fs');
const path = require('path');

const dir = './src';
const VI_REGEX = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/;

function walk(d) {
  const files = fs.readdirSync(d);
  files.forEach(f => {
    const full = path.join(d, f);
    if (fs.statSync(full).isDirectory()) {
      walk(full);
    } else if (full.endsWith('.jsx') || full.endsWith('.js')) {
      const content = fs.readFileSync(full, 'utf8');
      if (VI_REGEX.test(content) && !full.includes('locales') && !full.includes('i18n')) {
        console.log(full);
      }
    }
  });
}
walk(dir);
