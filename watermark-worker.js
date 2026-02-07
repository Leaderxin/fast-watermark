/**
 * Watermark Worker - Web Worker for parallel watermark processing
 * 在后台线程中处理水印，避免阻塞主线程
 */

// 监听消息
self.onmessage = async function(e) {
    const { type, data } = e.data;
    
    try {
        switch (type) {
            case 'init':
                // 初始化WASM模块
                await initWasm();
                self.postMessage({ type: 'init', success: true });
                break;
                
            case 'process':
                // 处理水印
                await processWatermark(data);
                break;
                
            default:
                self.postMessage({ type: 'error', error: 'Unknown message type' });
        }
    } catch (error) {
        self.postMessage({ type: 'error', error: error.message });
    }
};

// WASM模块引用
let wasmModule = null;
let wasmInitialized = false;

// 初始化WASM模块
async function initWasm() {
    if (!wasmInitialized) {
        // 动态导入WASM模块
        const wasmPack = await import('./pkg/wasm_watermark.js');
        await wasmPack.default();
        wasmModule = wasmPack;
        wasmInitialized = true;
    }
}

// 处理水印
async function processWatermark(data) {
    const { imageData, config, chunkIndex, totalChunks } = data;
    
    // 确保WASM已初始化
    if (!wasmInitialized) {
        await initWasm();
    }
    
    // 转换图片数据为Uint8Array
    let imageBytes;
    if (imageData instanceof Uint8Array) {
        imageBytes = imageData;
    } else if (imageData instanceof ArrayBuffer) {
        imageBytes = new Uint8Array(imageData);
    } else if (imageData instanceof Blob) {
        const arrayBuffer = await imageData.arrayBuffer();
        imageBytes = new Uint8Array(arrayBuffer);
    } else {
        throw new Error('Unsupported image data type');
    }
    
    // 调用WASM函数添加水印
    const resultBytes = wasmModule.add_watermark(imageBytes, config);
    
    // 返回结果（使用 Transferable Objects 避免拷贝）
    self.postMessage({
        type: 'process',
        success: true,
        chunkIndex,
        totalChunks,
        result: resultBytes
    }, [resultBytes.buffer]); // 转移 ArrayBuffer 所有权
}