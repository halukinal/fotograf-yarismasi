
import pandas as pd
import json
import os

EXCEL_PATH = "/Volumes/KIOXIA/fotograf_yarismasi/fotograf_yarismasi/KATILIMCI_ESLESME_LISTESI.xlsx"
OUTPUT_PATH = "/Volumes/KIOXIA/fotograf_yarismasi/fotograf_yarismasi/web_app/src/data/participants.json"

def convert_excel_to_json():
    try:
        # Create output directory if it doesn't exist
        os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

        # Read Excel
        # Assuming columns like 'Yarisma ID' or 'ID' and 'Ad Soyad' or similar to match. 
        # Since I haven't seen the columns, I'll print the head first to debug if needed, 
        # but will try to be smart.
        # Actually, let's just dump it to a simple key-value structure assuming:
        # Col 0: ID (key)
        # Col 1: Name (value)
        # Or I will search for 'YARISMA_ID' like column.
        
        df = pd.read_excel(EXCEL_PATH)
        
        # Find ID column
        id_col = None
        for col in df.columns:
            if "ID" in str(col).upper() or "KOD" in str(col).upper():
                id_col = col
                break
        
        # Find Name column
        name_col = None
        for col in df.columns:
            if "AD" in str(col).upper() or "ISIM" in str(col).upper():
                name_col = col
                break
        
        if not id_col or not name_col:
            print(f"Columns not found. Available: {df.columns}")
            # Fallback to first and second columns
            id_col = df.columns[0]
            name_col = df.columns[1]
            print(f"Fallback to {id_col} and {name_col}")

        print(f"Using ID Col: {id_col}, Name Col: {name_col}")

        # Create Dictionary
        mapping = {}
        for index, row in df.iterrows():
            clean_id = str(row[id_col]).strip()
            # Ensure it matches the format used in app (e.g., YARISMA_ID_001)
            # If excel has just '1', we might need to verify.
            # Assuming excel has full IDs or we just map what's there.
            
            clean_name = str(row[name_col]).strip()
            mapping[clean_id] = clean_name
            
        # Write to JSON
        with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
            json.dump(mapping, f, ensure_ascii=False, indent=2)
            
        print(f"Successfully converted. Saved to {OUTPUT_PATH}")
        print(f"Total entries: {len(mapping)}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    convert_excel_to_json()
