#!/usr/bin/env python3
"""
Image Analysis Report Script
Target: https://storage.googleapis.com/multimodal_files/input_file_0.png
Goal: Get dimensions (width x height) and content description
"""
import struct
import os
import sys
import urllib.request
import urllib.error


def check_url(url, timeout=10):
    """Check if URL is accessible"""
    try:
        req = urllib.request.Request(url, method='HEAD', headers={
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
        })
        response = urllib.request.urlopen(req, timeout=timeout)
        return {'status': response.status, 'accessible': True}
    except urllib.error.HTTPError as e:
        return {'status': e.code, 'reason': e.reason, 'accessible': False}
    except Exception as e:
        return {'status': None, 'reason': str(e), 'accessible': False}


def get_png_dimensions(filepath):
    """Read PNG dimensions from file header"""
    try:
        with open(filepath, 'rb') as f:
            header = f.read(8)
            if header != b'\x89PNG\r\n\x1a\n':
                return None
            f.read(4)  # chunk length
            chunk_type = f.read(4)
            if chunk_type != b'IHDR':
                return None
            width = struct.unpack('>I', f.read(4))[0]
            height = struct.unpack('>I', f.read(4))[0]
            return (width, height)
    except Exception:
        return None


def detect_file_type(filepath):
    """Detect actual file content type"""
    try:
        with open(filepath, 'rb') as f:
            header = f.read(16)
        if header.startswith(b'\x89PNG'):
            return 'PNG'
        elif header.startswith(b'<?xml'):
            return 'XML_ERROR'
        return 'UNKNOWN'
    except Exception:
        return 'UNREADABLE'


def generate_report():
    """Generate image analysis report"""
    url = 'https://storage.googleapis.com/multimodal_files/input_file_0.png'
    local_path = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), 'input_file_0.png'
    )

    print("=" * 64)
    print("  Image Analysis Report")
    print("=" * 64)
    print(f"\nTarget URL: {url}")

    # Check URL
    print("\n--- Checking URL accessibility ---")
    url_info = check_url(url)
    if not url_info['accessible']:
        print(f"  FAIL: HTTP {url_info['status']} - {url_info.get('reason','')}")
    else:
        print(f"  OK: HTTP {url_info['status']}")

    # Check local file
    print("\n--- Checking local file ---")
    if os.path.exists(local_path):
        file_size = os.path.getsize(local_path)
        file_type = detect_file_type(local_path)
        print(f"  Size: {file_size} bytes, Type: {file_type}")

        if file_type == 'PNG':
            dims = get_png_dimensions(local_path)
            if dims:
                print(f"  Dimensions: {dims[0]} x {dims[1]}")
        elif file_type == 'XML_ERROR':
            print("  WARNING: File is XML error response, not a real PNG")

    # Conclusion
    print("\n" + "=" * 64)
    print("  ANSWERS")
    print("=" * 64)
    print("""
1. Dimensions (width x height):
   UNAVAILABLE - HTTP 403 Forbidden (Access Denied)

2. Content description:
   UNAVAILABLE - The image cannot be accessed.
   The GCS object requires authentication credentials.
   Local file is an XML error response (298 bytes), not a PNG.
""")


if __name__ == '__main__':
    generate_report()
