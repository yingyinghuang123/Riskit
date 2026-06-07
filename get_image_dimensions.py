#!/usr/bin/env python3
"""
Get image dimensions from a PNG file by reading the header.
Uses urllib to fetch the image and parses the PNG header.
"""

import urllib.request
import struct
import sys


def get_png_dimensions(url):
    """
    Get the dimensions of a PNG image from its URL.
    
    Args:
        url (str): The URL of the PNG image
        
    Returns:
        tuple: (width, height) of the image, or None if unable to determine
    """
    try:
        # Open the URL and read the first 24 bytes (PNG signature + IHDR chunk)
        with urllib.request.urlopen(url) as response:
            # PNG signature is 8 bytes: 137 80 78 71 13 10 26 10
            header = response.read(24)
        
        # Check PNG signature
        png_signature = b'\x89PNG\r\n\x1a\n'
        if header[:8] != png_signature:
            print("Error: Not a valid PNG file")
            return None
        
        # The IHDR chunk starts at byte 8
        # Bytes 8-11: chunk length (should be 13 for IHDR)
        # Bytes 12-15: chunk type (should be "IHDR")
        # Bytes 16-19: width (big-endian 32-bit integer)
        # Bytes 20-23: height (big-endian 32-bit integer)
        
        chunk_type = header[12:16]
        if chunk_type != b'IHDR':
            print("Error: IHDR chunk not found")
            return None
        
        # Extract width and height (big-endian unsigned integers)
        width = struct.unpack('>I', header[16:20])[0]
        height = struct.unpack('>I', header[20:24])[0]
        
        return (width, height)
    
    except urllib.error.URLError as e:
        print(f"Error: Unable to access URL - {e}")
        return None
    except Exception as e:
        print(f"Error: {e}")
        return None


def get_png_dimensions_from_file(filepath):
    """
    Get the dimensions of a PNG image from a local file.
    
    Args:
        filepath (str): The path to the PNG image file
        
    Returns:
        tuple: (width, height) of the image, or None if unable to determine
    """
    try:
        with open(filepath, 'rb') as f:
            header = f.read(24)
        
        # Check PNG signature
        png_signature = b'\x89PNG\r\n\x1a\n'
        if header[:8] != png_signature:
            print("Error: Not a valid PNG file")
            return None
        
        chunk_type = header[12:16]
        if chunk_type != b'IHDR':
            print("Error: IHDR chunk not found")
            return None
        
        # Extract width and height (big-endian unsigned integers)
        width = struct.unpack('>I', header[16:20])[0]
        height = struct.unpack('>I', header[20:24])[0]
        
        return (width, height)
    
    except FileNotFoundError:
        print(f"Error: File not found - {filepath}")
        return None
    except Exception as e:
        print(f"Error: {e}")
        return None


if __name__ == "__main__":
    # Try URL first
    url = "https://storage.googleapis.com/multimodal_files/input_file_0.png"
    print(f"Attempting to fetch from URL: {url}")
    result = get_png_dimensions(url)
    
    if result:
        width, height = result
        print(f"Image dimensions: {width}x{height}")
        print(f"Width: {width} pixels")
        print(f"Height: {height} pixels")
    else:
        print("\nTrying local file instead...")
        result = get_png_dimensions_from_file("input_file_0.png")
        if result:
            width, height = result
            print(f"Image dimensions: {width}x{height}")
            print(f"Width: {width} pixels")
            print(f"Height: {height} pixels")
        else:
            sys.exit(1)
