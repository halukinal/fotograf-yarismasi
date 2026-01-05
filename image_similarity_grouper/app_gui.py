import tkinter as tk
from tkinter import filedialog
import customtkinter as ctk
import threading
import time
import os
import sys
from group_similar_images_dl import get_image_paths, group_images, move_groups

# Configure appearance
ctk.set_appearance_mode("System")  # Modes: "System" (standard), "Dark", "Light"
ctk.set_default_color_theme("blue")  # Themes: "blue", "green", "dark-blue"

class App(ctk.CTk):
    def __init__(self):
        super().__init__()

        self.title("AI Image Grouper - Deep Learning")
        self.geometry("800x600")

        # Grid configuration
        self.grid_columnconfigure(1, weight=1)
        self.grid_rowconfigure(4, weight=1)

        # Variables
        self.source_path = tk.StringVar(value="/Volumes/KIOXIA/Aydın el sanatları ürün fotoğrafları/Ufak Boyut/Urun_Klasorleri_S_2")
        self.target_path = tk.StringVar(value="/Volumes/KIOXIA/Aydın el sanatları ürün fotoğrafları/Ufak Boyut/Hedef")
        self.threshold = tk.DoubleVar(value=0.95)
        self.model_choice = tk.StringVar(value="ResNet50 (Fast)")
        self.api_key = tk.StringVar()
        self.enable_ai = tk.BooleanVar(value=False)
        self.status_message = tk.StringVar(value="Ready")
        self.is_running = False
        
        # --- UI Elements ---

        # TITLE
        self.label_title = ctk.CTkLabel(self, text="AI Image Similarity Grouper", font=ctk.CTkFont(size=20, weight="bold"))
        self.label_title.grid(row=0, column=0, columnspan=3, padx=20, pady=(20, 10))

        # SOURCE INPUT
        self.label_source = ctk.CTkLabel(self, text="Source Folder:")
        self.label_source.grid(row=1, column=0, padx=20, pady=10, sticky="w")
        
        self.entry_source = ctk.CTkEntry(self, textvariable=self.source_path, placeholder_text="/path/to/source")
        self.entry_source.grid(row=1, column=1, padx=10, pady=10, sticky="ew")
        
        self.btn_source = ctk.CTkButton(self, text="Browse", command=self.browse_source, width=80)
        self.btn_source.grid(row=1, column=2, padx=20, pady=10)

        # TARGET INPUT
        self.label_target = ctk.CTkLabel(self, text="Target Folder:")
        self.label_target.grid(row=2, column=0, padx=20, pady=10, sticky="w")
        
        self.entry_target = ctk.CTkEntry(self, textvariable=self.target_path, placeholder_text="/path/to/target")
        self.entry_target.grid(row=2, column=1, padx=10, pady=10, sticky="ew")
        
        self.btn_target = ctk.CTkButton(self, text="Browse", command=self.browse_target, width=80)
        self.btn_target.grid(row=2, column=2, padx=20, pady=10)

        # THRESHOLD SLIDER
        self.label_thresh = ctk.CTkLabel(self, text="Similarity (0.95):")
        self.label_thresh.grid(row=3, column=0, padx=20, pady=10, sticky="w")
        
        self.slider_thresh = ctk.CTkSlider(self, from_=0.80, to=1.0, variable=self.threshold, number_of_steps=20, command=self.update_thresh_label)
        self.slider_thresh.grid(row=3, column=1, padx=10, pady=10, sticky="ew")
        
        # MODEL SELECTION
        self.label_model = ctk.CTkLabel(self, text="AI Model:")
        self.label_model.grid(row=4, column=0, padx=20, pady=10, sticky="w")
        
        self.combo_model = ctk.CTkComboBox(self, variable=self.model_choice, values=["ResNet50 (Fast)", "ResNet152 (Accurate)", "ViT-B/16 (Best for Patterns)", "ViT-Large (Ultimate)"])
        self.combo_model.grid(row=4, column=1, padx=10, pady=10, sticky="ew")
        
        # GEMINI AI SETTINGS
        self.frame_ai = ctk.CTkFrame(self)
        self.frame_ai.grid(row=5, column=0, columnspan=3, padx=20, pady=10, sticky="ew")
        
        self.check_ai = ctk.CTkCheckBox(self.frame_ai, text="Enable AI Auto-Naming (Gemini)", variable=self.enable_ai)
        self.check_ai.pack(side="left", padx=10, pady=10)
        
        self.entry_api = ctk.CTkEntry(self.frame_ai, textvariable=self.api_key, placeholder_text="Enter Gemini API Key", width=300)
        self.entry_api.pack(side="left", padx=10, pady=10, fill="x", expand=True)

        # START BUTTON
        self.btn_start = ctk.CTkButton(self, text="START PROCESSING", command=self.start_processing, height=40, font=ctk.CTkFont(weight="bold"))
        self.btn_start.grid(row=6, column=0, columnspan=3, padx=20, pady=10)

        # CONSOLE / LOG
        self.textbox_log = ctk.CTkTextbox(self, width=760, height=150)
        self.textbox_log.grid(row=7, column=0, columnspan=3, padx=20, pady=10, sticky="nsew")
        
        # STATUS & PROGRESS
        self.progressbar = ctk.CTkProgressBar(self)
        self.progressbar.grid(row=8, column=0, columnspan=3, padx=20, pady=(10, 0), sticky="ew")
        self.progressbar.set(0)
        
        self.label_status = ctk.CTkLabel(self, textvariable=self.status_message, text_color="gray")
        self.label_status.grid(row=9, column=0, columnspan=3, padx=20, pady=(0, 20), sticky="w")
        
        self.label_time = ctk.CTkLabel(self, text="Elapsed: 00:00 | Remaining: --:--", text_color="gray")
        self.label_time.grid(row=9, column=0, columnspan=3, padx=20, pady=(0, 20), sticky="e")
        
    def update_thresh_label(self, value):
        self.label_thresh.configure(text=f"Similarity ({value:.2f}):")

    def browse_source(self):
        path = filedialog.askdirectory()
        if path:
            self.source_path.set(path)

    def browse_target(self):
        path = filedialog.askdirectory()
        if path:
            self.target_path.set(path)

    def log(self, message):
        self.textbox_log.insert("end", message + "\n")
        self.textbox_log.see("end")

    def start_processing(self):
        if self.is_running:
            return
            
        source = self.source_path.get()
        target = self.target_path.get()
        thresh = self.threshold.get()
        api_key = self.api_key.get()
        use_ai = self.enable_ai.get()
        model_human = self.model_choice.get()
        
        # Map human readable to internal name
        model_map = {
            "ResNet50 (Fast)": "resnet50",
            "ResNet152 (Accurate)": "resnet152",
            "ViT-B/16 (Best for Patterns)": "vit_b_16",
            "ViT-Large (Ultimate)": "vit_l_16"
        }
        model_name = model_map.get(model_human, "resnet50")
        
        if not source or not target:
            self.log("Error: Please select both source and target directories.")
            return
            
        if use_ai and not api_key:
            self.log("Error: AI Renaming enabled but no API Key provided.")
            return
            
        if not os.path.exists(source):
            self.log(f"Error: Source does not exist: {source}")
            return
            
        self.is_running = True
        self.btn_start.configure(state="disabled")
        self.progressbar.set(0)
        self.textbox_log.delete("0.0", "end") # Clear log
        
        # Start thread
        thread = threading.Thread(target=self.run_logic, args=(source, target, thresh, use_ai, api_key, model_name))
        thread.start()
        
        # Start timer
        self.start_time = time.time()
        self.after(1000, self.update_timer)

    def update_timer(self):
        if not self.is_running:
            return
            
        elapsed = int(time.time() - self.start_time)
        m, s = divmod(elapsed, 60)
        elapsed_str = f"{m:02d}:{s:02d}"
        
        # Simple ETA based on progress
        progress = self.progressbar.get()
        if progress > 0.01:
            total_estimated = elapsed / progress
            remaining = int(total_estimated - elapsed)
            rm, rs = divmod(remaining, 60)
            rem_str = f"{rm:02d}:{rs:02d}"
        else:
            rem_str = "--:--"
            
        self.label_time.configure(text=f"Elapsed: {elapsed_str} | Remaining: {rem_str}")
        self.after(1000, self.update_timer)

    def run_logic(self, source, target, threshold, use_ai, api_key, model_name):
        try:
            self.log(f"Starting... Model: {model_name}")
            self.log(f"Source: {source}\nTarget: {target}\nThresh: {threshold:.2f}")
            
            # 1. Find Images
            self.status_message.set("Scanning for images...")
            images = get_image_paths(source)
            self.log(f"Found {len(images)} images.")
            
            if not images:
                self.log("No images found.")
                self.finish_processing()
                return
            
            # 2. Group Images with callback
            def progress_cb(current, total, msg):
                ratio = current / total if total > 0 else 0
                self.progressbar.set(ratio)
                self.status_message.set(f"{msg} ({current}/{total})")
                
            groups = group_images(images, threshold, model_name=model_name, progress_callback=progress_cb)
            self.log(f"Found {len(groups)} unique groups.")
            
            # 3. Move Groups
            self.log("Moving files...")
            self.status_message.set("Moving files...")
            
            def move_cb(current, total, msg):
                ratio = current / total if total > 0 else 0
                self.progressbar.set(ratio)
                self.status_message.set(f"{msg} ({current}/{total})")

            move_groups(groups, target, progress_callback=move_cb)
            
            # 4. AI Renaming
            if use_ai and api_key:
                from group_similar_images_dl import rename_groups_with_gemini
                self.log("Starting AI Renaming...")
                self.status_message.set("AI Renaming...")
                
                def ai_cb(current, total, msg):
                    ratio = current / total if total > 0 else 0
                    self.progressbar.set(ratio)
                    self.status_message.set(f"{msg} ({current}/{total})")
                    
                rename_groups_with_gemini(groups, target, api_key, progress_callback=ai_cb)
            
            self.log("Processing Complete!")
            self.status_message.set("Done.")
            
        except Exception as e:
            self.log(f"An error occurred: {e}")
            import traceback
            traceback.print_exc()
        finally:
            self.finish_processing()

    def finish_processing(self):
        self.is_running = False
        self.btn_start.configure(state="normal")
        self.progressbar.set(1)

if __name__ == "__main__":
    app = App()
    app.mainloop()
