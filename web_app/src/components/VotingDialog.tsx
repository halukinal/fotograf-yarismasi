
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
                    className="absolute top-6 left-6 z-50 p-3 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full transition-colors"
                >
                    <span className="sr-only">Kapat</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>

                {/* 1. LAYER: Full Screen Image (Modified to fit in free space) */}
                <div className="absolute inset-0 w-full h-full z-0 bg-black flex items-center justify-center md:pr-[380px]">
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

                {/* 2. LAYER: Controls Overlay (Right Side) */}
                <div className="absolute right-0 top-0 bottom-0 w-full md:w-[380px] z-10 bg-neutral-900/90 backdrop-blur-md border-l border-white/10 flex flex-col p-6 shadow-2xl transition-transform duration-300">
                    <DialogHeader className="mb-6 shrink-0">
                        <DialogTitle className="text-xl font-mono text-neutral-200 truncate pr-8">{photo.id}</DialogTitle>
                        <DialogDescription className="text-neutral-400">
                            Puanınızı seçin ve yorumunuzu ekleyin.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 space-y-8 overflow-y-auto pr-2 custom-scrollbar">
                        {/* Vote Buttons 1-5 */}
                        <div className="space-y-4">
                            <Label className="text-lg text-white">Puan</Label>
                            <div className="grid grid-cols-5 gap-2">
                                {[1, 2, 3, 4, 5].map((v) => (
                                    <Button
                                        key={v}
                                        variant={score === v ? "default" : "outline"}
                                        className={`h-14 text-xl font-bold transition-all ${score === v
                                            ? "bg-white text-black hover:bg-neutral-200 scale-105 shadow-lg border-transparent"
                                            : "bg-transparent border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:text-white"
                                            }`}
                                        onClick={() => setScore(v)}
                                    >
                                        {v}
                                    </Button>
                                ))}
                            </div>
                            <div className="flex justify-between px-1 text-xs text-neutral-500 uppercase tracking-widest font-medium">
                                <span>Kötü</span>
                                <span>Mükemmel</span>
                            </div>
                        </div>

                        {/* Optional Comment */}
                        <div className="space-y-2">
                            <Label className="text-white">Yorum (Opsiyonel)</Label>
                            <Textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                className="bg-black/30 border-neutral-700 resize-none h-40 focus:border-neutral-500 focus:ring-0 text-neutral-200 placeholder:text-neutral-600"
                                placeholder="Fotoğraf hakkında düşünceleriniz..."
                            />
                        </div>
                    </div>

                    <DialogFooter className="mt-6 pt-6 border-t border-white/10 shrink-0">
                        <Button
                            size="lg"
                            className="w-full bg-white text-black hover:bg-neutral-200 font-bold text-lg h-14 shadow-lg transition-transform active:scale-[0.98]"
                            onClick={handleSave}
                            disabled={loading || score === null}
                        >
                            {loading ? "Kaydediliyor..." : (existingVote ? "Oyu Güncelle" : "OYU GÖNDER")}
                        </Button>
                    </DialogFooter>
                </div>

            </DialogContent>
        </Dialog>
    );
}
