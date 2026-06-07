#!/usr/bin/env python3
"""
分析PNG图片的尺寸和主色调。
支持本地文件和远程URL，能识别访问权限错误并给出清晰报告。
"""
import struct
import os
import sys
import urllib.request
import urllib.error
from collections import Counter


def get_png_dimensions_from_header(filepath):
    """从PNG文件头读取图片尺寸"""
    try:
        with open(filepath, 'rb') as f:
            # PNG文件头: 8字节签名
            header = f.read(8)
            if header != b'\x89PNG\r\n\x1a\n':
                return None
            
            # IHDR块: 4字节长度 + 4字节"IHDR" + 数据 + 4字节CRC
            length = struct.unpack('>I', f.read(4))[0]
            chunk_type = f.read(4)
            
            if chunk_type != b'IHDR':
                return None
            
            # IHDR数据: 4字节宽度 + 4字节高度 + 其他信息
            width = struct.unpack('>I', f.read(4))[0]
            height = struct.unpack('>I', f.read(4))[0]
            
            return (width, height)
    except Exception as e:
        print(f"读取PNG头出错: {e}")
        return None


def get_dominant_colors_pillow(filepath):
    """使用Pillow获取主色调"""
    try:
        from PIL import Image
        img = Image.open(filepath)
        
        # 调整图片大小以加快处理
        img.thumbnail((150, 150))
        
        # 转换为RGB模式
        if img.mode != 'RGB':
            img = img.convert('RGB')
        
        # 获取所有像素
        pixels = list(img.getdata())
        
        # 统计最常见的颜色
        color_counts = Counter(pixels)
        top_colors = color_counts.most_common(5)
        
        return top_colors
    except ImportError:
        return None
    except Exception as e:
        print(f"Pillow处理出错: {e}")
        return None


def detect_file_type(filepath):
    """检测文件的实际类型"""
    with open(filepath, 'rb') as f:
        file_header = f.read(16)
    
    if file_header.startswith(b'\x89PNG'):
        return "PNG"
    elif file_header.startswith(b'\xff\xd8\xff'):
        return "JPEG"
    elif file_header.startswith(b'GIF8'):
        return "GIF"
    elif file_header.startswith(b'<?xml'):
        return "XML"
    elif file_header.startswith(b'RIFF'):
        return "WEBP"
    elif file_header.startswith(b'BM'):
        return "BMP"
    return "未知"


