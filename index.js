/**
 * fast-watermark
 * 高性能图片水印库，基于Rust + WebAssembly实现
 *
 * @version 0.1.0
 * @license Apache-2.0
 */

let wasmModule = null;
let wasmInitialized = false;

/**
 * 初始化WASM模块
 * @param {string} [wasmPath] - WASM文件路径，默认自动查找
 * @returns {Promise<void>}
 */
async function init(wasmPath) {
  if (wasmInitialized) {
    return;
  }

  try {
    // 动态导入wasm-pack生成的模块
    const wasmPack = await import('./pkg/wasm_watermark.js');
    
    if (wasmPath) {
      await wasmPack.default(wasmPath);
    } else {
      await wasmPack.default();
    }
    
    wasmModule = wasmPack;
    wasmInitialized = true;
  } catch (error) {
    throw new Error(`WASM initialization failed: ${error.message}`);
  }
}

/**
 * 确保WASM已初始化
 * @private
 */
async function ensureInitialized() {
  if (!wasmInitialized) {
    await init();
  }
}

/**
 * 检查是否为图片文件
 * @param {File|Blob|string} file - 文件对象或MIME类型
 * @returns {boolean}
 */
function isImageFile(file) {
  const imageTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/x-icon',
    'image/vnd.microsoft.icon'
  ];

  if (typeof file === 'string') {
    return imageTypes.includes(file.toLowerCase());
  }

  if (file instanceof File || file instanceof Blob) {
    return imageTypes.includes(file.type.toLowerCase());
  }

  return false;
}

/**
 * 将图片数据转换为Uint8Array
 * @param {File|Blob|ArrayBuffer|Uint8Array} imageData - 图片数据
 * @returns {Promise<Uint8Array>}
 */
async function imageToUint8Array(imageData) {
  if (imageData instanceof Uint8Array) {
    return imageData;
  }

  if (imageData instanceof ArrayBuffer) {
    return new Uint8Array(imageData);
  }

  if (imageData instanceof Blob || imageData instanceof File) {
    const arrayBuffer = await imageData.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  }

  throw new Error('Unsupported image data type. Expected File, Blob, ArrayBuffer, or Uint8Array');
}

/**
 * 将Uint8Array转换为Blob
 * @param {Uint8Array} data - 二进制数据
 * @param {string} [mimeType='image/png'] - MIME类型
 * @returns {Blob}
 */
function uint8ArrayToBlob(data, mimeType = 'image/png') {
  return new Blob([data], { type: mimeType });
}

/**
 * 默认水印配置
 */
const defaultWatermarkConfig = {
  type: 'text',
  text: '水印',
  font: 'Arial',
  font_size: 30,
  font_color: '#FFFFFF',
  transparency: 0.5,
  rotate: 0,
  x_offset: 10,
  y_offset: 10,
  tile: false
};

/**
 * 创建文字水印配置
 * @param {Object} options - 配置选项
 * @param {string} options.text - 水印文字
 * @param {number} [options.fontSize=30] - 字体大小
 * @param {string} [options.fontColor='#FFFFFF'] - 字体颜色
 * @param {string} [options.font='Arial'] - 字体名称
 * @param {number} [options.transparency=0.5] - 不透明度(0-1)
 * @param {number} [options.rotate=0] - 旋转角度(度)
 * @param {number} [options.xOffset=10] - X轴偏移(像素)
 * @param {number} [options.yOffset=10] - Y轴偏移(像素)
 * @param {boolean} [options.tile=false] - 是否平铺
 * @returns {Object}
 */
function createTextWatermarkConfig(options = {}) {
  return {
    type: 'text',
    text: options.text || '水印',
    font: options.font || 'Arial',
    font_size: options.fontSize || options.font_size || 30,
    font_color: options.fontColor || options.font_color || '#FFFFFF',
    transparency: options.transparency !== undefined ? options.transparency : 0.5,
    rotate: options.rotate || 0,
    x_offset: options.xOffset || options.x_offset || 10,
    y_offset: options.yOffset || options.y_offset || 10,
    tile: options.tile || false
  };
}

