
"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { VotingDialog } from "@/components/VotingDialog";
import { Loader2 } from "lucide-react";

export default function GalleryPage() {
  const { user, setUser, isLoading, setIsLoading } = useStore();
  const router = useRouter();
  const [photos, setPhotos] = useState<any[]>([]);
  const [myVotes, setMyVotes] = useState<Record<string, number>>({});
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Auth & Data Listener
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
      if (!currentUser) {
        router.push("/login");
      }
    });

    return () => unsubAuth();
  }, [setUser, setIsLoading, router]);

  useEffect(() => {
    if (!user) return;

    // Listen to Photos
    const photosQuery = query(collection(db, "photos"));
    const unsubPhotos = onSnapshot(photosQuery, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPhotos(list);
    });

    // Listen to My Votes
    const votesQuery = query(collection(db, "votes"), where("juryEmail", "==", user.email));
    const unsubVotes = onSnapshot(votesQuery, (snapshot) => {
      const votesMap: Record<string, number> = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        votesMap[data.photoId] = data.score;
      });
      setMyVotes(votesMap);
    });

    return () => {
      unsubPhotos();
      unsubVotes();
    };
  }, [user]);

  const handleVoteClick = (photo: any) => {
    setSelectedPhoto(photo);
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-950 text-white gap-2">
        <Loader2 className="animate-spin" /> Yükleniyor...
      </div>
    );
  }

  if (!user) return null; // Router handles redirect

  return (
    <main className="min-h-screen bg-neutral-950 text-white p-4 sm:p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Oylama Galerisi</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-neutral-400">{user.email}</span>
          <Button variant="outline" onClick={() => auth.signOut()} className="border-neutral-800 hover:bg-neutral-800">
            Çıkış Yap
          </Button>
        </div>
      </header>

      {/* Masonry-like Grid using CSS columns */}
      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
        {photos.map((photo) => {
          const myScore = myVotes[photo.id];
          const isVoted = myScore !== undefined;

          return (
            <Card
              key={photo.id}
              className={`break-inside-avoid bg-neutral-900 border-neutral-800 overflow-hidden transition-opacity ${isVoted ? 'opacity-60 hover:opacity-100' : ''}`}
            >
              <div className="relative aspect-[3/4] w-full bg-neutral-950">
                <Image
                  src={photo.url}
                  alt={photo.id}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
              <CardFooter className="p-4 flex justify-between items-center bg-neutral-900">
                <div>
                  <p className="text-xs font-mono text-neutral-500 truncate max-w-[100px]">{photo.id}</p>
                </div>
                <Button
                  size="sm"
                  variant={isVoted ? "secondary" : "default"}
                  className={isVoted ? "bg-neutral-800 text-neutral-300" : "bg-white text-black hover:bg-neutral-200"}
                  onClick={() => handleVoteClick(photo)}
                >
                  {isVoted ? `Puan: ${myScore}` : "Oyla"}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <VotingDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        photo={selectedPhoto}
      />
    </main>
  );
}
