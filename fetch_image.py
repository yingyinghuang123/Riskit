import requests
from PIL import Image
from io import BytesIO

# 获取图片
url = "https://storage.googleapis.com/multimodal_files/input_file_0.png"
try:
    response = requests.get(url)
    print(f"HTTP 状态码: {response.status_code}")
    
    if response.status_code == 403:
        print("错误: 无权限访问该 URL (403 Forbidden)")
        print("该 URL 可能需要身份验证或已过期")
    else:
        response.raise_for_status()
        # 打开图片
        image = Image.open(BytesIO(response.content))
        # 获取并打印尺寸
        width, height = image.size
        print(f"图片尺寸 - 宽度: {width}, 高度: {height}")
except Exception as e:
    print(f"错误: {type(e).__name__}: {e}")