/**
 * 创建图片水印配置
 * @param {Object} options - 配置选项
 * @param {string} options.imageData - base64编码的图片数据
 * @param {number} [options.width] - 水印图片宽度
 * @param {number} [options.height] - 水印图片高度
 * @param {number} [options.transparency=0.5] - 不透明度(0-1)
 * @param {number} [options.rotate=0] - 旋转角度(度)
 * @param {number} [options.xOffset=10] - X轴偏移(像素)
 * @param {number} [options.yOffset=10] - Y轴偏移(像素)
 * @param {boolean} [options.tile=false] - 是否平铺
 * @returns {Object}
 */
function createImageWatermarkConfig(options = {}) {
  if (!options.imageData) {
    throw new Error('imageData is required for image watermark');
  }

  return {
    type: 'image',
    image_data: options.imageData,
    width: options.width,
    height: options.height,
    transparency: options.transparency !== undefined ? options.transparency : 0.5,
    rotate: options.rotate || 0,
    x_offset: options.xOffset || options.x_offset || 10,
    y_offset: options.yOffset || options.y_offset || 10,
    tile: options.tile || false
  };
}

/**
 * 在浏览器中将文字渲染为图片（base64）
 * @param {string} text - 要渲染的文字
 * @param {Object} options - 渲染选项
 * @param {number} [options.fontSize=30] - 字体大小
 * @param {string} [options.fontColor='#FFFFFF'] - 字体颜色
 * @param {string} [options.font='Arial'] - 字体名称
 * @returns {string} base64编码的图片数据
 */
