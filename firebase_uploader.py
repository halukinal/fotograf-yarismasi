import firebase_admin
from firebase_admin import credentials, firestore, storage
import os

# --- KONFIGURASYON ---
# Service account dosyanizin tam yolunu buraya yazin
SERVICE_ACCOUNT_PATH = 'serviceAccountKey.json' 

# Firebase Storage Bucket adiniz (gs:// olmadan)
# Ornek: 'proje-id.appspot.com'
BUCKET_NAME = 'YOUR_BUCKET_NAME.appspot.com'

# Fotograflarin bulundugu klasor
SOURCE_FOLDER = '_JURI_OYLAMA_HAVUZU'

def upload_photos():
    # 1. Firebase Baglantisi
    if not os.path.exists(SERVICE_ACCOUNT_PATH):
        print(f"HATA: '{SERVICE_ACCOUNT_PATH}' dosyasi bulunamadi!")
        print("Lutfen Firebase Service Account JSON dosyasini bu scriptin yanina koyun veya yolunu duzeltin.")
        return

    cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
    firebase_admin.initialize_app(cred, {
        'storageBucket': BUCKET_NAME
    })

    db = firestore.client()
    bucket = storage.bucket()

    # 2. Klasoru Tara
    if not os.path.exists(SOURCE_FOLDER):
        print(f"HATA: '{SOURCE_FOLDER}' klasoru bulunamadi!")
        return

    files = [f for f in os.listdir(SOURCE_FOLDER) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp'))]
    total_files = len(files)
    print(f"Toplam {total_files} fotograf bulundu. Yukleme basliyor...")

    uploaded_count = 0

    for filename in files:
        local_path = os.path.join(SOURCE_FOLDER, filename)
        
        # Dosya adini ID olarak kullan (uzanti olmadan veya kisa ID isterseniz parse edin)
        # Istek: id: Dosya adı (örn: YARISMA_ID_001) -> tam dosya adini mi yoksa uzantisiz mi? 
        # Genelde dosya adi unique ise direkt kullanilabilir. 
        # "id: Dosya adı" dendiği için filename'i kullanıyoruz. 
        # Ancak Firestore ID'lerinde '.' karakteri sorun cikarabilir mi? Hayir, document ID string olabilir.
        # Yine de temiz gorunmesi icin uzantiyi atabiliriz ama talep "Dosya adı" oldugu icin filename kullanalim.
        # Eger kullanici ID'yi "YARISMA_ID_001" gibi (uzantisiz) kastediyorsa, splitext yapalim.
        # Ornekte "YARISMA_ID_001" verildigi icin uzantiyi atiyorum.
        
        doc_id = os.path.splitext(filename)[0] 
        storage_path = f"photos/{filename}"
        
        try:
            # 3. Storage Yukleme
            blob = bucket.blob(storage_path)
            blob.upload_from_filename(local_path)
            
            # Public URL alma
            blob.make_public()
            public_url = blob.public_url
            
            # 4. Firestore Kaydi
            doc_ref = db.collection('photos').document(doc_id)
            doc_ref.set({
                'id': doc_id,
                'url': public_url,
                'totalScore': 0,
                'voteCount': 0
            })
            
            uploaded_count += 1
            print(f"[{uploaded_count}/{total_files}] Yuklendi: {filename} -> {public_url}")

        except Exception as e:
            print(f"HATA: {filename} yuklenirken hata olustu: {e}")

    print("-" * 30)
    print(f"Islem tamamlandi. {uploaded_count}/{total_files} fotograf basariyla yuklendi.")

if __name__ == "__main__":
    upload_photos()
