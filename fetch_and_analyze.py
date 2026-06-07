#!/usr/bin/env python3
import requests
from PIL import Image
from io import BytesIO
import base64

url = "https://storage.googleapis.com/multimodal_files/input_file_0.png"

# 尝试不同的请求头
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
}

try:
    print("正在尝试获取图像...")
    response = requests.get(url, headers=headers, timeout=10)
    print(f"HTTP 状态码: {response.status_code}")
    
    if response.status_code == 403:
        print("错误: 无权限访问该 URL (403 Forbidden)")
        print("该 URL 可能需要身份验证或已过期")
    elif response.status_code == 200:
        # 尝试打开图像
        image = Image.open(BytesIO(response.content))
        width, height = image.size
        print(f"\n✓ 成功获取图像!")
        print(f"图片尺寸: {width}x{height} 像素")
        print(f"图片格式: {image.format}")
        print(f"图片模式: {image.mode}")
        
        # 尝试使用vision模型
        try:
            import anthropic
            print("\n正在使用Claude Vision API分析图像...")
            
            client = anthropic.Anthropic()
            image_data = base64.standard_b64encode(response.content).decode("utf-8")
            
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
                                    "data": image_data,
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
            
            print(f"\n图片描述:")
            print(message.content[0].text)
            
        except ImportError:
            print("\n注: anthropic库未安装，无法使用vision模型")
        except Exception as e:
            print(f"\n注: 无法使用vision模型进行描述 - {type(e).__name__}: {e}")
    else:
        print(f"错误: 获取失败，状态码 {response.status_code}")
        
except Exception as e:
    print(f"错误: {type(e).__name__}: {e}")