function renderTextToImage(text, options = {}) {
  if (typeof window === 'undefined') {
    throw new Error('renderTextToImage is only available in browser environment');
  }

  const fontSize = options.fontSize || options.font_size || 30;
  const fontColor = options.fontColor || options.font_color || '#FFFFFF';
  const font = options.font || 'Arial';
  const padding = 10;

  // 使用Canvas来精确测量文字尺寸
  const measureCanvas = document.createElement('canvas');
  const measureCtx = measureCanvas.getContext('2d');
  measureCtx.font = `${fontSize}px ${font}`;
  const textMetrics = measureCtx.measureText(text);
  
  // 计算文字的精确宽度和高度
  const textWidth = Math.ceil(textMetrics.width);
  const textHeight = Math.ceil(fontSize * 1.2); // 字体高度的近似值
  
  // 计算SVG的尺寸（包含padding）
  const svgWidth = textWidth + padding * 2;
  const svgHeight = textHeight + padding * 2;

  // 使用SVG来渲染文字（更清晰）
  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}">
      <text x="${padding}" y="${padding}"
            font-family="${font}"
            font-size="${fontSize}"
            fill="${fontColor}"
            font-weight="normal"
            text-anchor="start"
            dominant-baseline="hanging">${text}</text>
    </svg>
  `;

  // 创建SVG Blob
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);

  // // 创建Image来加载SVG
  const img = new Image();
  
  return new Promise((resolve, reject) => {
    img.onload = () => {
      // 创建canvas来绘制SVG
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', {
        alpha: true,
        willReadFrequently: false
      });

      // 设置canvas尺寸
      canvas.width = svgWidth;
      canvas.height = svgHeight;

      // 绘制SVG到canvas
      ctx.drawImage(img, 0, 0);

      // 转换为base64
      const base64Data = canvas.toDataURL('image/png');
      
      // 清理
      URL.revokeObjectURL(svgUrl);
      
      resolve(base64Data);
    };
    
    img.onerror = (error) => {
      reject(error);
    };
    
    img.src = svgUrl;
  });
}

/**
 * 添加水印到图片（同步）
 * @param {File|Blob|ArrayBuffer|Uint8Array} image - 图片数据
 * @param {Object} config - 水印配置
 * @returns {Promise<Blob>} 处理后的图片Blob
 */
async function addWatermark(image, config) {
  await ensureInitialized();

  if (!image) {
    throw new Error('Image data is required');
  }

  if (!config) {
    throw new Error('Watermark config is required');
  }

  // 如果是文字水印且没有image_data，先渲染文字为图片
  if (config.type === 'text' && !config.image_data) {
    const renderedImage = await renderTextToImage(config.text, config);
    config = {
      ...config,
      image_data: renderedImage
    };
  }

  try {
    // 转换图片数据
    const imageBytes = await imageToUint8Array(image);

    // 调用WASM函数
    const resultBytes = wasmModule.add_watermark(imageBytes, config);

    // 转换为Blob
    return uint8ArrayToBlob(resultBytes, 'image/png');
  } catch (error) {
    throw new Error(`Watermark processing failed: ${error.message}`);
  }
}

/**
 * 添加水印到图片（异步）
 * 使用WASM异步函数，适合处理大文件，避免阻塞主线程
 * @param {File|Blob|ArrayBuffer|Uint8Array} image - 图片数据
 * @param {Object} config - 水印配置
 * @returns {Promise<Blob>} 处理后的图片Blob
 */
async function addWatermarkAsync(image, config) {
  await ensureInitialized();

  if (!image) {
    throw new Error('Image data is required');
  }

  if (!config) {
    throw new Error('Watermark config is required');
  }

  // 如果是文字水印且没有image_data，先渲染文字为图片
  if (config.type === 'text' && !config.image_data) {
    const renderedImage = await renderTextToImage(config.text, config);
    config = {
      ...config,
      image_data: renderedImage
    };
  }

  try {
    // 转换图片数据
    const imageBytes = await imageToUint8Array(image);

    // 调用WASM异步函数（使用Promise，适合大文件处理）
    const resultBytes = await wasmModule.add_watermark_async(imageBytes, config);

    // 转换为Blob
    return uint8ArrayToBlob(resultBytes, 'image/png');
  } catch (error) {
    throw new Error(`Watermark processing failed: ${error.message}`);
  }
}

/**
 * WASM底层函数（直接暴露）
 * 这些函数需要先调用init()初始化
 */
const wasmFunctions = {
  /**
   * 直接调用WASM的add_watermark函数
   * @param {Uint8Array} imageData - 图片字节数组
   * @param {Object} config - 水印配置
   * @returns {Uint8Array} 处理后的图片字节数组
   */
  add_watermark: async (imageData, config) => {
    await ensureInitialized();
    return wasmModule.add_watermark(imageData, config);
  },

  /**
   * 直接调用WASM的add_watermark_async函数
   * 使用Promise异步处理，适合大文件
   * @param {Uint8Array} imageData - 图片字节数组
   * @param {Object} config - 水印配置
   * @returns {Promise<Uint8Array>} 处理后的图片字节数组
   */
  add_watermark_async: async (imageData, config) => {
    await ensureInitialized();
    return wasmModule.add_watermark_async(imageData, config);
  }
};

// Web Worker池管理器
let workerPool = null;
let workerPoolInitialized = false;

/**
 * 初始化Worker池
 * @param {number} [maxWorkers] - 最大Worker数量，默认为CPU核心数
 * @returns {Promise<void>}
 */
async function initWorkerPool(maxWorkers) {
  if (workerPoolInitialized) {
    return;
  }

  try {
    // 动态导入Worker池
    const { WorkerPool } = await import('./worker-pool.js');
    workerPool = new WorkerPool('./watermark-worker.js', maxWorkers);
    await workerPool.init();
    workerPoolInitialized = true;
  } catch (error) {
    throw new Error(`Worker pool initialization failed: ${error.message}`);
  }
}

/**
 * 确保Worker池已初始化
 * @private
 */
async function ensureWorkerPoolInitialized() {
  if (!workerPoolInitialized) {
    await initWorkerPool();
  }
}

/**
 * 使用Worker池添加水印（多线程）
 * @param {File|Blob|ArrayBuffer|Uint8Array} image - 图片数据
 * @param {Object} config - 水印配置
 * @returns {Promise<Blob>} 处理后的图片Blob
 */
async function addWatermarkWithWorkers(image, config) {
  await ensureWorkerPoolInitialized();

  if (!image) {
    throw new Error('Image data is required');
  }

  if (!config) {
    throw new Error('Watermark config is required');
  }

  // 如果是文字水印且没有image_data，先渲染文字为图片
  if (config.type === 'text' && !config.image_data) {
    config = {
      ...config,
      image_data: await renderTextToImage(config.text, config)
    };
  }

  try {
      // 转换图片数据
      const imageBytes = await imageToUint8Array(image);
      
      // 使用Worker池处理
      const resultBytes = await workerPool.addTask(imageBytes, config);
      
      // 转换为Blob（检查是否为 Transferable Object）
      const blobData = resultBytes instanceof Uint8Array ? resultBytes : new Uint8Array(resultBytes);
      return uint8ArrayToBlob(blobData, 'image/png');
  } catch (error) {
      throw new Error(`Watermark processing failed: ${error.message}`);
  }
}

/**
 * 批量处理多个图片（多线程）
 * @param {Array<File|Blob|ArrayBuffer|Uint8Array>} images - 图片数组
 * @param {Object} config - 水印配置
 * @returns {Promise<Array<Blob>>} 处理后的图片Blob数组
 */
async function addWatermarkBatch(images, config) {
  await ensureWorkerPoolInitialized();

  if (!images || !Array.isArray(images) || images.length === 0) {
    throw new Error('Images array is required');
  }

  if (!config) {
    throw new Error('Watermark config is required');
  }

  // 如果是文字水印且没有image_data，先渲染文字为图片
  if (config.type === 'text' && !config.image_data) {
    config = {
      ...config,
      image_data: await renderTextToImage(config.text, config)
    };
  }

  try {
      // 转换所有图片数据
      const imageBytesArray = await Promise.all(
          images.map(img => imageToUint8Array(img))
      );
      
      // 使用Worker池批量处理
      const resultBytesArray = await workerPool.processBatch(imageBytesArray, config);
      
      // 转换为Blob数组（检查是否为 Transferable Object）
      return resultBytesArray.map(bytes => {
          const blobData = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
          return uint8ArrayToBlob(blobData, 'image/png');
      });
  } catch (error) {
      throw new Error(`Batch watermark processing failed: ${error.message}`);
  }
}

/**
 * 关闭Worker池
 */
function terminateWorkerPool() {
  if (workerPool) {
    workerPool.terminate();
    workerPool = null;
    workerPoolInitialized = false;
  }
}

/**
 * 获取Worker池状态
 * @returns {Object} Worker池状态信息
 */
function getWorkerPoolStatus() {
  if (!workerPool) {
    return {
      initialized: false,
      workerCount: 0,
      activeWorkers: 0,
      queueLength: 0
    };
  }

  return {
    initialized: workerPoolInitialized,
    workerCount: workerPool.getWorkerCount(),
    activeWorkers: workerPool.getActiveWorkerCount(),
    queueLength: workerPool.getQueueLength()
  };
}

// 导出所有功能
export {
  // 初始化
  init,
  init as default,
  
  // 主要功能
  addWatermark,
  addWatermarkAsync,
  addWatermarkWithWorkers,
  addWatermarkBatch,
  
  // Worker池管理
  initWorkerPool,
  terminateWorkerPool,
  getWorkerPoolStatus,
  
  // 辅助功能
  isImageFile,
  renderTextToImage,
  imageToUint8Array,
  uint8ArrayToBlob,
  
  // 配置
  defaultWatermarkConfig,
  createTextWatermarkConfig,
  createImageWatermarkConfig,
  
  // WASM底层函数
  wasmFunctions
};

// 兼容旧版本的导出 - 使用单独的export语句
export const add_watermark = wasmFunctions.add_watermark;
export const add_watermark_async = wasmFunctions.add_watermark_async;

// CommonJS兼容性（用于Node.js环境）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    init,
    default: init,
    addWatermark,
    addWatermarkAsync,
    addWatermarkWithWorkers,
    addWatermarkBatch,
    initWorkerPool,
    terminateWorkerPool,
    getWorkerPoolStatus,
    isImageFile,
    renderTextToImage,
    imageToUint8Array,
    uint8ArrayToBlob,
    defaultWatermarkConfig,
    createTextWatermarkConfig,
    createImageWatermarkConfig,
    wasmFunctions,
    add_watermark: wasmFunctions.add_watermark,
    add_watermark_async: wasmFunctions.add_watermark_async
  };
}