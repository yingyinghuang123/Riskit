#!/usr/bin/env python3
"""
Script to get the dimensions of an image from a URL.
Uses PIL (Pillow) if available, otherwise falls back to requests headers.

Usage:
    python3 get_image_dims.py [URL]
    
If no URL is provided, uses the default URL.
"""

import sys
import requests
from io import BytesIO

# Default URL
default_url = "https://storage.googleapis.com/mle-proxy-api-production-public-files/1746087858327-0.8986241314643032.png"

# Get URL from command line or use default
url = sys.argv[1] if len(sys.argv) > 1 else default_url

print(f"Fetching image from: {url}\n")

try:
    from PIL import Image
    
    print("Using PIL (Pillow) to get image dimensions...")
    response = requests.get(url, timeout=10)
    response.raise_for_status()
    
    image = Image.open(BytesIO(response.content))
    width, height = image.size
    
    print(f"✓ Image dimensions: {width}x{height} pixels")
    print(f"✓ Image format: {image.format}")
    print(f"✓ Image mode: {image.mode}")
    
except ImportError:
    print("PIL (Pillow) not available, using requests headers...\n")
    response = requests.head(url, timeout=10, allow_redirects=True)
    response.raise_for_status()
    
    print("Response headers:")
    for key, value in response.headers.items():
        print(f"  {key}: {value}")
    
    if 'content-length' in response.headers:
        print(f"\nContent-Length: {response.headers['content-length']} bytes")
    
except requests.RequestException as e:
    print(f"✗ Error fetching the image: {e}")
    sys.exit(1)
except Exception as e:
    print(f"✗ Error: {e}")
    sys.exit(1)
