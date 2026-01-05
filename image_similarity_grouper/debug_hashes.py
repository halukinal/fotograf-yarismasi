import os
import imagehash
from PIL import Image

def debug_hashes(directory):
    print(f"Hashing images in {directory}...")
    hashes = {}
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.lower().endswith(('.jpg', '.png')):
                path = os.path.join(root, file)
                try:
                    with Image.open(path) as img:
                        h = imagehash.phash(img)
                        hashes[file] = h
                        print(f"{file}: {h}")
                except Exception as e:
                    print(f"Error {file}: {e}")
                    
    # Compare all pairs
    keys = list(hashes.keys())
    for i in range(len(keys)):
        for j in range(i+1, len(keys)):
            k1 = keys[i]
            k2 = keys[j]
            diff = hashes[k1] - hashes[k2]
            print(f"Diff '{k1}' vs '{k2}': {diff}")

if __name__ == "__main__":
    debug_hashes("test_data/source")
