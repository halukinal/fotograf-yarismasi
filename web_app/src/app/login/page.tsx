
"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useStore } from "@/lib/store";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { setUser } = useStore();

    const checkJuryAccess = async (userEmail: string) => {
        // Admin bypass (replace with actual admin email check if needed, or rely on db)
        // For now, checking 'juries' collection
        const q = query(collection(db, "juries"), where("email", "==", userEmail));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            // Check if admin
            if (userEmail === "halukinal@gmail.com" || userEmail === "admin@example.com") { // Replace with actual admin logic
                return true;
            }
            return false;
        }
        return true;
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const hasAccess = await checkJuryAccess(user.email!);
            if (!hasAccess) {
                toast.error("Giriş yetkiniz bulunmamaktadır.");
                await auth.signOut();
                setLoading(false);
                return;
            }

            setUser(user);
            toast.success("Giriş başarılı!");
            router.push("/");
        } catch (error: any) {
            console.error(error);
            toast.error("Giriş başarısız: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            const hasAccess = await checkJuryAccess(user.email!);
            if (!hasAccess) {
                toast.error("Giriş yetkiniz bulunmamaktadır.");
                await auth.signOut();
                setLoading(false);
                return;
            }

            setUser(user);
            toast.success("Giriş başarılı!");
            router.push("/");
        } catch (error: any) {
            console.error(error);
            toast.error("Google girişi başarısız: " + error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-neutral-950 px-4">
            <Card className="w-full max-w-md border-neutral-800 bg-neutral-900 text-neutral-100">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold tracking-tight text-white">
                        Fotoğraf Yarışması
                    </CardTitle>
                    <CardDescription className="text-neutral-400">
                        Jüri paneline giriş yapın
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">E-mail</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="ornek@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-neutral-950 border-neutral-800 focus:ring-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Şifre</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-neutral-950 border-neutral-800 focus:ring-white"
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full bg-white text-black hover:bg-neutral-200"
                            disabled={loading}
                        >
                            {loading ? "Giriş Yapılıyor..." : "Giriş Yap"}
                        </Button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-neutral-800" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-neutral-900 px-2 text-neutral-400">
                                Veya
                            </span>
                        </div>
                    </div>

                    <Button
                        onClick={handleGoogleLogin}
                        variant="outline"
                        className="w-full border-neutral-800 hover:bg-neutral-800 hover:text-white"
                        disabled={loading}
                    >
                        Google ile Giriş Yap
                    </Button>

                </CardContent>
            </Card>
        </div>
    );
}
