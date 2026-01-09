
"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Image from "next/image";
import * as XLSX from 'xlsx';
import { Download, Trophy, Medal } from "lucide-react";
import participantData from "@/data/participants.json";

export default function AdminPage() {
    const { user, setUser, isLoading, setIsLoading } = useStore();
    const router = useRouter();
    const [photos, setPhotos] = useState<any[]>([]);

    useEffect(() => {
        const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setIsLoading(false);

            if (!currentUser) {
                router.push("/login");
                return;
            }

            // Debug logging
            console.log("Current User:", currentUser.email);

            // Access allowed for all logged-in users
        });

        return () => unsubAuth();
    }, [setUser, setIsLoading, router]);

    useEffect(() => {
        if (!user) return;

        const photoCol = collection(db, "photos");
        const unsub = onSnapshot(photoCol, (snapshot) => {
            const list = snapshot.docs.map(doc => {
                const data = doc.data();
                const totalScore = data.totalScore || 0;
                const voteCount = data.voteCount || 0;
                const average = voteCount > 0 ? (totalScore / voteCount).toFixed(2) : "0.00";

                // LOOKUP NAME
                // The JSON keys are like "YARISMA_ID_001.jpg" or "YARISMA_ID_001" depending on excel. 
                // The script output used "Jüri Dosya Adı" as key. 
                // Let's assume the excel keys might have extension. We need to handle both just in case 
                // or strip extension from ID if needed.
                // Current ID in firestore is "YARISMA_ID_001".

                let participantName = (participantData as any)[doc.id]
                    || (participantData as any)[doc.id + ".jpg"]
                    || (participantData as any)[doc.id + ".jpeg"]
                    || (participantData as any)[doc.id + ".JPG"]
                    || "Bilinmiyor";

                return {
                    id: doc.id,
                    participantName,
                    totalScore,
                    voteCount,
                    ...data,
                    average: parseFloat(average)
                };
            });

            // Sort by TOTAL SCORE descending (as requested)
            list.sort((a: any, b: any) => b.totalScore - a.totalScore);
            setPhotos(list);
        });

        return () => unsub();
    }, [user]);

    const exportToExcel = () => {
        if (photos.length === 0) {
            toast.error("Dışa aktarılacak veri yok");
            return;
        }

        const dataToExport = photos.map(photo => ({
            "Sıra": photos.indexOf(photo) + 1,
            "Fotoğraf ID": photo.id,
            "Katılımcı Adı": photo.participantName,
            "Ortalama Puan": photo.average,
            "Toplam Oy Sayısı": photo.voteCount,
            "Toplam Puan": photo.totalScore,
            "Görsel URL": photo.url
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        XLSX.utils.book_append_sheet(wb, ws, "Sonuçlar");
        XLSX.writeFile(wb, "Fotograf_Yarismasi_Sonuclar.xlsx");
        toast.success("Excel dosyası indirildi");
    };

    if (isLoading) return <div className="p-10 text-white min-h-screen bg-neutral-950 flex items-center justify-center">Yükleniyor...</div>;
    if (!user) return null;

    const top3 = photos.slice(0, 3);
    const gold = top3[0];
    const silver = top3[1];
    const bronze = top3[2];

    return (
        <div className="min-h-screen bg-neutral-950 text-white p-4 md:p-8">
            <header className="flex flex-col md:flex-row justify-between items-center mb-12 gap-4">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-200 to-yellow-500 bg-clip-text text-transparent">
                    🏆 Yarışma Sonuçları
                </h1>
                <div className="flex gap-4">
                    <Button variant="outline" onClick={() => router.push("/")} className="border-neutral-800 hover:bg-neutral-900 text-neutral-300">
                        Galeriye Dön
                    </Button>
                    <Button onClick={exportToExcel} className="bg-green-600 hover:bg-green-700 text-white">
                        <Download className="mr-2 h-4 w-4" /> Excel İndir
                    </Button>
                </div>
            </header>

            {/* WINNERS PODIUM */}
            {photos.length > 0 && (
                <div className="mb-16 flex flex-col md:flex-row items-end justify-center gap-8 md:gap-4 px-4">

                    {/* SILVER (2nd) */}
                    {silver && (
                        <div className="order-2 md:order-1 flex flex-col items-center w-full md:w-1/3 max-w-sm">
                            <div className="relative w-full aspect-[4/5] mb-4 rounded-xl overflow-hidden border-4 border-slate-400 shadow-[0_0_30px_rgba(148,163,184,0.3)]">
                                <Image src={silver.url} alt={silver.id} fill className="object-cover" />
                                <div className="absolute top-2 left-2 bg-slate-400 text-black font-bold px-3 py-1 rounded-full text-sm flex items-center shadow-lg">
                                    <Medal className="w-4 h-4 mr-1" /> 2.
                                </div>
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-slate-300">{silver.participantName}</h3>
                                <p className="text-sm text-neutral-500 mb-1">{silver.id}</p>
                                <p className="text-3xl font-bold text-white">{silver.totalScore}</p>
                                <p className="text-sm text-neutral-500">{silver.voteCount} Oy</p>
                            </div>
                        </div>
                    )}

                    {/* GOLD (1st) */}
                    {gold && (
                        <div className="order-1 md:order-2 flex flex-col items-center w-full md:w-1/3 max-w-md z-10 -mt-8 md:-mt-12 scale-110">
                            <div className="relative w-full aspect-[4/5] mb-4 rounded-xl overflow-hidden border-4 border-yellow-500 shadow-[0_0_50px_rgba(234,179,8,0.5)]">
                                <Image src={gold.url} alt={gold.id} fill className="object-cover" />
                                <div className="absolute top-0 right-0 p-4">
                                    <Trophy className="w-12 h-12 text-yellow-400 drop-shadow-md" />
                                </div>
                                <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/80 to-transparent p-6 text-center">
                                    <span className="text-yellow-400 font-bold tracking-widest text-lg">KAZANAN</span>
                                </div>
                            </div>
                            <div className="text-center">
                                <h3 className="text-2xl font-bold text-yellow-400">{gold.participantName}</h3>
                                <p className="text-sm text-neutral-400 mb-1">{gold.id}</p>
                                <p className="text-5xl font-bold text-white mt-1">{gold.totalScore}</p>
                                <p className="text-sm text-neutral-400 mt-1">{gold.voteCount} Oy / {gold.average} Ort.</p>
                            </div>
                        </div>
                    )}

                    {/* BRONZE (3rd) */}
                    {bronze && (
                        <div className="order-3 flex flex-col items-center w-full md:w-1/3 max-w-sm">
                            <div className="relative w-full aspect-[4/5] mb-4 rounded-xl overflow-hidden border-4 border-amber-700 shadow-[0_0_30px_rgba(180,83,9,0.3)]">
                                <Image src={bronze.url} alt={bronze.id} fill className="object-cover" />
                                <div className="absolute top-2 left-2 bg-amber-700 text-white font-bold px-3 py-1 rounded-full text-sm flex items-center shadow-lg">
                                    <Medal className="w-4 h-4 mr-1" /> 3.
                                </div>
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-amber-600">{bronze.participantName}</h3>
                                <p className="text-sm text-neutral-500 mb-1">{bronze.id}</p>
                                <p className="text-3xl font-bold text-white">{bronze.totalScore}</p>
                                <p className="text-sm text-neutral-500">{bronze.voteCount} Oy</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="border border-neutral-800 rounded-lg overflow-hidden bg-black/50 backdrop-blur-sm">
                <Table>
                    <TableHeader className="bg-neutral-900/50">
                        <TableRow className="border-neutral-800 hover:bg-neutral-900/50">
                            <TableHead className="text-neutral-300">Sıra</TableHead>
                            <TableHead className="text-neutral-300">Katılımcı</TableHead>
                            <TableHead className="text-neutral-300">Fotoğraf ID</TableHead>
                            <TableHead className="text-neutral-300 text-right">Ortalama Puan</TableHead>
                            <TableHead className="text-neutral-300 text-right">Toplam Oy</TableHead>
                            <TableHead className="text-neutral-300 text-right">Toplam Puan</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {photos.map((photo, index) => (
                            <TableRow key={photo.id} className="border-neutral-800 hover:bg-neutral-900/30">
                                <TableCell className="font-mono text-neutral-500">#{index + 1}</TableCell>
                                <TableCell className="font-bold text-white">{photo.participantName}</TableCell>
                                <TableCell className="font-mono text-neutral-400 text-sm">{photo.id}</TableCell>
                                <TableCell className="text-right font-bold text-lg text-yellow-500">{photo.average}</TableCell>
                                <TableCell className="text-right text-neutral-400">{photo.voteCount}</TableCell>
                                <TableCell className="text-right text-neutral-500">{photo.totalScore}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
