import os
import shutil
import argparse
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
from tqdm import tqdm

def get_image_paths(source_dir):
    image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.tiff'}
    paths = []
    for root, dirs, files in os.walk(source_dir):
        for file in files:
            if os.path.splitext(file)[1].lower() in image_extensions:
                paths.append(os.path.join(root, file))
    return paths

class FeatureExtractor:
    def __init__(self, model_name="resnet50"):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu")
        print(f"Using device: {self.device}")
        
        print(f"Loading model: {model_name}...")
        
        if model_name == "resnet152":
            weights = models.ResNet152_Weights.DEFAULT
            self.model = models.resnet152(weights=weights)
            # Remove classification layer
            self.model = nn.Sequential(*list(self.model.children())[:-1])
            self.preprocess = weights.transforms()
            
        elif model_name == "vit_b_16":
            weights = models.ViT_B_16_Weights.DEFAULT
            self.model = models.vit_b_16(weights=weights)
            # Remove heads to get representation
            self.model.heads = nn.Identity()
            self.preprocess = weights.transforms()
            
        elif model_name == "vit_l_16":
            weights = models.ViT_L_16_Weights.DEFAULT
            self.model = models.vit_l_16(weights=weights)
            # Remove heads to get representation
            self.model.heads = nn.Identity()
            self.preprocess = weights.transforms()
            
        else: # Default or resnet50
            weights = models.ResNet50_Weights.DEFAULT
            self.model = models.resnet50(weights=weights)
            self.model = nn.Sequential(*list(self.model.children())[:-1])
            self.preprocess = weights.transforms()
            
        self.model.eval()
        self.model.to(self.device)

    def extract(self, img_path):
        try:
            image = Image.open(img_path).convert('RGB')
            input_tensor = self.preprocess(image)
            input_batch = input_tensor.unsqueeze(0).to(self.device)
            
            with torch.no_grad():
                features = self.model(input_batch)
            
            # ResNet returns (1, 2048, 1, 1), ViT returns (1, 768)
            # Flatten ensures 1D array
            return features.cpu().numpy().flatten()
            
        except Exception as e:
            print(f"Error processing {img_path}: {e}")
            return None

def group_images(image_paths, threshold=0.95, model_name="resnet50", progress_callback=None):
    extractor = FeatureExtractor(model_name=model_name)
    
    features_list = []
    valid_paths = []
    
    total_images = len(image_paths)
    if progress_callback:
        progress_callback(0, total_images, "Starting feature extraction...")

    print("Extracting features...")
    for i, path in enumerate(image_paths):
        features = extractor.extract(path)
        if features is not None:
            features_list.append(features)
            valid_paths.append(path)
        
        if progress_callback:
            progress_callback(i + 1, total_images, f"Extracted features for {os.path.basename(path)}")
            
    if not features_list:
        return {}

    features_matrix = np.array(features_list)
    
    if progress_callback:
        progress_callback(total_images, total_images, "Calculating similarity matrix...")
    
    print("Calculating similarity matrix...")
    similarity_matrix = cosine_similarity(features_matrix)
    
    print("Grouping...")
    if progress_callback:
        progress_callback(total_images, total_images, "Grouping images...")

    visited = set()
    groups = {} 
    
    num_valid = len(valid_paths)
    for i in range(num_valid):
        if i in visited:
            continue
            
        current_group = [valid_paths[i]]
        visited.add(i)
        
        for j in range(i + 1, num_valid):
            if j in visited:
                continue
            
            sim = similarity_matrix[i, j]
            if sim >= threshold:
                current_group.append(valid_paths[j])
                visited.add(j)
        
        rep_name = os.path.splitext(os.path.basename(valid_paths[i]))[0]
        groups[rep_name] = current_group
        
    return groups

def move_groups(groups, target_dir, progress_callback=None):
    if not os.path.exists(target_dir):
        os.makedirs(target_dir)
        
    count = 0
    total_groups = len(groups)
    
    for i, (name, paths) in enumerate(groups.items()):
        if progress_callback:
            progress_callback(i, total_groups, f"Moving group {name}...")

        if len(paths) > 1:
            # Create a safe folder name
            # Use 'Group_' + name (trimmed if too long)
            safe_name = "".join([c for c in name if c.isalnum() or c in (' ', '-', '_')]).strip()
            folder_name = f"Group_{safe_name}"[:50] 
            
            # Ensure uniqueness if truncated
            group_path = os.path.join(target_dir, folder_name)
            suffix = 1
            while os.path.exists(group_path):
                group_path = os.path.join(target_dir, f"{folder_name}_{suffix}")
                suffix += 1
                
            os.makedirs(group_path)
            
            # print(f"Processing group {folder_name} with {len(paths)} images...")
            for img_path in paths:
                filename = os.path.basename(img_path)
                dest_path = os.path.join(group_path, filename)
                
                if os.path.exists(dest_path):
                    base, ext = os.path.splitext(filename)
                    dest_path = os.path.join(group_path, f"{base}_dup{ext}")
                
                try:
                    shutil.copy2(img_path, dest_path)
                except Exception as e:
                    print(f"Failed to copy {img_path}: {e}")
            count += 1
        elif len(paths) == 1:
            # Handle Unique Images
            unique_dir = os.path.join(target_dir, "Unique")
            if not os.path.exists(unique_dir):
                os.makedirs(unique_dir)
                
            img_path = paths[0]
            filename = os.path.basename(img_path)
            dest_path = os.path.join(unique_dir, filename)
            
            if os.path.exists(dest_path):
                base, ext = os.path.splitext(filename)
                dest_path = os.path.join(unique_dir, f"{base}_dup{ext}")
            
            try:
                shutil.copy2(img_path, dest_path)
            except Exception as e:
                print(f"Failed to copy unique {img_path}: {e}")
            
