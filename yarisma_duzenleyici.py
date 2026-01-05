import os
import shutil
import pandas as pd
from pathlib import Path

def main():
    # 1. Girdi ve Yol Bilgileri
    ANA_DIZIN = "/Volumes/KIOXIA/fotograf_yarismasi"
    JURI_KLASOR_ADI = "_JURI_OYLAMA_HAVUZU"
    JURI_KLASOR_YOLU = os.path.join(ANA_DIZIN, JURI_KLASOR_ADI)
    
    EXCEL_DOSYA_ADI = "KATILIMCI_ESLESME_LISTESI.xlsx"
    EXCEL_DOSYA_YOLU = os.path.join(ANA_DIZIN, EXCEL_DOSYA_ADI)

    # Desteklenen resim formatları
    RESIM_UZANTILARI = {'.jpg', '.jpeg', '.png'} # Küçük harfle kontrol edilecek

    print(f"--- İşlem Başlıyor ---")
    print(f"Ana Dizin: {ANA_DIZIN}")

    # Ana dizin kontrolü
    if not os.path.exists(ANA_DIZIN):
        print(f"HATA: Ana dizin bulunamadı: {ANA_DIZIN}")
        print("Lütfen harici diskin takılı ve yolun doğru olduğundan emin olun.")
        return

    # 2. Jüri klasörünü oluştur veya temizle
    if os.path.exists(JURI_KLASOR_YOLU):
        print(f"Klasör temizleniyor: {JURI_KLASOR_YOLU}")
        # İçindeki dosyaları silmek için
        for dosya in os.listdir(JURI_KLASOR_YOLU):
            dosya_yolu = os.path.join(JURI_KLASOR_YOLU, dosya)
            try:
                if os.path.isfile(dosya_yolu) or os.path.islink(dosya_yolu):
                    os.unlink(dosya_yolu)
                elif os.path.isdir(dosya_yolu):
                    shutil.rmtree(dosya_yolu)
            except Exception as e:
                print(f"Dosya silinirken hata: {e}")
    else:
        print(f"Klasör oluşturuluyor: {JURI_KLASOR_YOLU}")
        os.makedirs(JURI_KLASOR_YOLU)

    # Veri seti için liste
    kayitlar = []
    
    # Sayaç
    sayac = 1

    # 3. Ana dizindeki alt klasörleri tara
    # Ana dizindeki tüm öğeleri listele
    for eleman in os.listdir(ANA_DIZIN):
        eleman_yolu = os.path.join(ANA_DIZIN, eleman)

        # Sadece klasörleri işle
        if not os.path.isdir(eleman_yolu):
            continue

        # Özel klasörleri ve sistem dosyalarını atla
        if eleman == JURI_KLASOR_ADI or eleman.startswith('.'):
            continue

        katilimci_adi = eleman
        print(f"\nİşleniyor: {katilimci_adi}")

        # 4. Alt klasördeki resim dosyalarını bul
        for dosya_adi in os.listdir(eleman_yolu):
            dosya_tam_yolu = os.path.join(eleman_yolu, dosya_adi)
            
            # Dosya mı diye kontrol et
            if not os.path.isfile(dosya_tam_yolu):
                continue

            # Uzantı kontrolü
            dosya_uzantisi = os.path.splitext(dosya_adi)[1].lower()
            if dosya_uzantisi not in RESIM_UZANTILARI:
                continue
            
            # Orijinal uzantıyı koru (büyük/küçük harf duyarlı olabilir, dosya isminden alalım)
            orijinal_uzanti = os.path.splitext(dosya_adi)[1]

            # 5. Benzersiz ve anonim dosya ismi üret
            yeni_dosya_adi = f"YARISMA_ID_{sayac:03d}{orijinal_uzanti}"
            hedef_dosya_yolu = os.path.join(JURI_KLASOR_YOLU, yeni_dosya_adi)

            # 6. KOPYALA
            shutil.copy2(dosya_tam_yolu, hedef_dosya_yolu)
            print(f"  -> Kopyalandı: {yeni_dosya_adi}")

            # 7. Veri setine ekle
            kayitlar.append({
                'Jüri Dosya Adı': yeni_dosya_adi,
                'Katılımcı Adı': katilimci_adi,
                'Orijinal Dosya Adı': dosya_adi
            })

            sayac += 1

    # 8. Excel olarak kaydet
    print("\n--- Excel Dosyası Oluşturuluyor ---")
    if kayitlar:
        df = pd.DataFrame(kayitlar)
        try:
            df.to_excel(EXCEL_DOSYA_YOLU, index=False)
            print(f"Başarılı: {EXCEL_DOSYA_YOLU} dosyasına kaydedildi.")
            print(f"Toplam {len(kayitlar)} fotoğraf işlendi.")
        except Exception as e:
            print(f"Excel kaydederken hata oluştu: {e}")
    else:
        print("Hiçbir geçerli fotoğraf bulunamadı, Excel dosyası oluşturulmadı.")

    print("\n--- İşlem Tamamlandı ---")

if __name__ == "__main__":
    main()
