
"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

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

            // Simple Admin Check logic (should ideally be server-side or claims based)
            // Replace with your email
            if (currentUser.email !== "halukinal@gmail.com" && currentUser.email !== "admin@example.com") {
                toast.error("Yetkisiz Giriş");
                router.push("/");
            }
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
                return {
                    id: doc.id,
                    ...data,
                    average: parseFloat(average)
                };
            });

            // Sort by average descending
            list.sort((a, b) => b.average - a.average);
            setPhotos(list);
        });

        return () => unsub();
    }, [user]);

    if (isLoading) return <div className="p-10 text-white">Yükleniyor...</div>;
    if (!user) return null;

    return (
        <div className="min-h-screen bg-neutral-950 text-white p-8">
            <header className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Admin Paneli - Sonuçlar</h1>
                <Button variant="outline" onClick={() => router.push("/")} className="border-neutral-800">
                    Galeriye Dön
                </Button>
            </header>

            <div className="border border-neutral-800 rounded-lg overflow-hidden">
                <Table>
                    <TableHeader className="bg-neutral-900">
                        <TableRow className="border-neutral-800 hover:bg-neutral-900">
                            <TableHead className="text-neutral-300">Fotoğraf ID</TableHead>
                            <TableHead className="text-neutral-300 text-right">Ortalama Puan</TableHead>
                            <TableHead className="text-neutral-300 text-right">Toplam Oy</TableHead>
                            <TableHead className="text-neutral-300 text-right">Toplam Puan</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {photos.map((photo) => (
                            <TableRow key={photo.id} className="border-neutral-800 hover:bg-neutral-900">
                                <TableCell className="font-mono">{photo.id}</TableCell>
                                <TableCell className="text-right font-bold text-lg">{photo.average}</TableCell>
                                <TableCell className="text-right">{photo.voteCount}</TableCell>
                                <TableCell className="text-right text-neutral-400">{photo.totalScore}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
