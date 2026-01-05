import os
from PIL import Image, ImageDraw

def create_test_data(base_dir="test_data"):
    if os.path.exists(base_dir):
        import shutil
        shutil.rmtree(base_dir)
    os.makedirs(base_dir)
    
    source_dir = os.path.join(base_dir, "source")
    target_dir = os.path.join(base_dir, "target")
    os.makedirs(source_dir)
    os.makedirs(target_dir)
    
    # Helper to create a gradient image
    def create_gradient(width, height, c1, c2):
        base = Image.new('RGB', (width, height), c1)
        top = Image.new('RGB', (width, height), c2)
        mask = Image.new('L', (width, height))
        mask_data = []
        for y in range(height):
            for x in range(width):
                mask_data.append(int(255 * (y / height)))
        mask.putdata(mask_data)
        base.paste(top, (0, 0), mask)
        return base
    
    # Create Base Image 1 (Red to Blue Gradient)
    img1 = create_gradient(256, 256, (255, 0, 0), (0, 0, 255))
    img1.save(os.path.join(source_dir, 'gradient1.jpg'))
    
    # Create Variation 1 - JPEG compression artifacts / subtle noise
    # We'll just resize and save with lower quality
    img1_var = img1.resize((200, 200)).resize((256, 256))
    img1_var.save(os.path.join(source_dir, 'gradient1_var.jpg'), quality=50)
    
    # Create Base Image 2 (Green to Yellow)
    img2 = create_gradient(256, 256, (0, 255, 0), (255, 255, 0))
    img2.save(os.path.join(source_dir, 'gradient2.jpg'))
    
    # Create Base Image 3 (Random Noise)
    img3 = Image.effect_noise((256, 256), 50)
    img3.save(os.path.join(source_dir, 'noise.jpg'))

    print(f"Created test data in {base_dir}")
    return source_dir, target_dir

if __name__ == "__main__":
    create_test_data()
