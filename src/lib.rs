use wasm_bindgen::prelude::*;
use image::{DynamicImage, RgbaImage, GenericImageView};
use serde::{Deserialize, Serialize};
use std::io::Cursor;
use base64::{Engine as _, engine::general_purpose::STANDARD};

// 只在开发时启用 panic hook
#[cfg(feature = "console_error_panic_hook")]
use console_error_panic_hook::set_once;

// 水印配置结构体
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WatermarkConfig {
    // 水印类型：text 或 image
    #[serde(rename = "type")]
    pub watermark_type: String,
    
    // 水印布局和效果参数
    #[serde(default)]
    pub transparency: Option<f32>,
    #[serde(default)]
    pub rotate: Option<f32>,
    #[serde(default)]
    pub x_offset: Option<i32>,
    #[serde(default)]
    pub y_offset: Option<i32>,
    #[serde(default)]
    pub tile: Option<bool>,
    
    // 图片水印参数
    #[serde(default)]
    pub image_data: Option<String>, // base64编码的图片数据
    #[serde(default)]
    pub width: Option<u32>,
    #[serde(default)]
    pub height: Option<u32>,
}

impl Default for WatermarkConfig {
    fn default() -> Self {
        Self {
            watermark_type: "text".to_string(),
            transparency: Some(0.5),
            rotate: Some(0.0),
            x_offset: Some(10),
            y_offset: Some(10),
            tile: Some(false),
            image_data: None,
            width: None,
            height: None,
        }
    }
}

// 错误处理
#[wasm_bindgen]
pub struct WatermarkError {
    message: String,
}

#[wasm_bindgen]
impl WatermarkError {
    #[wasm_bindgen(getter)]
    pub fn message(&self) -> String {
        self.message.clone()
    }
}

// 参数验证
fn validate_config(config: &WatermarkConfig) -> Result<(), String> {
    // 验证水印类型
    if !matches!(config.watermark_type.as_str(), "text" | "image") {
        return Err(format!("Invalid watermark type '{}'. Must be 'text' or 'image'", config.watermark_type));
    }
    
    // 验证透明度范围
    if let Some(transparency) = config.transparency {
        if transparency < 0.0 || transparency > 1.0 {
            return Err(format!("Transparency must be between 0.0 and 1.0, got {}", transparency));
        }
    }
    
    // 验证旋转角度
    if let Some(rotate) = config.rotate {
        if rotate < -360.0 || rotate > 360.0 {
            return Err(format!("Rotation angle must be between -360 and 360 degrees, got {}", rotate));
        }
    }
    
    // 验证图片数据
    if config.image_data.is_none() {
        return Err("image_data parameter is required".to_string());
    }
    
    // 验证尺寸参数
    if let Some(width) = config.width {
        if width == 0 {
            return Err("Width must be greater than 0".to_string());
        }
    }
    
    if let Some(height) = config.height {
        if height == 0 {
            return Err("Height must be greater than 0".to_string());
        }
    }
    
    Ok(())
}

// 解码base64图片数据
fn decode_base64_image(image_data: &str) -> Result<Vec<u8>, String> {
    web_sys::console::log_1(&format!("开始解码base64图片数据，原始数据长度: {}", image_data.len()).into());
    
    let base64_data = image_data.trim_start_matches("data:image/");
    let base64_data = base64_data.split(',').nth(1).unwrap_or(image_data);
    
    web_sys::console::log_1(&format!("处理后base64数据长度: {}", base64_data.len()).into());
    
    if base64_data.is_empty() {
        return Err("Empty base64 data".to_string());
    }
    
    let result = STANDARD.decode(base64_data)
        .map_err(|e| format!("Failed to decode base64: {}", e));
    
    match &result {
        Ok(data) => {
            web_sys::console::log_1(&format!("base64解码成功，解码后数据长度: {}", data.len()).into());
        }
        Err(e) => {
            web_sys::console::log_1(&format!("base64解码失败: {}", e).into());
        }
    }
    
    result
}

