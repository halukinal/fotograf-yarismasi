
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
    const [score, setScore] = useState([5]);
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
                    setScore([data.score]);
                    setComment(data.comment || "");
                } else {
                    setExistingVote(null);
                    setScore([5]);
                    setComment("");
                }
            };
            fetchVote();
        }
    }, [open, user, photo]);

    const handleSave = async () => {
        if (!user || !photo) return;
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
                const scoreDiff = score[0] - currentScore;

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
                    score: score[0],
                    comment: comment,
                    timestamp: serverTimestamp()
                });

                // Log
                transaction.set(logRef, {
                    action: existingVote ? "UPDATE_VOTE" : "VOTE",
                    user: user.email,
                    photoId: photo.id,
                    score: score[0],
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
            <DialogContent className="max-w-4xl w-full h-[90vh] bg-neutral-900 border-neutral-800 text-white flex flex-col md:flex-row gap-6 p-6">

                {/* Image Section */}
                <div className="flex-1 relative bg-black/50 rounded-lg overflow-hidden flex items-center justify-center">
                    <div className="relative w-full h-full min-h-[300px]">
                        <Image
                            src={photo.url}
                            alt={photo.id}
                            fill
                            className="object-contain"
                        />
                    </div>
                </div>

                {/* Controls Section */}
                <div className="w-full md:w-80 flex flex-col gap-6">
                    <DialogHeader>
                        <DialogTitle>{photo.id}</DialogTitle>
                        <DialogDescription className="text-neutral-400">
                            Lütfen bu fotoğrafı 1 ile 10 arasında puanlayın.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label>Puan</Label>
                                <span className="text-xl font-bold text-white">{score[0]}</span>
                            </div>
                            <Slider
                                value={score}
                                onValueChange={setScore}
                                max={10}
                                min={1}
                                step={1}
                                className="py-4"
                            />
                            <div className="flex justify-between text-xs text-neutral-500 px-1">
                                <span>1</span>
                                <span>5</span>
                                <span>10</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Yorum (Opsiyonel)</Label>
                            <Textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                className="bg-neutral-950 border-neutral-800 resize-none h-32"
                                placeholder="..."
                            />
                        </div>
                    </div>

                    <DialogFooter className="mt-auto sm:justify-start">
                        <Button
                            className="w-full bg-white text-black hover:bg-neutral-200"
                            onClick={handleSave}
                            disabled={loading}
                        >
                            {loading ? "Kaydediliyor..." : (existingVote ? "Oyu Güncelle" : "Oyu Kaydet")}
                        </Button>
                    </DialogFooter>
                </div>

            </DialogContent>
        </Dialog>
    );
}