import google.generativeai as genai

def rename_groups_with_gemini(groups, target_dir, api_key, progress_callback=None):
    if not api_key:
        print("No API Key provided. Skipping AI renaming.")
        return

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-flash-latest')
    except Exception as e:
        print(f"Failed to configure Gemini: {e}")
        return

    print("Starting AI Renaming...")
    count = 0
    total_groups = len(groups)
    
    # Filter groups that actually exist in target_dir (i.e. size > 1)
    # The 'groups' dict has ALL groups, but we only moved those with len > 1
    # We also need to find the folder name we assigned to them.
    # Logic: Re-construct the folder name logic and check existence.
    
    for i, (name, paths) in enumerate(groups.items()):
        if len(paths) <= 1:
            continue
            
        if progress_callback:
            progress_callback(i, total_groups, f"AI analyzing group {name}...")
            
        safe_name = "".join([c for c in name if c.isalnum() or c in (' ', '-', '_')]).strip()
        folder_name_prefix = f"Group_{safe_name}"[:50]
        
        # Find the actual directory. It might have suffixes.
        # We need to find which folder corresponds to this group. 
        # Since we just moved them, we can try to find it.
        # OR, better: We should have returned the mapping of group_id -> new_folder_path from move_groups.
        # For now, let's search for the folder starting with this prefix in target_dir.
        
        found_dir = None
        candidates = [d for d in os.listdir(target_dir) if d.startswith(folder_name_prefix) and os.path.isdir(os.path.join(target_dir, d))]
        
        if not candidates:
            continue
            
        # If multiple candidates, it's risky. But 'name' comes from representative filename.
        # Usually it's unique enough or we relied on order.
        # Let's verify by checking if one of the images is inside.
        
        actual_group_path = None
        for cand in candidates:
            cand_path = os.path.join(target_dir, cand)
            # Check if first image is there
            test_img = os.path.basename(paths[0])
            # It might meet a duplicate suffix, so check loosely
            if any(test_img.split('.')[0] in f for f in os.listdir(cand_path)):
                actual_group_path = cand_path
                break
        
        if not actual_group_path:
            continue

        # Prepare Image for API
        try:
            sample_img_path = paths[0]
            img = Image.open(sample_img_path)
            
            prompt = (
                "Sana gönderdiğim görseldeki ürünü analiz et; türünü, ana rengini ve belirgin desenini tespit et. "
                "Bunu bilgisayar dosya sistemi için uygun, Türkçe karakter ve boşluk içermeyen, "
                "kelimelerin arasına tire (-) koyduğun, maksimum 4-5 kelimelik kısa ve net bir dosya ismine dönüştür. "
                "Cevap olarak sadece ürettiğin dosya ismini yaz, başka açıklama yapma."
            )
            
            response = model.generate_content([prompt, img])
            new_name = response.text.strip()
            
            # Clean up response just in case
            valid_chars = "-_.() abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
            clean_name = "".join(c for c in new_name if c in valid_chars)
            clean_name = clean_name.replace(" ", "-")
            
            if not clean_name:
                continue
                
            new_path = os.path.join(target_dir, clean_name)
            
            # Use 'Category_' prefix? Or just the name? User said "file name", implied folder name.
            # If exists, append suffix
            suffix = 1
            final_path = new_path
            while os.path.exists(final_path):
                final_path = f"{new_path}_{suffix}"
                suffix += 1
            
            os.rename(actual_group_path, final_path)
            # print(f"Renamed {os.path.basename(actual_group_path)} -> {os.path.basename(final_path)}")
            count += 1
            
        except Exception as e:
            print(f"Error renaming group {name}: {e}")
            # If API fails, just skip
            
    if progress_callback:
        progress_callback(total_groups, total_groups, f"AI Renaming Complete. Renamed {count} folders.")

def main():
    parser = argparse.ArgumentParser(description="Group similar images using Deep Learning (ResNet50).")
    parser.add_argument("--source", required=True, help="Source directory")
    parser.add_argument("--target", required=True, help="Target directory")
    parser.add_argument("--threshold", type=float, default=0.90, help="Cosine similarity threshold (0.0-1.0). Default 0.90")
    parser.add_argument("--model", default="resnet50", choices=["resnet50", "resnet152", "vit_b_16", "vit_l_16"], help="Model to use")
    parser.add_argument("--api-key", help="Gemini API Key for auto-renaming", default=None)
    
    args = parser.parse_args()
    
    if not os.path.exists(args.source):
        print(f"Source not found: {args.source}")
        return

    images = get_image_paths(args.source)
    print(f"Found {len(images)} images.")
    
    if not images:
        return

    groups = group_images(images, args.threshold, model_name=args.model)
    move_groups(groups, args.target)
    
    if args.api_key:
        rename_groups_with_gemini(groups, args.target, args.api_key)
        
    print("Done.")

if __name__ == "__main__":
    main()
