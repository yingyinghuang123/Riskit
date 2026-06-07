import requests

# 下载图片的URL
url = "https://storage.googleapis.com/m-infra/v/67c299976379960008689793/0.png"

# 发送GET请求
response = requests.get(url)

# 打印状态码
print(f"Status Code: {response.status_code}")

# 打印响应的前100字节
print(f"First 100 bytes: {response.content[:100]}")

# 如果请求成功，保存图片
if response.status_code == 200:
    with open('downloaded_0.png', 'wb') as f:
        f.write(response.content)
    print("Image saved as 'downloaded_0.png'")
else:
    print(f"Failed to download image. Status code: {response.status_code}")
