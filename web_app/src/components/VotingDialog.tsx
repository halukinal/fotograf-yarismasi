
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { doc, runTransaction, serverTimestamp, getDoc, collection } from "firebase/firestore";
import { useStore } from "@/lib/store";
import Image from "next/image";

interface VotingDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    photo: any; // Type this properly later
}

export function VotingDialog({ open, onOpenChange, photo }: VotingDialogProps) {
    const { user } = useStore();
    const [score, setScore] = useState<number | null>(null);
    const [comment, setComment] = useState("");
    const [loading, setLoading] = useState(false);
    const [existingVote, setExistingVote] = useState<any>(null);

    useEffect(() => {
        if (open && user && photo) {
            // Check for existing vote
            const fetchVote = async () => {
                const voteId = `${photo.id}_${user.email}`;
                const voteRef = doc(db, 'votes', voteId);
                const voteSnap = await getDoc(voteRef);
                if (voteSnap.exists()) {
                    const data = voteSnap.data();
                    setExistingVote(data);
                    setScore(data.score);
                    setComment(data.comment || "");
                } else {
                    setExistingVote(null);
                    setScore(null);
                    setComment("");
                }
            };
            fetchVote();
        }
    }, [open, user, photo]);

    const handleSave = async () => {
        if (!user || !photo || score === null) {
            toast.error("Lütfen bir puan seçin");
            return;
        }
        setLoading(true);

        const voteId = `${photo.id}_${user.email}`;
        const photoRef = doc(db, 'photos', photo.id);
        const voteRef = doc(db, 'votes', voteId);
        const logRef = doc(collection(db, 'logs'));

        try {
            await runTransaction(db, async (transaction) => {
                const sfDoc = await transaction.get(photoRef);
                if (!sfDoc.exists()) {
                    throw "Photo does not exist!";
                }

                const currentScore = existingVote ? existingVote.score : 0;
                const scoreDiff = score - currentScore;

                // Update photo stats
                const newTotalScore = (sfDoc.data().totalScore || 0) + scoreDiff;
                const newVoteCount = (sfDoc.data().voteCount || 0) + (existingVote ? 0 : 1);

                transaction.update(photoRef, {
                    totalScore: newTotalScore,
                    voteCount: newVoteCount
                });

                // Set vote
                transaction.set(voteRef, {
                    photoId: photo.id,
                    juryEmail: user.email,
                    score: score,
                    comment: comment,
                    timestamp: serverTimestamp()
                });

                // Log
                transaction.set(logRef, {
                    action: existingVote ? "UPDATE_VOTE" : "VOTE",
                    user: user.email,
                    photoId: photo.id,
                    score: score,
                    comment: comment, // Yorumu da loglara ekle
                    timestamp: serverTimestamp()
                });
            });

            toast.success("Oylama kaydedildi!");
            onOpenChange(false);
        } catch (e: any) {
            console.error(e);
            toast.error("Hata: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    if (!photo) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="fixed !z-50 !left-0 !top-0 !right-0 !bottom-0 !w-screen !h-screen !max-w-none !translate-x-0 !translate-y-0 border-none bg-black p-0 shadow-none focus:outline-none data-[state=open]:!slide-in-from-left-0 data-[state=open]:!slide-in-from-top-0 rounded-none">

                {/* Close Button Overlay */}
                <button
                    onClick={() => onOpenChange(false)}
                    className="absolute top-4 right-4 z-50 p-2 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full transition-colors md:top-6 md:left-6 md:right-auto"
                >
                    <span className="sr-only">Kapat</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>

                <div className="flex flex-col md:flex-row w-full h-full bg-black">
                    {/* 1. LAYER: Image Container */}
                    <div className="flex-1 relative w-full h-[50vh] md:h-full bg-black">
                        <div className="relative w-full h-full p-4">
                            <Image
                                src={photo.url}
                                alt={photo.id}
                                fill
                                className="object-contain"
                                priority
                                sizes="(max-width: 768px) 100vw, calc(100vw - 380px)"
                            />
                        </div>
                    </div>

                    {/* 2. LAYER: Controls Sidebar */}
                    <div className="w-full md:w-[380px] shrink-0 bg-neutral-900 border-t md:border-t-0 md:border-l border-white/10 flex flex-col h-[50vh] md:h-full shadow-2xl z-10">
                        <div className="p-6 flex flex-col h-full overflow-hidden">
                            <DialogHeader className="mb-4 shrink-0">
                                <DialogTitle className="text-xl font-mono text-neutral-200 truncate pr-8">{photo.id}</DialogTitle>
                                <DialogDescription className="text-neutral-400">
                                    Puanınızı seçin ve yorumunuzu ekleyin.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pr-2 min-h-0">
                                {/* Vote Buttons 1-5 */}
                                <div className="space-y-4">
                                    <Label className="text-lg text-white">Puan</Label>
                                    <div className="grid grid-cols-5 gap-1 md:gap-2">
                                        {[
                                            { val: 1, label: "Yetersiz" },
                                            { val: 2, label: "Gelişmeli" },
                                            { val: 3, label: "Orta" },
                                            { val: 4, label: "İyi" },
                                            { val: 5, label: "Mükemmel" }
                                        ].map((item) => (
                                            <Button
                                                key={item.val}
                                                variant={score === item.val ? "default" : "outline"}
                                                className={`h-16 md:h-20 flex flex-col items-center justify-center gap-1 transition-all p-1 ${score === item.val
                                                    ? "bg-white text-black hover:bg-neutral-200 scale-105 shadow-lg border-transparent"
                                                    : "bg-transparent border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-white"
                                                    }`}
                                                onClick={() => setScore(item.val)}
                                            >
                                                <span className="text-xl md:text-2xl font-bold leading-none">{item.val}</span>
                                                <span className="text-[9px] md:text-[10px] uppercase tracking-tighter font-medium leading-none">{item.label}</span>
                                            </Button>
                                        ))}
                                    </div>

                                    {/* Optional Comment */}
                                    <div className="space-y-2">
                                        <Label className="text-white">Yorum (Opsiyonel)</Label>
                                        <Textarea
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            className="bg-black/30 border-neutral-700 resize-none h-24 md:h-40 focus:border-neutral-500 focus:ring-0 text-neutral-200 placeholder:text-neutral-600"
                                            placeholder="Fotoğraf hakkında düşünceleriniz..."
                                        />
                                    </div>
                                </div>

                                <DialogFooter className="mt-4 pt-4 border-t border-white/10 shrink-0">
                                    <Button
                                        size="lg"
                                        className="w-full bg-white text-black hover:bg-neutral-200 font-bold text-lg h-12 md:h-14 shadow-lg transition-transform active:scale-[0.98]"
                                        onClick={handleSave}
                                        disabled={loading || score === null}
                                    >
                                        {loading ? "Kaydediliyor..." : (existingVote ? "Oyu Güncelle" : "OYU GÖNDER")}
                                    </Button>
                                </DialogFooter>
                            </div>
                        </div>
                    </div>
                </div>

            </DialogContent>
        </Dialog>
    );
}