def check_xml_error_content(filepath):
    """检查XML文件是否包含云存储错误信息"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if '<Error>' in content and '<Code>' in content:
            # 提取错误代码和消息
            code_start = content.find('<Code>') + 6
            code_end = content.find('</Code>')
            error_code = content[code_start:code_end] if code_end > code_start else "Unknown"
            
            msg_start = content.find('<Message>') + 9
            msg_end = content.find('</Message>')
            error_msg = content[msg_start:msg_end] if msg_end > msg_start else "Unknown"
            
            details_start = content.find('<Details>') + 9
            details_end = content.find('</Details>')
            error_details = content[details_start:details_end] if details_end > details_start else ""
            
            return {
                'code': error_code,
                'message': error_msg,
                'details': error_details
            }
    except Exception:
        pass
    return None


def try_download_image(url, save_path, timeout=10):
    """尝试从URL下载图片"""
    try:
        req = urllib.request.Request(url, headers={
            'User-Agent': 'Mozilla/5.0 (compatible; ImageAnalyzer/1.0)'
        })
        response = urllib.request.urlopen(req, timeout=timeout)
        content_type = response.headers.get('Content-Type', '')
        
        with open(save_path, 'wb') as f:
            f.write(response.read())
        
        return {'success': True, 'content_type': content_type}
    except urllib.error.HTTPError as e:
        return {'success': False, 'error': f"HTTP {e.code}: {e.reason}"}
    except urllib.error.URLError as e:
        return {'success': False, 'error': f"URL错误: {e.reason}"}
    except Exception as e:
        return {'success': False, 'error': str(e)}


def analyze_image(filepath, source_url=None):
    """分析图片文件，支持本地文件和远程URL来源追踪"""
    print("=" * 60)
    print("图片分析报告")
    print("=" * 60)
    
    if source_url:
        print(f"\n来源URL: {source_url}")
    
    if not os.path.exists(filepath):
        print(f"\n✗ 文件不存在: {filepath}")
        
        # 如果提供了URL，尝试下载
        if source_url:
            print(f"\n尝试从URL下载...")
            result = try_download_image(source_url, filepath)
            if not result['success']:
                print(f"✗ 下载失败: {result['error']}")
                print("\n" + "=" * 60)
                print("结论: 无法访问该图片")
                print("原因: 远程服务器拒绝访问（权限不足）")
                print("=" * 60)
                return
        else:
            return
    
    file_size = os.path.getsize(filepath)
    print(f"\n本地文件: {filepath}")
    print(f"文件大小: {file_size} 字节")
    print("-" * 60)
    
    # 检测文件类型
    file_type = detect_file_type(filepath)
    print(f"文件类型: {file_type}")
    
    # 如果文件是XML，检查是否为云存储错误响应
    if file_type == "XML":
        error_info = check_xml_error_content(filepath)
        if error_info:
            print(f"\n⚠ 该文件不是有效的图片，而是云存储的错误响应:")
            print(f"  错误代码: {error_info['code']}")
            print(f"  错误消息: {error_info['message']}")
            if error_info['details']:
                print(f"  详细信息: {error_info['details']}")
            
            print("\n" + "=" * 60)
            print("分析结论")
            print("=" * 60)
            print(f"""
无法分析图片 input_file_0.png，原因如下:

1. 图片来源: Google Cloud Storage
   URL: {source_url or '未提供'}

2. 访问状态: 403 Forbidden (访问被拒绝)

3. 错误原因: {error_info['details'] or error_info['message']}

4. 本地文件状态: 
   - 文件扩展名为 .png，但实际内容是 XML 错误响应
   - 文件大小仅 {file_size} 字节（正常PNG图片通常远大于此）

5. 解决建议:
   - 确认该 GCS bucket 是否设置了公开访问权限
   - 如需访问，需要有效的 Google Cloud 认证凭据
   - 或者联系文件所有者获取公开访问链接
""")
            return
        else:
            print("✗ 文件内容为XML格式，不是有效的图片文件")
            return
    
    # 分析真实的图片文件
    if file_type == "PNG":
        dimensions = get_png_dimensions_from_header(filepath)
        if dimensions:
            print(f"✓ 图片尺寸: {dimensions[0]} x {dimensions[1]} 像素")
        else:
            print("✗ 无法读取图片尺寸")
    elif file_type in ("JPEG", "GIF", "WEBP", "BMP"):
        print(f"  文件格式为 {file_type}，尝试使用Pillow读取尺寸...")
    else:
        print(f"✗ 不支持的文件格式: {file_type}")
        return
    
    # 尝试获取更详细的信息（需要Pillow）
    print("\n尝试获取主色调...")
    dominant_colors = get_dominant_colors_pillow(filepath)
    
    if dominant_colors:
        print("✓ 主色调 (RGB, 出现次数):")
        for i, (color, count) in enumerate(dominant_colors, 1):
            r, g, b = color
            hex_color = f"#{r:02x}{g:02x}{b:02x}"
            print(f"  {i}. RGB({r}, {g}, {b}) | {hex_color} - 出现 {count} 次")
    else:
        print("✗ Pillow库不可用，无法获取主色调")
        print("  提示: 可以使用 'pip install Pillow' 安装Pillow库")
    
    print("\n" + "=" * 60)


if __name__ == '__main__':
    source_url = 'https://storage.googleapis.com/multimodal_files/input_file_0.png'
    filepath = '/Users/huangyingying/PieBox/Projects/untitled-molqafvjg0xc/input_file_0.png'
    analyze_image(filepath, source_url=source_url)