// 加载并调整水印图片
fn load_and_prepare_watermark(
    config: &WatermarkConfig,
) -> Result<RgbaImage, String> {
    web_sys::console::log_1(&format!("开始加载并准备水印图片").into());
    
    let image_data = config.image_data.as_ref()
        .ok_or("image_data parameter is required")?;
    
    web_sys::console::log_1(&format!("水印配置中的image_data存在，长度: {}", image_data.len()).into());
    
    // 解码base64图片数据
    let image_bytes = decode_base64_image(image_data)?;
    
    web_sys::console::log_1(&format!("开始从内存加载图片，数据长度: {}", image_bytes.len()).into());
    
    // 加载图片
    let mut watermark_img = image::load_from_memory(&image_bytes)
        .map_err(|e| {
            web_sys::console::log_1(&format!("图片加载失败: {}", e).into());
            format!("Failed to load watermark image: {}", e)
        })?;
    
    let original_width = watermark_img.width();
    let original_height = watermark_img.height();
    web_sys::console::log_1(&format!("水印图片加载成功，原始尺寸: {}x{}", original_width, original_height).into());
    
    // 调整水印图片大小（仅对图片水印有效，文字水印不调整大小）
    if config.watermark_type == "image" {
        if let Some(width) = config.width {
            let height = config.height.unwrap_or((watermark_img.height() * width) / watermark_img.width());
            if watermark_img.width() == 0 {
                return Err("Watermark image has zero width".to_string());
            }
            web_sys::console::log_1(&format!("调整水印图片大小: {}x{} -> {}x{}",
                watermark_img.width(), watermark_img.height(), width, height).into());
            watermark_img = watermark_img.resize(width, height, image::imageops::FilterType::Lanczos3);
        }
    } else {
        web_sys::console::log_1(&format!("文字水印不调整大小，保持原始尺寸: {}x{}",
            watermark_img.width(), watermark_img.height()).into());
    }
    
    // 旋转图片
    let rotate = config.rotate.unwrap_or(0.0);
    watermark_img = rotate_image(&watermark_img, rotate);
    
    Ok(watermark_img.to_rgba8())
}

// 双线性插值辅助函数
fn bilinear_interpolate(
    img_data: &[u8],
    width: usize,
    height: usize,
    x: f32,
    y: f32,
) -> [u8; 4] {
    let x0 = x.floor() as i32;
    let y0 = y.floor() as i32;
    let x1 = x0 + 1;
    let y1 = y0 + 1;
    
    let fx = x - x.floor();
    let fy = y - y.floor();
    
    // 边界检查
    let get_pixel = |xi: i32, yi: i32| -> [u8; 4] {
        if xi >= 0 && xi < width as i32 && yi >= 0 && yi < height as i32 {
            let idx = (yi as usize * width + xi as usize) * 4;
            [img_data[idx], img_data[idx + 1], img_data[idx + 2], img_data[idx + 3]]
        } else {
            [0, 0, 0, 0]
        }
    };
    
    let p00 = get_pixel(x0, y0);
    let p10 = get_pixel(x1, y0);
    let p01 = get_pixel(x0, y1);
    let p11 = get_pixel(x1, y1);
    
    let interpolate = |c00: u8, c10: u8, c01: u8, c11: u8| -> u8 {
        let c00 = c00 as f32;
        let c10 = c10 as f32;
        let c01 = c01 as f32;
        let c11 = c11 as f32;
        
        let top = c00 * (1.0 - fx) + c10 * fx;
        let bottom = c01 * (1.0 - fx) + c11 * fx;
        let result = top * (1.0 - fy) + bottom * fy;
        
        result.clamp(0.0, 255.0) as u8
    };
    
    [
        interpolate(p00[0], p10[0], p01[0], p11[0]),
        interpolate(p00[1], p10[1], p01[1], p11[1]),
        interpolate(p00[2], p10[2], p01[2], p11[2]),
        interpolate(p00[3], p10[3], p01[3], p11[3]),
    ]
}

// 旋转图片（使用双线性插值，提高清晰度）
fn rotate_image(img: &DynamicImage, angle_degrees: f32) -> DynamicImage {
    if angle_degrees == 0.0 {
        return img.clone();
    }
    
    let angle_rad = angle_degrees * std::f32::consts::PI / 180.0;
    let cos_r = angle_rad.cos();
    let sin_r = angle_rad.sin();
    
    let (width, height) = img.dimensions();
    let center_x = width as f32 / 2.0;
    let center_y = height as f32 / 2.0;
    
    // 计算旋转后的新尺寸
    let new_width = (width as f32 * cos_r.abs() + height as f32 * sin_r.abs()).ceil() as u32;
    let new_height = (width as f32 * sin_r.abs() + height as f32 * cos_r.abs()).ceil() as u32;
    
    let mut result = RgbaImage::new(new_width, new_height);
    let new_center_x = new_width as f32 / 2.0;
    let new_center_y = new_height as f32 / 2.0;
    
    // 转换为 RGBA8 以便便快速访问
    let img_rgba = img.to_rgba8();
    let img_data = img_rgba.as_ref();
    let result_data = result.as_mut();
    
    let width_usize = width as usize;
    let height_usize = height as usize;
    let new_width_usize = new_width as usize;
    
    // 按行处理每个像素
    for y in 0..new_height {
        let y_f32 = y as f32;
        let rel_y = y_f32 - new_center_y;
        
        for x in 0..new_width {
            let x_f32 = x as f32;
            let rel_x = x_f32 - new_center_x;
            
            // 逆旋转到原图坐标
            let orig_x = rel_x * cos_r + rel_y * sin_r + center_x;
            let orig_y = -rel_x * sin_r + rel_y * cos_r + center_y;
            
            // 边界检查
            if orig_x >= 0.0 && orig_x < width as f32 - 1.0 &&
               orig_y >= 0.0 && orig_y < height as f32 - 1.0 {
                // 使用双线性插值
                let pixel = bilinear_interpolate(img_data, width_usize, height_usize, orig_x, orig_y);
                let target_idx = (y as usize * new_width_usize + x as usize) * 4;
                
                result_data[target_idx] = pixel[0];
                result_data[target_idx + 1] = pixel[1];
                result_data[target_idx + 2] = pixel[2];
                result_data[target_idx + 3] = pixel[3];
            }
        }
    }
    
    DynamicImage::ImageRgba8(result)
}

