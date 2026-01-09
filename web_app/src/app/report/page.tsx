"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, onSnapshot, query, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ArrowLeft, BarChart3, PieChart } from "lucide-react";
import participantData from "@/data/participants.json";

// Helper to parse Name Surname from email
const parseJuryName = (email: string) => {
    if (!email) return "Bilinmiyor";
    try {
        const parts = email.split('@');
        if (parts.length < 2) return email;

        const namePart = parts[0];
        // Split by dot or any non-alphanumeric if needed, but user said dot.
        return namePart.split('.')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
    } catch (e) {
        return email;
    }
};

export default function ReportPage() {
    const { user, setUser, isLoading, setIsLoading } = useStore();
    const router = useRouter();
    const [photos, setPhotos] = useState<any[]>([]);
    const [votes, setVotes] = useState<any[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setIsLoading(false);
            if (!currentUser) {
                router.push("/login");
                return;
            }

            // Access Check
            const allowedEmails = ["amil.ucbas@yuzuncuyil.juri", "haluk.inal@yuzuncuyil.juri"];
            if (!currentUser.email || !allowedEmails.includes(currentUser.email)) {
                // toast.error("Bu sayfaya erişim yetkiniz yok."); // Optional: show toast
                router.push("/");
            }
        });
        return () => unsubAuth();
    }, [setUser, setIsLoading, router]);

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            setLoadingData(true);
            try {
                // Fetch Photos
                const photosRef = collection(db, "photos");
                const photosSnap = await getDocs(photosRef);
                const photoList = photosSnap.docs.map(doc => {
                    const data = doc.data();
                    let participantName = (participantData as any)[doc.id]
                        || (participantData as any)[doc.id + ".jpg"]
                        || (participantData as any)[doc.id + ".jpeg"]
                        || (participantData as any)[doc.id + ".JPG"]
                        || "Bilinmiyor";
                    return {
                        id: doc.id,
                        participantName,
                        totalScore: data.totalScore || 0,
                        voteCount: data.voteCount || 0,
                        url: data.url,
                        average: data.voteCount > 0 ? (data.totalScore / data.voteCount).toFixed(2) : "0.00"
                    };
                });

                // Sort by Total Score
                photoList.sort((a, b) => b.totalScore - a.totalScore);
                setPhotos(photoList);

                // Fetch Votes
                const votesRef = collection(db, "votes");
                const votesSnap = await getDocs(votesRef);
                const voteList = votesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setVotes(voteList);
            } catch (e) {
                console.error("Error fetching data:", e);
            } finally {
                setLoadingData(false);
            }
        };

        fetchData();
    }, [user]);

    if (isLoading || loadingData) return <div className="p-10 text-white min-h-screen bg-neutral-950 flex items-center justify-center">Veriler Analiz Ediliyor...</div>;
    if (!user) return null;

    // --- ANALYSIS LOGIC ---

    // 1. Top 5 Photos
    const top5 = photos.slice(0, 5);

    // 2. Jury Stats
    const juryStats: Record<string, number> = {};
    votes.forEach((v: any) => {
        const jury = v.juryEmail;
        if (!juryStats[jury]) juryStats[jury] = 0;
        juryStats[jury]++;
    });

    const juryList = Object.entries(juryStats)
        .map(([email, count]) => ({ email, name: parseJuryName(email), count }))
        .sort((a, b) => b.count - a.count);

    return (
        <div className="min-h-screen bg-neutral-950 text-white p-4 md:p-8">
            <header className="mb-10 flex flex-col md:flex-row gap-4 items-center justify-between border-b border-neutral-800 pb-6">
                <div>
                    <Button variant="ghost" onClick={() => router.back()} className="mb-2 text-neutral-400 hover:text-white pl-0">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Geri Dön
                    </Button>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <BarChart3 className="text-indigo-500" /> Detaylı Oylama Raporu
                    </h1>
                </div>
            </header>

            <div className="space-y-16">

                {/* SECTION 1: TOP 5 BREAKDOWN */}
                <section>
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-yellow-500">
                        🏆 İlk 5 Fotoğraf Analizi
                    </h2>
                    <div className="grid grid-cols-1 gap-8">
                        {top5.map((photo, index) => {
                            // Find votes for this photo
                            const photoVotes = votes.filter((v: any) => v.photoId === photo.id);
                            // Sort votes by score desc
                            photoVotes.sort((a: any, b: any) => b.score - a.score);

                            return (
                                <div key={photo.id} className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden flex flex-col lg:flex-row">
                                    {/* Photo Preview */}
                                    <div className="w-full lg:w-1/3 relative aspect-video lg:aspect-auto">
                                        <Image src={photo.url} alt={photo.id} fill className="object-cover" />
                                        <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10">
                                            <span className="text-2xl font-bold text-yellow-400">#{index + 1}</span>
                                        </div>
                                        <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/90 to-transparent p-4">
                                            <p className="text-lg font-bold">{photo.participantName}</p>
                                            <p className="text-neutral-400 text-sm">{photo.id}</p>
                                            <div className="mt-2 flex gap-4 text-sm font-mono">
                                                <span className="text-yellow-400 font-bold">TOPLAM: {photo.totalScore}</span>
                                                <span className="text-neutral-300">ORT: {photo.average}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Votes Table */}
                                    <div className="w-full lg:w-2/3 p-6">
                                        <h3 className="text-lg font-semibold mb-4 text-neutral-300 border-b border-neutral-800 pb-2">Jüri Oyları ({photoVotes.length})</h3>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm text-left text-neutral-400">
                                                <thead className="text-xs text-neutral-500 uppercase bg-neutral-950/50">
                                                    <tr>
                                                        <th className="px-4 py-2">Jüri İsmi</th>
                                                        <th className="px-4 py-2 text-right">Puan</th>
                                                        <th className="px-4 py-2">Yorum</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {photoVotes.map((vote: any) => (
                                                        <tr key={vote.id} className="border-b border-neutral-800 hover:bg-neutral-800/30">
                                                            <td className="px-4 py-2 font-medium text-white">
                                                                {parseJuryName(vote.juryEmail)}
                                                            </td>
                                                            <td className="px-4 py-2 text-right">
                                                                <span className={`font-bold px-2 py-1 rounded ${vote.score >= 4 ? 'bg-green-900/40 text-green-400' :
                                                                    vote.score >= 3 ? 'bg-yellow-900/40 text-yellow-400' :
                                                                        'bg-red-900/40 text-red-400'
                                                                    }`}>
                                                                    {vote.score}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-2 italic text-neutral-500 max-w-[200px] truncate">
                                                                {vote.comment || "-"}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* SECTION 2: JURY PARTICIPATION */}
                <section className="pb-20">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-indigo-400">
                        <PieChart className="text-indigo-500" /> Jüri Katılım Analizi
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {juryList.map((jury) => (
                            <div key={jury.email} className="bg-neutral-900 p-4 rounded-lg border border-neutral-800 flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-white text-lg">{jury.name}</p>
                                    <p className="text-xs text-neutral-500">{jury.email}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-indigo-400">{jury.count}</p>
                                    <p className="text-xs text-neutral-500 uppercase">Oy</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

            </div>
        </div>
    );
}
