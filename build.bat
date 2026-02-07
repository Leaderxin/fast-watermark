@echo off
REM 构建WASM模块（使用 release 模式以获得最小体积）
echo Building WASM module in release mode with SIMD support...

REM 设置 RUSTFLAGS 以启用 SIMD（WebAssembly 目标）
set RUSTFLAGS=-C target-feature=+simd128

REM 构建 WASM 模块
wasm-pack build --release --target web --out-dir pkg

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Build failed with error code %ERRORLEVEL%
    echo.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo Build complete!
echo WASM module built with SIMD optimization enabled.
echo.
pause