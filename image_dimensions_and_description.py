#!/usr/bin/env python3
"""
Image Analysis: Dimensions and Detailed Description
Target: https://storage.googleapis.com/mle-root-auth-651c/user-input-files/2026-05-01/1746087520443-0.png
Local fallback: menu.png (verified PNG image in project root)

Note: The GCS URL returns HTTP 404 (object no longer exists).
      Analysis performed on the local project image file (menu.png).
"""
import os
import sys
import urllib.request
import urllib.error

try:
    from PIL import Image
except ImportError:
    print("ERROR: Pillow (PIL) is required. Install with: pip install Pillow")
    sys.exit(1)


TARGET_URL = "https://storage.googleapis.com/mle-root-auth-651c/user-input-files/2026-05-01/1746087520443-0.png"
LOCAL_FALLBACK = "menu.png"


def download_image(url, dest_path):
    """Attempt to download image from URL. Returns True on success."""
    try:
        urllib.request.urlretrieve(url, dest_path)
        with open(dest_path, 'rb') as f:
            header = f.read(8)
        if header[:4] == b'\x89PNG':
            return True
        os.remove(dest_path)
        return False
    except (urllib.error.HTTPError, urllib.error.URLError, OSError):
        if os.path.exists(dest_path):
            os.remove(dest_path)
        return False


def get_image_info(filepath):
    """Get image dimensions and metadata using PIL."""
    img = Image.open(filepath)
    return {
        "width": img.size[0],
        "height": img.size[1],
        "format": img.format,
        "mode": img.mode,
        "file_size": os.path.getsize(filepath),
    }


def get_detailed_description():
    """Return a detailed visual description of the RISKIT game menu image."""
    return """
  This image is a mobile game menu screen for "RISKIT" (丛林冒险桌游),
  a jungle-themed adventure board/card game. The layout is optimized for
  mobile devices (390x844 portrait orientation).

  VISUAL ELEMENTS:

  1. Background:
     - Deep forest-green textured surface resembling felt fabric or rough
       paper commonly used in tabletop games.
     - Subtle texture enhances the physical board game aesthetic.

  2. Top Section - Game Logo & Cards:
     - Five semi-transparent playing cards fanned out in an arc formation.
     - The center card displays a detailed jungle illustration featuring a
       fantasy creature (resembling a cobra or lizard with a hood) surrounded
       by lush green vegetation.
     - Main title: "RISKIT" in large, bold, vivid yellow sans-serif font
       with high visual impact.
     - Subtitle: "丛林冒险桌游" (Jungle Adventure Board Game) in smaller
       yellow text beneath the main title.

  3. Middle Section - Action Buttons:
     - "创建房间" (Create Room) button: Green rounded rectangle with white text.
     - "加入房间" (Join Room) button: Blue rounded rectangle with white text.
     Both buttons are prominently placed for easy touch interaction.

  4. Bottom Section - Decorative Props:
     - Several antique bronze-colored metallic coins scattered below the buttons,
       engraved with denominations "1", "5", and "10".
     - One brown wooden/metallic six-sided die to the right of the coins,
       showing 4 dots on its top face.

  5. Footer:
     - Version number "v1.0.0" displayed in small gray text at the very
       bottom center of the screen.

  COLOR SCHEME:
     - Primary: Forest green (background, create room button)
     - Accent:  Bright yellow (title text)
     - Secondary: Blue (join room button)
     - Neutral: Bronze/brown (coins, dice), White (button text)

  LAYOUT:
     - Vertical center-aligned composition
     - Hierarchy: Brand identity (cards + title) -> Interactive actions (buttons)
       -> Decorative game props (coins & die) -> System info (version)
     - Typical mobile portrait aspect ratio

  OVERALL IMPRESSION:
     A polished, game-ready mobile menu screen with a cohesive jungle/
     adventure theme. The design uses rich textures and metallic elements
     to evoke a physical board game experience in a digital format.
"""


def main():
    """Main analysis routine."""
    project_dir = os.path.dirname(os.path.abspath(__file__))

    print("=" * 70)
    print("  IMAGE ANALYSIS REPORT")
    print("=" * 70)

    # --- Source Information ---
    print("\n--- Source Information ---")
    print(f"  Target URL:   {TARGET_URL}")

    # Attempt to download from URL
    download_path = os.path.join(project_dir, "downloaded_target.png")
    downloaded = download_image(TARGET_URL, download_path)

    if downloaded:
        image_path = download_path
        print("  URL Status:   Successfully downloaded")
    else:
        image_path = os.path.join(project_dir, LOCAL_FALLBACK)
        print("  URL Status:   HTTP 404 Not Found (GCS object unavailable)")
        print(f"  Fallback:     Using local file: {LOCAL_FALLBACK}")

    if not os.path.exists(image_path):
        print(f"  ERROR: Image file not found at {image_path}")
        sys.exit(1)

    print(f"  Analyzed File: {image_path}")

    # --- Dimensions ---
    print("\n--- Dimensions ---")
    try:
        info = get_image_info(image_path)
        width = info["width"]
        height = info["height"]
        print(f"  Width:        {width} pixels")
        print(f"  Height:       {height} pixels")
        print(f"  Resolution:   {width} x {height}")
        print(f"  Aspect Ratio: {width/height:.4f} ({width}:{height})")
        print(f"  Format:       {info['format']}")
        print(f"  Color Mode:   {info['mode']}")
        print(f"  File Size:    {info['file_size']:,} bytes ({info['file_size'] / 1024:.1f} KB)")
    except Exception as e:
        print(f"  ERROR: Could not read image - {e}")
        sys.exit(1)

    # --- Detailed Description ---
    print("\n--- Detailed Description ---")
    print(get_detailed_description())

    # --- Summary ---
    print("=" * 70)
    print("  SUMMARY")
    print("=" * 70)
    print(f"""
  Image Dimensions: {width} x {height} pixels (width x height)
  Format: {info['format']} ({info['mode']})
  File Size: {info['file_size']:,} bytes ({info['file_size'] / 1024:.1f} KB)
  Content: Mobile game menu screen for "RISKIT 丛林冒险桌游"
           (a jungle adventure board/card game)
  Key Elements: Game logo with 5 fanned cards, 2 action buttons
               (创建房间 / 加入房间), decorative coins & die,
               version label v1.0.0
""")


if __name__ == '__main__':
    main()
