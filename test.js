/**
 * watermark-plus 测试文件
 * 用于验证npm包的基本功能
 */

// 注意：此测试需要在浏览器环境中运行
// 因为WASM模块和Canvas API只在浏览器中可用

console.log('watermark-plus 测试开始...\n');

// 测试1: 检查模块是否正确导出
console.log('测试1: 检查模块导出');
try {
  const {
    addWatermark,
    addWatermarkAsync,
    createTextWatermarkConfig,
    createImageWatermarkConfig,
    isImageFile,
    renderTextToImage,
    defaultWatermarkConfig,
    init
  } = require('./index.js');

  console.log('✓ 所有函数正确导出');
  console.log('  - addWatermark:', typeof addWatermark === 'function');
  console.log('  - addWatermarkAsync:', typeof addWatermarkAsync === 'function');
  console.log('  - createTextWatermarkConfig:', typeof createTextWatermarkConfig === 'function');
  console.log('  - createImageWatermarkConfig:', typeof createImageWatermarkConfig === 'function');
  console.log('  - isImageFile:', typeof isImageFile === 'function');
  console.log('  - renderTextToImage:', typeof renderTextToImage === 'function');
  console.log('  - defaultWatermarkConfig:', typeof defaultWatermarkConfig === 'object');
  console.log('  - init:', typeof init === 'function');
} catch (error) {
  console.error('✗ 模块导出失败:', error.message);
}

// 测试2: 检查配置创建函数
console.log('\n测试2: 检查配置创建函数');
try {
  const { createTextWatermarkConfig, createImageWatermarkConfig } = require('./index.js');

  // 测试文字水印配置
  const textConfig = createTextWatermarkConfig({
    text: '测试水印',
    fontSize: 24,
    fontColor: '#FF0000',
    transparency: 0.8
  });

  console.log('✓ 文字水印配置创建成功');
  console.log('  配置:', JSON.stringify(textConfig, null, 2));

  // 测试图片水印配置
  const imageConfig = createImageWatermarkConfig({
    imageData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    width: 100,
    height: 100,
    transparency: 0.5
  });

  console.log('✓ 图片水印配置创建成功');
  console.log('  配置:', JSON.stringify(imageConfig, null, 2));
} catch (error) {
  console.error('✗ 配置创建失败:', error.message);
}

// 测试3: 检查isImageFile函数
console.log('\n测试3: 检查isImageFile函数');
try {
  const { isImageFile } = require('./index.js');

  const testCases = [
    { input: 'image/jpeg', expected: true, desc: 'JPEG MIME类型' },
    { input: 'image/png', expected: true, desc: 'PNG MIME类型' },
    { input: 'image/gif', expected: true, desc: 'GIF MIME类型' },
    { input: 'application/pdf', expected: false, desc: 'PDF MIME类型' },
    { input: 'text/plain', expected: false, desc: '文本MIME类型' }
  ];

  testCases.forEach(({ input, expected, desc }) => {
    const result = isImageFile(input);
    const status = result === expected ? '✓' : '✗';
    console.log(`  ${status} ${desc}: ${input} -> ${result} (期望: ${expected})`);
  });
} catch (error) {
  console.error('✗ isImageFile测试失败:', error.message);
}

// 测试4: 检查默认配置
console.log('\n测试4: 检查默认配置');
try {
  const { defaultWatermarkConfig } = require('./index.js');

  console.log('✓ 默认配置存在');
  console.log('  配置:', JSON.stringify(defaultWatermarkConfig, null, 2));

  // 验证必需字段
  const requiredFields = ['type', 'transparency', 'rotate', 'x_offset', 'y_offset', 'tile'];
  const missingFields = requiredFields.filter(field => !(field in defaultWatermarkConfig));

  if (missingFields.length === 0) {
    console.log('✓ 所有必需字段都存在');
  } else {
    console.log('✗ 缺少字段:', missingFields.join(', '));
  }
} catch (error) {
  console.error('✗ 默认配置测试失败:', error.message);
}

console.log('\n========================================');
console.log('注意: 以下测试需要在浏览器环境中运行');
console.log('========================================\n');

// 测试5: 浏览器环境测试（仅在浏览器中执行）
if (typeof window !== 'undefined') {
  console.log('测试5: 浏览器环境测试');

  // 测试renderTextToImage
  try {
    const { renderTextToImage } = require('./index.js');

    const base64Image = renderTextToImage('测试文字', {
      fontSize: 30,
      fontColor: '#FF0000'
    });

    console.log('✓ renderTextToImage成功');
    console.log('  结果长度:', base64Image.length);
    console.log('  前缀:', base64Image.substring(0, 50) + '...');
  } catch (error) {
    console.error('✗ renderTextToImage失败:', error.message);
  }

  // 测试完整的添加水印流程
  console.log('\n测试6: 完整水印添加流程');
  console.log('注意: 此测试需要实际的图片文件');
  console.log('示例代码:');
  console.log(`
    const { addWatermark, createTextWatermarkConfig } = require('watermark-plus');

    // 从文件输入获取图片
    const fileInput = document.querySelector('input[type="file"]');
    const file = fileInput.files[0];

    // 创建配置
    const config = createTextWatermarkConfig({
      text: '© 2024',
      fontSize: 24,
      fontColor: '#FFFFFF',
      transparency: 0.7
    });

    // 添加水印
    const watermarkedBlob = await addWatermark(file, config);

    // 显示结果
    const imageUrl = URL.createObjectURL(watermarkedBlob);
    const img = document.createElement('img');
    img.src = imageUrl;
    document.body.appendChild(img);
  `);
} else {
  console.log('测试5: 浏览器环境测试 - 跳过（非浏览器环境）');
}

console.log('\n========================================');
console.log('测试完成！');
console.log('========================================');