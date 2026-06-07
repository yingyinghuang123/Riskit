import requests
from PIL import Image
from io import BytesIO

# 图像 URL
url = "https://storage.googleapis.com/m-infra/v/67c299976379960008689793/0.png"

try:
    # 发送请求获取图像
    response = requests.get(url)
    response.raise_for_status()

    # 使用 PIL 打开图像
    image = Image.open(BytesIO(response.content))

    # 获取尺寸
    width, height = image.size

    print(f"图像尺寸: 宽度={width}, 高度={height}")
except requests.exceptions.HTTPError as e:
    print(f"HTTP 错误: {e}")
except Exception as e:
    print(f"错误: {e}")
