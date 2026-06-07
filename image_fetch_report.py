#!/usr/bin/env python3
"""
图像获取和分析脚本
尝试从URL获取图像，如果失败则报告错误
"""
import requests
from PIL import Image
from io import BytesIO
import base64

def fetch_and_analyze_image(url):
    """获取并分析图像"""
    print(f"目标URL: {url}\n")
    print("=" * 60)
    
    try:
        print("步骤 1: 发送HTTP请求...")
        response = requests.get(url, timeout=5)
        print(f"✓ 收到响应，状态码: {response.status_code}\n")
        
        if response.status_code == 403:
            print("❌ 错误: 无权限访问 (403 Forbidden)")
            print("   可能原因:")
            print("   - URL已过期或需要身份验证")
            print("   - 服务器拒绝了该请求")
            return False
            
        elif response.status_code != 200:
            print(f"❌ 错误: HTTP {response.status_code}")
            return False
        
        print("步骤 2: 解析图像...")
        image = Image.open(BytesIO(response.content))
        width, height = image.size
        
        print("✓ 成功解析图像!\n")
        print("=" * 60)
        print("图像信息:")
        print(f"  尺寸: {width}x{height} 像素")
        print(f"  格式: {image.format}")
        print(f"  颜色模式: {image.mode}")
        print(f"  文件大小: {len(response.content)} 字节")
        print("=" * 60)
        
        # 尝试使用vision模型
        try_vision_analysis(response.content)
        return True
        
    except requests.exceptions.Timeout:
        print("❌ 错误: 请求超时")
        return False
    except requests.exceptions.ConnectionError:
        print("❌ 错误: 连接失败")
        return False
    except Exception as e:
        print(f"❌ 错误: {type(e).__name__}: {e}")
        return False

def try_vision_analysis(image_data):
    """尝试使用Claude Vision API分析图像"""
    try:
        import anthropic
        
        print("\n步骤 3: 使用Claude Vision API分析图像...")
        client = anthropic.Anthropic()
        image_b64 = base64.standard_b64encode(image_data).decode("utf-8")
        
        message = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1024,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": "image/png",
                                "data": image_b64,
                            },
                        },
                        {
                            "type": "text",
                            "text": "请简要描述这张图片的内容。"
                        }
                    ],
                }
            ],
        )
        
        print("✓ 成功获取图像描述!\n")
        print("=" * 60)
        print("图像描述:")
        print(message.content[0].text)
        print("=" * 60)
        
    except ImportError:
        print("\n注: anthropic库未安装，跳过vision分析")
    except Exception as e:
        print(f"\n注: 无法使用vision模型 - {type(e).__name__}: {e}")

if __name__ == "__main__":
    url = "https://storage.googleapis.com/multimodal_files/input_file_0.png"
    fetch_and_analyze_image(url)
