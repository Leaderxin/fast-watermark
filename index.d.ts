/**
 * fast-watermark TypeScript类型定义
 * @version 0.1.0
 */

/**
 * 水印配置基础接口
 */
export interface BaseWatermarkConfig {
  /** 不透明度 (0-1) */
  transparency?: number;
  /** 旋转角度 (度) */
  rotate?: number;
  /** X轴偏移 (像素) */
  x_offset?: number;
  /** Y轴偏移 (像素) */
  y_offset?: number;
  /** 是否平铺 */
  tile?: boolean;
}

/**
 * 文字水印配置
 */
export interface TextWatermarkConfig extends BaseWatermarkConfig {
  /** 水印类型 */
  type: 'text';
  /** 水印文字 */
  text: string;
  /** 字体名称 */
  font?: string;
  /** 字体大小 */
  font_size?: number;
  /** 字体颜色 (十六进制) */
  font_color?: string;
}

/**
 * 图片水印配置
 */
export interface ImageWatermarkConfig extends BaseWatermarkConfig {
  /** 水印类型 */
  type: 'image';
  /** base64编码的图片数据 */
  image_data: string;
  /** 水印图片宽度 */
  width?: number;
  /** 水印图片高度 */
  height?: number;
}

/**
 * 水印配置联合类型
 */
export type WatermarkConfig = TextWatermarkConfig | ImageWatermarkConfig;

/**
 * 文字水印配置选项
 */
export interface TextWatermarkOptions {
  /** 水印文字 */
  text: string;
  /** 字体大小 */
  fontSize?: number;
  /** 字体颜色 */
  fontColor?: string;
  /** 字体名称 */
  font?: string;
  /** 不透明度 (0-1) */
  transparency?: number;
  /** 旋转角度 (度) */
  rotate?: number;
  /** X轴偏移 (像素) */
  xOffset?: number;
  /** Y轴偏移 (像素) */
  yOffset?: number;
  /** 是否平铺 */
  tile?: boolean;
}

/**
 * 图片水印配置选项
 */
export interface ImageWatermarkOptions {
  /** base64编码的图片数据 */
  imageData: string;
  /** 水印图片宽度 */
  width?: number;
  /** 水印图片高度 */
  height?: number;
  /** 不透明度 (0-1) */
  transparency?: number;
  /** 旋转角度 (度) */
  rotate?: number;
  /** X轴偏移 (像素) */
  xOffset?: number;
  /** Y轴偏移 (像素) */
  yOffset?: number;
  /** 是否平铺 */
  tile?: boolean;
}

/**
 * 文字渲染选项
 */
export interface RenderTextOptions {
  /** 字体大小 */
  fontSize?: number;
  /** 字体颜色 */
  fontColor?: string;
  /** 字体名称 */
  font?: string;
}

/**
 * Worker池状态
 */
export interface WorkerPoolStatus {
  /** 是否已初始化 */
  initialized: boolean;
  /** Worker数量 */
  workerCount: number;
  /** 活跃的Worker数量 */
  activeWorkers: number;
  /** 队列长度 */
  queueLength: number;
}

/**
 * WASM函数接口
 */
export interface WasmFunctions {
  /**
   * 直接调用WASM的add_watermark函数
   * @param imageData - 图片字节数组
   * @param config - 水印配置
   * @returns 处理后的图片字节数组
   */
  add_watermark(imageData: Uint8Array, config: WatermarkConfig): Uint8Array;

  /**
   * 直接调用WASM的add_watermark_async函数
   * @param imageData - 图片字节数组
   * @param config - 水印配置
   * @returns 处理后的图片字节数组
   */
  add_watermark_async(imageData: Uint8Array, config: WatermarkConfig): Promise<Uint8Array>;
}

/**
 * 初始化WASM模块
 * @param wasmPath - WASM文件路径，默认自动查找
 * @returns Promise<void>
 */
export function init(wasmPath?: string): Promise<void>;

/**
 * 默认导出（与init相同）
 */
export default function init(wasmPath?: string): Promise<void>;

/**
 * 检查是否为图片文件
 * @param file - 文件对象或MIME类型
 * @returns 是否为图片文件
 */
export function isImageFile(file: File | Blob | string): boolean;

/**
 * 将图片数据转换为Uint8Array
 * @param imageData - 图片数据
 * @returns Uint8Array
 */
export function imageToUint8Array(imageData: File | Blob | ArrayBuffer | Uint8Array): Promise<Uint8Array>;

/**
 * 将Uint8Array转换为Blob
 * @param data - 二进制数据
 * @param mimeType - MIME类型
 * @returns Blob
 */
export function uint8ArrayToBlob(data: Uint8Array, mimeType?: string): Blob;

/**
 * 默认水印配置
 */
export const defaultWatermarkConfig: WatermarkConfig;

/**
 * 创建文字水印配置
 * @param options - 配置选项
 * @returns 文字水印配置
 */
export function createTextWatermarkConfig(options?: TextWatermarkOptions): TextWatermarkConfig;

/**
 * 创建图片水印配置
 * @param options - 配置选项
 * @returns 图片水印配置
 */
export function createImageWatermarkConfig(options: ImageWatermarkOptions): ImageWatermarkConfig;

/**
 * 在浏览器中将文字渲染为图片（base64）
 * @param text - 要渲染的文字
 * @param options - 渲染选项
 * @returns base64编码的图片数据
 */
export function renderTextToImage(text: string, options?: RenderTextOptions): string;

/**
 * 添加水印到图片（同步）
 * @param image - 图片数据
 * @param config - 水印配置
 * @returns 处理后的图片Blob
 */
export function addWatermark(image: File | Blob | ArrayBuffer | Uint8Array, config: WatermarkConfig): Promise<Blob>;

/**
 * 添加水印到图片（异步）
 * @param image - 图片数据
 * @param config - 水印配置
 * @returns 处理后的图片Blob
 */
export function addWatermarkAsync(image: File | Blob | ArrayBuffer | Uint8Array, config: WatermarkConfig): Promise<Blob>;

/**
 * 使用Worker池添加水印（多线程处理）
 * @param image - 图片数据
 * @param config - 水印配置
 * @returns 处理后的图片Blob
 */
export function addWatermarkWithWorkers(image: File | Blob | ArrayBuffer | Uint8Array, config: WatermarkConfig): Promise<Blob>;

/**
 * 批量处理多个图片（多线程）
 * @param images - 图片数组
 * @param config - 水印配置
 * @returns 处理后的图片Blob数组
 */
export function addWatermarkBatch(images: Array<File | Blob | ArrayBuffer | Uint8Array>, config: WatermarkConfig): Promise<Array<Blob>>;

/**
 * 初始化Worker池
 * @param maxWorkers - 最大Worker数量，默认为CPU核心数
 * @returns Promise<void>
 */
export function initWorkerPool(maxWorkers?: number): Promise<void>;

/**
 * 关闭Worker池，释放资源
 */
export function terminateWorkerPool(): void;

/**
 * 获取Worker池状态
 * @returns Worker池状态信息
 */
export function getWorkerPoolStatus(): WorkerPoolStatus;

/**
 * WASM底层函数
 */
export const wasmFunctions: WasmFunctions;

/**
 * 兼容旧版本的导出
 */
export const add_watermark: WasmFunctions['add_watermark'];
export const add_watermark_async: WasmFunctions['add_watermark_async'];

/**
 * CommonJS模块导出
 */
declare const _default: typeof init;
export default _default;