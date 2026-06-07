"""List dimensions (width, height) of all PNG and WEBP images in the current directory."""

import os
from pathlib import Path
from PIL import Image


def list_image_dimensions(directory: str = ".") -> None:
    """Scan the given directory for PNG/WEBP files and print their dimensions."""
    target_extensions = {".png", ".webp"}
    dir_path = Path(directory)

    # Collect matching files (non-recursive, current directory only)
    image_files = sorted(
        f for f in dir_path.iterdir()
        if f.is_file() and f.suffix.lower() in target_extensions
    )

    if not image_files:
        print("No PNG or WEBP images found in the current directory.")
        return

    print(f"{'File Name':<30} {'Width':>8} {'Height':>8}")
    print("-" * 48)

    for filepath in image_files:
        try:
            with Image.open(filepath) as img:
                width, height = img.size
            print(f"{filepath.name:<30} {width:>8} {height:>8}")
        except Exception as e:
            print(f"{filepath.name:<30} {'ERROR':>8} - {e}")


if __name__ == "__main__":
    list_image_dimensions(os.path.dirname(os.path.abspath(__file__)) or ".")