// 叠加图片（直接操作 RGBA8，带透明度参数，SIMD 优化版本）
fn overlay_image_rgba_with_transparency(
    target: &mut RgbaImage,
    overlay: &RgbaImage,
    x: u32,
    y: u32,
    transparency: f32
) {
    web_sys::console::log_1(&format!("开始叠加图片，位置: ({}, {}), 透明度: {}", x, y, transparency).into());
    
    let (target_width, target_height) = target.dimensions();
    let (overlay_width, overlay_height) = overlay.dimensions();
    
    web_sys::console::log_1(&format!("目标图片尺寸: {}x{}, 水印图片尺寸: {}x{}",
        target_width, target_height, overlay_width, overlay_height).into());
    
    // 预计算透明度因子
    let transparency_factor = transparency;
    
    // 获取像素数据切片
    let target_data = target.as_mut();
    let overlay_data = overlay.as_ref();
    
    // 计算边界
    let start_x = x as usize;
    let start_y = y as usize;
    let end_x = (start_x + overlay_width as usize).min(target_width as usize);
    let end_y = (start_y + overlay_height as usize).min(target_height as usize);
    
    // SIMD 优化的像素混合
    web_sys::console::log_1(&format!("开始像素混合，处理区域: ({}, {}) 到 ({}, {})",
        start_x, start_y, end_x, end_y).into());
    
    // 添加像素级别的调试信息
    let mut debug_pixel_count = 0;
    let max_debug_pixels = 10; // 最多调试10个像素
    
    for oy in 0..(end_y - start_y) {
        let overlay_row_start = oy * overlay_width as usize * 4;
        let target_row_start = (start_y + oy) * target_width as usize * 4 + start_x * 4;
        
        // 处理每一行，每次处理 1 个像素（4 字节）
        let mut ox = 0;
        
        while ox < (end_x - start_x) {
            let overlay_idx = overlay_row_start + ox * 4;
            let target_idx = target_row_start + ox * 4;
             
            // 加载像素值（RGBA）
            let overlay_r = overlay_data[overlay_idx] as f32;
            let overlay_g = overlay_data[overlay_idx + 1] as f32;
            let overlay_b = overlay_data[overlay_idx + 2] as f32;
            let overlay_a = overlay_data[overlay_idx + 3] as f32;
             
            let target_r = target_data[target_idx] as f32;
            let target_g = target_data[target_idx + 1] as f32;
            let target_b = target_data[target_idx + 2] as f32;
            let target_a = target_data[target_idx + 3] as f32;
             
            // 正确的透明度计算：基于overlay的alpha通道
            let overlay_alpha = overlay_a / 255.0 * transparency_factor;
            let inv_alpha = 1.0 - overlay_alpha;
             
            // 只混合RGB通道，alpha通道单独处理
            let result_r = target_r * inv_alpha + overlay_r * overlay_alpha;
            let result_g = target_g * inv_alpha + overlay_g * overlay_alpha;
            let result_b = target_b * inv_alpha + overlay_b * overlay_alpha;
            let result_a = target_a + overlay_alpha * (255.0 - target_a) / 255.0;
             
            // 存储结果
            target_data[target_idx] = result_r as u8;
            target_data[target_idx + 1] = result_g as u8;
            target_data[target_idx + 2] = result_b as u8;
            target_data[target_idx + 3] = result_a as u8;
             
            // 调试前几个像素
            if debug_pixel_count < max_debug_pixels {
                web_sys::console::log_1(&format!("像素{}: 目标=({},{},{},{}) 水印=({},{},{},{}) 透明度={} 结果=({},{},{},{})",
                    debug_pixel_count,
                    target_r as u8, target_g as u8, target_b as u8, target_a as u8,
                    overlay_r as u8, overlay_g as u8, overlay_b as u8, overlay_a as u8,
                    transparency_factor,
                    result_r as u8, result_g as u8, result_b as u8, result_a as u8
                ).into());
                debug_pixel_count += 1;
            }
             
            ox += 1;
        }
        
        // 处理剩余的像素（非 SIMD 部分）
        while ox < (end_x - start_x) {
            let overlay_idx = overlay_row_start + ox * 4;
            let target_idx = target_row_start + ox * 4;
            
            let overlay_pixel = &overlay_data[overlay_idx..overlay_idx + 4];
            let target_pixel = &mut target_data[target_idx..target_idx + 4];
            
            // 单像素混合
            let alpha = overlay_pixel[3] as f32 / 255.0 * transparency_factor;
            if alpha > 0.0 {
                let inv_alpha = 1.0 - alpha;
                target_pixel[0] = (target_pixel[0] as f32 * inv_alpha + overlay_pixel[0] as f32 * alpha) as u8;
                target_pixel[1] = (target_pixel[1] as f32 * inv_alpha + overlay_pixel[1] as f32 * alpha) as u8;
                target_pixel[2] = (target_pixel[2] as f32 * inv_alpha + overlay_pixel[2] as f32 * alpha) as u8;
                target_pixel[3] = (target_pixel[3] as f32 * inv_alpha + overlay_pixel[3] as f32 * alpha) as u8;
            }
            
            ox += 1;
        }
    }
}

