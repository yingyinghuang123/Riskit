#!/usr/bin/env python3
from PIL import Image
import base64

# 打开本地图像
image_path = "input_file_0.png"
image = Image.open(image_path)

# 打印尺寸
width, height = image.size
print(f"图片尺寸: {width}x{height} 像素")
print(f"图片格式: {image.format}")
print(f"图片模式: {image.mode}")

# 尝试使用vision模型进行描述
try:
    import anthropic
    
    # 初始化Anthropic客户端
    client = anthropic.Anthropic()
    
    # 读取图像并转换为base64
    with open(image_path, "rb") as f:
        image_data = base64.standard_b64encode(f.read()).decode("utf-8")
    
    # 调用Claude Vision API
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
