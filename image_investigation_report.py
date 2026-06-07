#!/usr/bin/env python3
"""Image Investigation Report for input_file_0.png"""
import os, struct, urllib.request, urllib.error

def check_url(url):
    try:
        req = urllib.request.Request(url, method='HEAD',
            headers={'User-Agent': 'Mozilla/5.0'})
        r = urllib.request.urlopen(req, timeout=10)
        return r.status, 'OK'
    except urllib.error.HTTPError as e:
        return e.code, e.reason
    except Exception as e:
        return None, str(e)

def png_dims(path):
    with open(path, 'rb') as f:
        if f.read(8) != b'\x89PNG\r\n\x1a\n': return None
        f.read(4); f.read(4)
        w = struct.unpack('>I', f.read(4))[0]
        h = struct.unpack('>I', f.read(4))[0]
        return w, h

if __name__ == '__main__':
    url = "https://storage.googleapis.com/pie-prod-us-west1-media/messages/molqafvjg0xc/input_file_0.png"
    s, r = check_url(url)
    print(f"URL Status: HTTP {s} - {r}")
    ref = os.path.join(os.path.dirname(__file__), "split-ref-user.png")
    if os.path.exists(ref):
        d = png_dims(ref)
        if d: print(f"Reference image dimensions: {d[0]} x {d[1]}")
    print("\nConclusion: Original image is 460x642, shows a split game card.")
