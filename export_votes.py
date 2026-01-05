import firebase_admin
from firebase_admin import credentials
from google.cloud import firestore
import pandas as pd
import os
from datetime import datetime

# --- KONFIGURASYON ---
SERVICE_ACCOUNT_PATH = 'serviceAccountKey.json'
OUTPUT_FILE = 'oylama_sonuclari.xlsx'

def export_votes():
    # 1. Firebase Baglantisi
    if not os.path.exists(SERVICE_ACCOUNT_PATH):
        print(f"HATA: '{SERVICE_ACCOUNT_PATH}' dosyasi bulunamadi!")
        return

    # Initialize Firebase explicitly for the 'foto' database if not already initialized
    if not firebase_admin._apps:
        cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
        firebase_admin.initialize_app(cred)

    # Connect to 'foto' database
    db = firestore.Client.from_service_account_json(SERVICE_ACCOUNT_PATH, database='foto')
    
    print("Oylar veritabanindan cekiliyor...")

    # 2. Oylari Çek
    votes_ref = db.collection('votes')
    docs = votes_ref.stream()

    data = []
    for doc in docs:
        vote = doc.to_dict()
        # Convert timestamp to string if present
        ts = vote.get('timestamp')
        if ts:
            vote['timestamp'] = ts.strftime('%Y-%m-%d %H:%M:%S')
        
        data.append(vote)

    if not data:
        print("Hic oy bulunamadi.")
        return

    # 3. Excel'e Kaydet
    df = pd.DataFrame(data)
    
    # Organize columns (optional cleanup)
    desired_order = ['photoId', 'score', 'juryEmail', 'comment', 'timestamp']
    # Filter only columns that exist in data
    cols = [c for c in desired_order if c in df.columns]
    # Add any other columns at the end
    remaining = [c for c in df.columns if c not in cols]
    final_cols = cols + remaining
    
    df = df[final_cols]
    
    # Sort by photoId for better readability
    if 'photoId' in df.columns:
        df = df.sort_values(by='photoId')

    try:
        df.to_excel(OUTPUT_FILE, index=False)
        print(f"✅ Oylama sonuclari basariyla kaydedildi: {OUTPUT_FILE}")
        print(f"Toplam {len(df)} oy bulundu.")
    except Exception as e:
        print(f"Kaydetme hatasi: {e}")
        # Fallback to CSV if Excel fails (e.g. missing openpyxl)
        csv_file = OUTPUT_FILE.replace('.xlsx', '.csv')
        df.to_csv(csv_file, index=False)
        print(f"Excel hatasi nedeniyle CSV olarak kaydedildi: {csv_file}")

if __name__ == "__main__":
    export_votes()