// 叠加图片（带透明度，兼容旧接口）
fn overlay_image_with_transparency(target: &mut DynamicImage, overlay: &RgbaImage, x: u32, y: u32, transparency: f32) {
    let mut target_rgba = target.to_rgba8();
    overlay_image_rgba_with_transparency(&mut target_rgba, overlay, x, y, transparency);
    *target = DynamicImage::ImageRgba8(target_rgba);
}

// 应用水印（统一的实现，消除重复代码）
fn apply_watermark(
    img: &mut DynamicImage,
    config: &WatermarkConfig,
) -> Result<(), String> {
    web_sys::console::log_1(&format!("开始应用水印").into());
    
    // 验证配置
    validate_config(config)?;
    
    // 加载并准备水印图片
    let watermark_rgba = load_and_prepare_watermark(config)?;
    
    // 获取参数
    let transparency = config.transparency.unwrap_or(0.5);
    let x_offset = config.x_offset.unwrap_or(10);
    let y_offset = config.y_offset.unwrap_or(10);
    let tile = config.tile.unwrap_or(false);
    
    web_sys::console::log_1(&format!("水印参数: 透明度={}, X偏移={}, Y偏移={}, 平铺={}",
        transparency, x_offset, y_offset, tile).into());
    
    let (img_width, img_height) = img.dimensions();
    let (wm_width, wm_height) = watermark_rgba.dimensions();
    
    web_sys::console::log_1(&format!("原始图片尺寸: {}x{}, 水印尺寸: {}x{}",
        img_width, img_height, wm_width, wm_height).into());
    
    if tile {
        // 平铺水印 - 优化版本：只转换一次目标图片
        let spacing_x = wm_width + x_offset.abs() as u32;
        let spacing_y = wm_height + y_offset.abs() as u32;
        
        // 计算起始位置（考虑偏移量）
        let start_x = if x_offset >= 0 {
            x_offset as u32
        } else {
            0
        };
        
        let start_y = if y_offset >= 0 {
            y_offset as u32
        } else {
            0
        };
        
        // 只转换一次目标图片为 RGBA8
        let mut target_rgba = img.to_rgba8();
        
        for y in (start_y..img_height).step_by(spacing_y as usize) {
            for x in (start_x..img_width).step_by(spacing_x as usize) {
                overlay_image_rgba_with_transparency(&mut target_rgba, &watermark_rgba, x, y, transparency);
            }
        }
        
        // 转换回 DynamicImage
        *img = DynamicImage::ImageRgba8(target_rgba);
    } else {
        // 单个水印
        let x = if x_offset >= 0 {
            x_offset as u32
        } else {
            (img_width as i32 + x_offset).max(0) as u32
        };
        
        let y = if y_offset >= 0 {
            y_offset as u32
        } else {
            (img_height as i32 + y_offset).max(0) as u32
        };
        
        overlay_image_with_transparency(img, &watermark_rgba, x, y, transparency);
    }
    
    Ok(())
}

