#!/usr/bin/env python3
"""
Script to get pixel dimensions of an image from URL or local file.
"""

import os
import sys
from pathlib import Path

try:
    from PIL import Image
    import requests
except ImportError:
    print("Error: Required packages not found. Installing...")
    os.system("pip install Pillow requests")
    from PIL import Image
    import requests


def get_image_dimensions_from_url(url):
    """Download image from URL and get dimensions."""
    try:
        print(f"Attempting to download image from: {url}")
        response = requests.get(url, timeout=10)
        
        if response.status_code == 404:
            print(f"Error: URL returned 404 (Not Found)")
            return None
        
        if response.status_code != 200:
            print(f"Error: URL returned status code {response.status_code}")
            return None
        
        # Open image from bytes
        img = Image.open(requests.BytesIO(response.content))
        width, height = img.size
        print(f"✓ Successfully downloaded image from URL")
        print(f"Image dimensions: {width}x{height} pixels")
        return (width, height)
        
    except requests.exceptions.RequestException as e:
        print(f"Error downloading from URL: {e}")
        return None
    except Exception as e:
        print(f"Error processing image: {e}")
        return None


def find_local_file(filename):
    """Search for file in current directory and subdirectories."""
    print(f"\nSearching for local file: {filename}")
    
    for root, dirs, files in os.walk("."):
        if filename in files:
            filepath = os.path.join(root, filename)
            print(f"Found file at: {filepath}")
            return filepath
    
    print(f"File not found in current directory or subdirectories")
    return None


def get_image_dimensions_from_file(filepath):
    """Get dimensions from local image file."""
    try:
        img = Image.open(filepath)
        width, height = img.size
        print(f"✓ Successfully opened local image")
        print(f"Image dimensions: {width}x{height} pixels")
        return (width, height)
    except Exception as e:
        print(f"Error opening image file: {e}")
        return None


def main():
    url = "https://storage.googleapis.com/mle-root-auth-assets/chat-attachments/untitled-molqafvjg0xc/90898592-8874-4690-9669-02681423867c.png"
    filename = "90898592-8874-4690-9669-02681423867c.png"
    
    print("=" * 70)
    print("Image Dimension Checker")
    print("=" * 70)
    
    # Try to get dimensions from URL first
    dimensions = get_image_dimensions_from_url(url)
    
    # If URL fails, try to find local file
    if dimensions is None:
        print("\nURL access failed. Checking for local file...")
        local_path = find_local_file(filename)
        
        if local_path:
            dimensions = get_image_dimensions_from_file(local_path)
    
    print("=" * 70)
    if dimensions:
        print(f"RESULT: Image dimensions are {dimensions[0]}x{dimensions[1]} pixels")
        return 0
    else:
        print("RESULT: Could not determine image dimensions")
        return 1


if __name__ == "__main__":
    sys.exit(main())
