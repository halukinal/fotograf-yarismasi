import os
import shutil
import imagehash
from PIL import Image

def find_images(source_dir):
    """
    Recursively scans for image files in the source directory.
    """
    image_extensions = {'.jpg', '.jpeg', '.png'}
    images = []
    for root, dirs, files in os.walk(source_dir):
        for file in files:
            if os.path.splitext(file)[1].lower() in image_extensions:
                images.append(os.path.join(root, file))
    return images

def group_images(image_paths, threshold=5):
    """
    Groups images based on pHash similarity.
    Returns a dictionary where keys are the hash of the first image in the group,
    and values are lists of image paths in that group.
    """
    groups = {}
    
    # Store hashes to avoid re-computing for comparisons
    # Key: hash string, Value: list of image paths
    # We will use the first image's hash as the key for the group?
    # Or should we just store lists of (hash, path) and iterate?
    
    # Let's use a list of groups, where each group has a representative hash.
    # groups structure: { representative_hash: [list_of_image_paths] }
    
    hashes = {} # Cache hashes
    
    total = len(image_paths)
    print(f"Hashing {total} images...")
    
    for i, img_path in enumerate(image_paths):
        try:
            with Image.open(img_path) as img:
                h = imagehash.phash(img)
                hashes[img_path] = h
        except Exception as e:
            print(f"Error processing {img_path}: {e}")
            continue
            
    print("Grouping images...")
    
    grouped_images = {} # Key: specific hash object (representative), Value: list of paths
    
    # Simple naive grouping: pairwise comparison with existing groups
    # O(N*G) where N is images, G is number of groups.
    
    for img_path, h in hashes.items():
        found_group = False
        for group_hash in grouped_images:
            if h - group_hash < threshold:
                grouped_images[group_hash].append(img_path)
                found_group = True
                break
        
        if not found_group:
            grouped_images[h] = [img_path]
            
    return grouped_images

def move_groups(groups, target_dir):
    """
    Moves groups of images to the target directory.
    Only moves groups with more than 1 image.
    """
    if not os.path.exists(target_dir):
        os.makedirs(target_dir)
        
    count = 0
    for h, paths in groups.items():
        if len(paths) > 1:
            group_name = f"Grup_{str(h)}"
            group_path = os.path.join(target_dir, group_name)
            
            if not os.path.exists(group_path):
                os.makedirs(group_path)
            
            print(f"Processing group {group_name} with {len(paths)} images...")
            for img_path in paths:
                filename = os.path.basename(img_path)
                # Handle potential duplicate filenames if coming from different subdirs
                dest_path = os.path.join(group_path, filename)
                
                # If file exists, append a suffix
                if os.path.exists(dest_path):
                    base, ext = os.path.splitext(filename)
                    dest_path = os.path.join(group_path, f"{base}_{count}{ext}")
                
                try:
                    shutil.copy2(img_path, dest_path)
                except Exception as e:
                    print(f"Failed to copy {img_path} to {dest_path}: {e}")
            count += 1
            
    print(f"Created {count} groups in {target_dir}")

import argparse

def main():
    parser = argparse.ArgumentParser(description="Group similar images based on pHash.")
    parser.add_argument("--source", required=True, help="Source directory containing images")
    parser.add_argument("--target", required=True, help="Target directory for grouped images")
    parser.add_argument("--threshold", type=int, default=15, help="Similarity threshold (default: 15)")
    
    args = parser.parse_args()
    
    SOURCE_DIR = args.source
    TARGET_DIR = args.target
    THRESHOLD = args.threshold
    
    print("--- Image Similarity Grouper ---")
    print(f"Source: {SOURCE_DIR}")
    print(f"Target: {TARGET_DIR}")
    print(f"Threshold: {THRESHOLD}")
    
    if not os.path.exists(SOURCE_DIR):
        print(f"Error: Source directory '{SOURCE_DIR}' does not exist.")
        return
    
    images = find_images(SOURCE_DIR)
    if not images:
        print("No images found in source folder.")
        return

    groups = group_images(images, THRESHOLD)
    move_groups(groups, TARGET_DIR)
    print("Done.")

if __name__ == "__main__":
    main()