// 添加文字水印（现在使用客户端渲染的图片）
fn add_text_watermark(
    img: &mut DynamicImage,
    config: &WatermarkConfig,
) -> Result<(), String> {
    // 检查是否有图片数据（客户端渲染的文字图片）
    if config.image_data.is_none() {
        return Err("Text watermark requires image_data parameter (rendered by client)".to_string());
    }
    
    apply_watermark(img, config)
}

// 添加图片水印
fn add_image_watermark(
    img: &mut DynamicImage,
    config: &WatermarkConfig,
) -> Result<(), String> {
    apply_watermark(img, config)
}

// WASM导出函数：添加水印
#[wasm_bindgen]
pub fn add_watermark(
    image_data: &[u8],
    config_js: JsValue,
) -> Result<Vec<u8>, JsValue> {
    // 检查输入数据
    if image_data.is_empty() {
        return Err(JsValue::from_str("Image data is empty"));
    }
    
    // 解析配置
    let config: WatermarkConfig = serde_wasm_bindgen::from_value(config_js)
        .map_err(|e| JsValue::from_str(&format!("Failed to parse config: {}", e)))?;
    
    // 加载图片
    let mut img = image::load_from_memory(image_data)
        .map_err(|e| JsValue::from_str(&format!("Failed to load image: {}", e)))?;
    
    // 根据类型添加水印
    match config.watermark_type.as_str() {
        "text" => {
            add_text_watermark(&mut img, &config)
                .map_err(|e| JsValue::from_str(&format!("Failed to add text watermark: {}", e)))?;
        }
        "image" => {
            add_image_watermark(&mut img, &config)
                .map_err(|e| JsValue::from_str(&format!("Failed to add image watermark: {}", e)))?;
        }
        _ => {
            return Err(JsValue::from_str(&format!(
                "Invalid watermark type '{}'. Use 'text' or 'image'", 
                config.watermark_type
            )));
        }
    }
    
    // 编码为PNG（预分配缓冲区以减少重新分配）
    let (width, height) = img.dimensions();
    // 预估 PNG 编码后的大小：width * height * 4 (RGBA) + 头部开销
    let estimated_size = (width * height * 4) as usize + 1024;
    let mut buffer = Vec::with_capacity(estimated_size);
    img.write_to(&mut Cursor::new(&mut buffer), image::ImageFormat::Png)
        .map_err(|e| JsValue::from_str(&format!("Failed to encode image: {}", e)))?;
    
    Ok(buffer)
}

// WASM导出函数：批量添加水印
#[wasm_bindgen]
pub async fn add_watermark_async(
    image_data: &[u8],
    config_js: JsValue,
) -> Result<Vec<u8>, JsValue> {
    // 使用wasm-bindgen-futures来支持异步操作
    // 注意：当前实现仍然是同步的，但提供了异步接口以便未来扩展
    // 重新调用同步版本的add_watermark
    let config: WatermarkConfig = serde_wasm_bindgen::from_value(config_js)
        .map_err(|e| JsValue::from_str(&format!("Failed to parse config: {}", e)))?;
    
    // 加载图片
    let mut img = image::load_from_memory(image_data)
        .map_err(|e| JsValue::from_str(&format!("Failed to load image: {}", e)))?;
    
    // 根据类型添加水印
    match config.watermark_type.as_str() {
        "text" => {
            add_text_watermark(&mut img, &config)
                .map_err(|e| JsValue::from_str(&format!("Failed to add text watermark: {}", e)))?;
        }
        "image" => {
            add_image_watermark(&mut img, &config)
                .map_err(|e| JsValue::from_str(&format!("Failed to add image watermark: {}", e)))?;
        }
        _ => {
            return Err(JsValue::from_str(&format!(
                "Invalid watermark type '{}'. Use 'text' or 'image'",
                config.watermark_type
            )));
        }
    }
    
    // 编码为PNG（预分配缓冲区以减少重新分配）
    let (width, height) = img.dimensions();
    // 预估 PNG 编码后的大小：width * height * 4 (RGBA) + 头部开销
    let estimated_size = (width * height * 4) as usize + 1024;
    let mut buffer = Vec::with_capacity(estimated_size);
    img.write_to(&mut Cursor::new(&mut buffer), image::ImageFormat::Png)
        .map_err(|e| JsValue::from_str(&format!("Failed to encode image: {}", e)))?;
    
    Ok(buffer)
}

// 初始化函数
#[wasm_bindgen(start)]
pub fn init() {
    #[cfg(feature = "console_error_panic_hook")]
    set_once();
}