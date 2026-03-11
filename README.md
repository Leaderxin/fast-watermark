# fast-watermark

[![npm version](https://badge.fury.io/js/fast-watermark.svg)](https://www.npmjs.com/package/fast-watermark)
[![npm downloads](https://img.shields.io/npm/dt/fast-watermark.svg)](https://www.npmjs.com/package/fast-watermark)
[![GitHub stars](https://img.shields.io/github/stars/Leaderxin/fast-watermark.svg)](https://github.com/Leaderxin/fast-watermark)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

高性能图片水印库，基于 **Rust + WebAssembly** 实现，支持文字和图片水印。

## ✨ 特性

- 🚀 **高性能** - 基于 Rust + WebAssembly，处理速度比纯 JavaScript 快 10-100 倍
- 🎨 **文字水印** - 支持自定义字体、大小、颜色、不透明度、旋转角度
- 🖼️ **图片水印** - 支持添加图片作为水印，可调整大小和不透明度
- 🔄 **平铺模式** - 支持水印平铺铺满整个图片
- 📍 **精确定位** - 支持精确控制水印位置和偏移
- 📦 **零依赖** - 无需额外依赖，开箱即用
- 🌐 **浏览器支持** - 完美支持现代浏览器
- 📝 **TypeScript 支持** - 完整的类型定义

## 📦 安装

```bash
npm install fast-watermark
# 或
yarn add fast-watermark
# 或
pnpm add fast-watermark
```

## 🚀 快速开始

### 基础使用

```javascript
import { addWatermark, createTextWatermarkConfig } from 'fast-watermark';

// 创建文字水印配置
const config = createTextWatermarkConfig({
  text: '我的水印',
  fontSize: 30,
  fontColor: '#FFFFFF',
  transparency: 0.5,
  batch: true
});

// 添加水印
const watermarkedBlob = await addWatermark(imageFile, config);

// 转换为URL用于显示
const imageUrl = URL.createObjectURL(watermarkedBlob);
```

### Vue 3 示例

```vue
<template>
  <div>
    <input type="file" @change="handleFileChange" accept="image/*">
    <img v-if="resultImage" :src="resultImage" alt="Watermarked Image">
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { addWatermark, createTextWatermarkConfig } from 'fast-watermark';

const resultImage = ref(null);

async function handleFileChange(event) {
  const file = event.target.files[0];
  if (!file) return;

  const config = createTextWatermarkConfig({
    text: '© 2024 My Company',
    fontSize: 24,
    fontColor: 'rgba(255, 255, 255, 0.8)',
    transparency: 0.7,
    rotate: -30,
    batch: true
  });

  const watermarkedBlob = await addWatermark(file, config);
  resultImage.value = URL.createObjectURL(watermarkedBlob);
}
</script>
```

### React 示例

```jsx
import React, { useState } from 'react';
import { addWatermark, createTextWatermarkConfig } from 'fast-watermark';

function WatermarkExample() {
  const [resultImage, setResultImage] = useState(null);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const config = createTextWatermarkConfig({
      text: '© 2024 My Company',
      fontSize: 24,
      fontColor: '#FFFFFF',
      transparency: 0.7,
      rotate: -30,
      batch: true
    });

    const watermarkedBlob = await addWatermark(file, config);
    setResultImage(URL.createObjectURL(watermarkedBlob));
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} accept="image/*" />
      {resultImage && <img src={resultImage} alt="Watermarked Image" />}
    </div>
  );
}
```

## 📖 API 文档

### `addWatermark(image, config)`

添加水印到图片（异步方式）

**参数：**
- `image` (`File | Blob | ArrayBuffer | Uint8Array`) - 图片数据
- `config` (`WatermarkConfig`) - 水印配置对象

**返回：**
- `Promise<Blob>` - 处理后的图片 Blob 对象

**示例：**
```javascript
const blob = await addWatermark(imageFile, config);
```

### `addWatermarkAsync(image, config)`

添加水印到图片（异步方式，使用 WASM 异步函数，适合处理大文件）

**参数：**
- `image` (`File | Blob | ArrayBuffer | Uint8Array`) - 图片数据
- `config` (`WatermarkConfig`) - 水印配置对象

**返回：**
- `Promise<Blob>` - 处理后的图片 Blob 对象

### `addWatermarkWithWorkers(image, config)`

使用 Worker 池添加水印（多线程处理，适合批量处理）

**参数：**
- `image` (`File | Blob | ArrayBuffer | Uint8Array`) - 图片数据
- `config` (`WatermarkConfig`) - 水印配置对象

**返回：**
- `Promise<Blob>` - 处理后的图片 Blob 对象

### `addWatermarkBatch(images, config)`

批量处理多个图片（多线程）

**参数：**
- `images` (`Array<File | Blob | ArrayBuffer | Uint8Array>`) - 图片数组
- `config` (`WatermarkConfig`) - 水印配置对象

**返回：**
- `Promise<Array<Blob>>` - 处理后的图片 Blob 数组

### `initWorkerPool(maxWorkers)`

初始化 Worker 池

**参数：**
- `maxWorkers` (`number`) - 最大 Worker 数量，默认为 CPU 核心数

**返回：**
- `Promise<void>`

### `terminateWorkerPool()`

关闭 Worker 池，释放资源

### `getWorkerPoolStatus()`

获取 Worker 池状态

**返回：**
- `Object` - 包含 `initialized`、`workerCount`、`activeWorkers`、`queueLength` 等信息

### `createTextWatermarkConfig(options)`

创建文字水印配置

**参数：**
- `options` (`TextWatermarkOptions`) - 配置选项

**返回：**
- `TextWatermarkConfig` - 文字水印配置对象

**示例：**
```javascript
const config = createTextWatermarkConfig({
  text: '水印文字',
  fontSize: 30,
  fontColor: '#FFFFFF',
  transparency: 0.5,
  rotate: 0,
  xOffset: 10,
  yOffset: 10,
  batch: false
});
```

### `createImageWatermarkConfig(options)`

创建图片水印配置

**参数：**
- `options` (`ImageWatermarkOptions`) - 配置选项

**返回：**
- `ImageWatermarkConfig` - 图片水印配置对象

**示例：**
```javascript
const config = createImageWatermarkConfig({
  imageData: 'data:image/png;base64,...',
  width: 100,
  height: 100,
  transparency: 0.5,
  rotate: 0,
  xOffset: 10,
  yOffset: 10,
  batch: false
});
```

### `isImageFile(file)`

检查是否为图片文件

**参数：**
- `file` (`File | Blob | string`) - 文件对象或 MIME 类型

**返回：**
- `boolean` - 是否为图片文件

### `renderTextToImage(text, options)`

在浏览器中将文字渲染为图片（base64）

**参数：**
- `text` (`string`) - 要渲染的文字
- `options` (`RenderTextOptions`) - 渲染选项

**返回：**
- `string` - base64 编码的图片数据

## ⚙️ 配置参数

### 文字水印配置 (`TextWatermarkConfig`)

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `type` | `'text'` | `'text'` | 水印类型（固定为 'text'） |
| `text` | `string` | `'水印'` | 水印文字内容 |
| `font` | `string` | `'Arial'` | 字体名称 |
| `font_size` | `number` | `30` | 字体大小（像素） |
| `font_color` | `string` | `'#FFFFFF'` | 字体颜色（十六进制或 rgba） |
| `transparency` | `number` | `0.5` | 不透明度（0-1） |
| `rotate` | `number` | `0` | 旋转角度（度，负值为逆时针） |
| `x_offset` | `number` | `10` | X 轴偏移（像素） |
| `y_offset` | `number` | `10` | Y 轴偏移（像素） |
| `batch` | `boolean` | `false` | 是否平铺水印 |

**注意：** `createTextWatermarkConfig` 函数支持驼峰命名（如 `fontSize`、`fontColor`）和下划线命名（如 `font_size`、`font_color`）两种方式。

### 图片水印配置 (`ImageWatermarkConfig`)

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `type` | `'image'` | `'image'` | 水印类型（固定为 'image'） |
| `image_data` | `string` | - | base64 编码的图片数据（必需） |
| `width` | `number` | - | 水印图片宽度（可选） |
| `height` | `number` | - | 水印图片高度（可选） |
| `transparency` | `number` | `0.5` | 不透明度（0-1） |
| `rotate` | `number` | `0` | 旋转角度（度） |
| `x_offset` | `number` | `10` | X 轴偏移（像素） |
| `y_offset` | `number` | `10` | Y 轴偏移（像素） |
| `batch` | `boolean` | `false` | 是否平铺水印 |

**注意：** `createImageWatermarkConfig` 函数支持驼峰命名（如 `xOffset`、`yOffset`）和下划线命名（如 `x_offset`、`y_offset`）两种方式。

## 🎯 使用场景

### 1. 版权保护

```javascript
const config = createTextWatermarkConfig({
  text: '© 2024 My Company',
  fontSize: 20,
  fontColor: 'rgba(255, 255, 255, 0.6)',
  transparency: 0.6,
  xOffset: 20,
  yOffset: 20
});
```

### 2. 批量处理图片（推荐使用多线程）

```javascript
import { addWatermarkBatch, initWorkerPool, terminateWorkerPool } from 'fast-watermark';

async function processImages(files) {
  // 初始化 Worker 池
  await initWorkerPool();

  const config = createTextWatermarkConfig({
    text: 'Processed',
    fontSize: 24,
    fontColor: '#FFFFFF',
    transparency: 0.5,
    batch: true
  });

  // 使用批量处理 API（多线程）
  const results = await addWatermarkBatch(files, config);

  // 处理完成后关闭 Worker 池
  terminateWorkerPool();

  return results;
}
```

### 3. 添加 Logo 水印

```javascript
// 读取 Logo 图片并转换为 base64
const logoBase64 = await fileToBase64(logoFile);

const config = createImageWatermarkConfig({
  imageData: logoBase64,
  width: 100,
  height: 100,
  transparency: 0.8,
  xOffset: 20,
  yOffset: 20
});

const watermarked = await addWatermark(imageFile, config);
```

### 4. 全屏平铺水印

```javascript
const config = createTextWatermarkConfig({
  text: 'CONFIDENTIAL',
  fontSize: 48,
  fontColor: 'rgba(255, 0, 0, 0.3)',
  transparency: 0.3,
  rotate: -45,
  batch: true,
  xOffset: 200,
  yOffset: 200
});
```

## 🔧 高级用法

### 自定义初始化

默认情况下，WASM 模块会在第一次使用时自动初始化。你也可以手动初始化：

```javascript
import { init } from 'fast-watermark';

// 手动初始化
await init();

// 或指定 WASM 文件路径
await init('/path/to/wasm_watermark_bg.wasm');
```

### 使用底层 WASM 函数

如果需要更底层的控制，可以直接使用 WASM 函数：

```javascript
import { wasmFunctions, imageToUint8Array, uint8ArrayToBlob } from 'fast-watermark';

const imageBytes = await imageToUint8Array(imageFile);
const config = { /* ... */ };

// 直接调用 WASM 函数（异步）
const resultBytes = await wasmFunctions.add_watermark(imageBytes, config);
const resultBlob = uint8ArrayToBlob(resultBytes);
```

### 使用 Worker 池进行多线程处理

对于需要处理大量图片的场景，可以使用 Worker 池来避免阻塞主线程：

```javascript
import {
  initWorkerPool,
  addWatermarkWithWorkers,
  getWorkerPoolStatus,
  terminateWorkerPool
} from 'fast-watermark';

// 初始化 Worker 池（指定最大 Worker 数量）
await initWorkerPool(4);

// 查看状态
console.log(getWorkerPoolStatus());
// { initialized: true, workerCount: 4, activeWorkers: 0, queueLength: 0 }

// 使用 Worker 池处理图片
const result = await addWatermarkWithWorkers(imageFile, config);

// 关闭 Worker 池
terminateWorkerPool();
```

## 📊 性能对比

基于 Rust + WebAssembly 的实现相比纯 JavaScript 实现：

- **处理速度**：快 10-100 倍
- **内存占用**：减少 50-70%
- **文件大小**：WASM 文件仅约 500KB（gzip 后约 150KB）

## 🌐 浏览器支持

- Chrome/Edge 57+
- Firefox 52+
- Safari 11+
- Opera 44+

## 📝 开发

### 构建项目

```bash
# 克隆仓库
git clone https://github.com/Leaderxin/fast-watermark.git
cd fast-watermark

# 安装 Rust 工具链（如果尚未安装）
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 安装 wasm-pack
cargo install wasm-pack

# 添加 wasm32 目标
rustup target add wasm32-unknown-unknown

# 构建 WASM 模块
npm run build

# 或使用开发模式构建
npm run build:dev
```

### 运行测试

```bash
npm test
```

## 🤝 贡献

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 [Apache-2.0](LICENSE) 许可证。

## 🙏 致谢

- [wasm-bindgen](https://github.com/rustwasm/wasm-bindgen) - Rust 和 WebAssembly 之间的绑定
- [image crate](https://github.com/image-rs/image) - Rust 图像处理库

## 📮 联系方式

- 问题反馈：[GitHub Issues](https://github.com/Leaderxin/fast-watermark/issues)
- 邮箱：shazhoulen@outlook.com

---

**Made with ❤️ using Rust + WebAssembly**