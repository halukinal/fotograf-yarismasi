"use client";

import { useState } from "react";
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import Image from "next/image";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isRegister, setIsRegister] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { setUser } = useStore();

    // Giriş veya Kayıt İşlemi
    const handleAuthAction = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let userCredential;

            if (isRegister) {
                // KAYIT OLMA İŞLEMİ
                userCredential = await createUserWithEmailAndPassword(auth, email, password);
                toast.success("Hesap başarıyla oluşturuldu!");
            } else {
                // GİRİŞ YAPMA İŞLEMİ
                userCredential = await signInWithEmailAndPassword(auth, email, password);
                toast.success("Giriş başarılı!");
            }

            setUser(userCredential.user);
            router.push("/"); // Ana sayfaya yönlendir

        } catch (error: any) {
            console.error(error);
            let message = "Bir hata oluştu.";

            // Kullanıcı dostu hata mesajları
            if (error.code === 'auth/email-already-in-use') message = "Bu e-mail zaten kullanımda.";
            else if (error.code === 'auth/invalid-credential') message = "E-mail veya şifre hatalı.";
            else if (error.code === 'auth/weak-password') message = "Şifre çok zayıf (en az 6 karakter olmalı).";

            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            setUser(result.user);
            toast.success("Google ile giriş başarılı!");
            router.push("/");
        } catch (error: any) {
            console.error(error);
            toast.error("Google girişi başarısız: " + error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* LEFT SIDE - Monument Image */}
            <div className="relative hidden lg:block bg-neutral-900">
                <Image
                    src="/dumlupinar-monument.png"
                    alt="Dumlupınar Şehitliği"
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-black/40" /> {/* Slight dark overlay */}
                <div className="absolute bottom-10 left-10 text-white z-10">
                    <h2 className="text-3xl font-serif font-bold mb-2">Tarih, Kültür ve Sanat</h2>
                    <p className="text-white/80 max-w-md">Yüzüncü Yıl Tarih Kültür Sanat ve Fotoğraf Derneği Oylama Sistemi</p>
                </div>
            </div>

            {/* RIGHT SIDE - Login Form */}
            <div className="flex items-center justify-center bg-white text-neutral-900 p-8">
                <div className="w-full max-w-md space-y-10">

                    {/* Header Logos */}
                    <div className="flex justify-center gap-6">
                        {/* Placeholder for Logo 1 */}
                        <div className="relative w-20 h-20 rounded-full overflow-hidden border border-neutral-200 shadow-sm">
                            <Image src="/dernek-logo.jpeg" alt="Logo 1" fill className="object-cover" />
                        </div>
                    </div>

                    <div className="text-center space-y-2">
                        <h1 className="text-4xl font-serif font-bold tracking-tight text-neutral-900">
                            Fotoğraf Yarışması
                        </h1>
                        <p className="text-neutral-500 font-sans">
                            {isRegister ? "Jüri üyeliği için hesabınızı oluşturun" : "Jüri paneline giriş yapın"}
                        </p>
                    </div>

                    <form onSubmit={handleAuthAction} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-neutral-700 font-semibold">E-mail Adresi</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="adiniz@ornek.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="bg-neutral-50 border-neutral-200 focus:ring-neutral-900 focus:border-neutral-900 h-12"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-neutral-700 font-semibold">Şifre</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="bg-neutral-50 border-neutral-200 focus:ring-neutral-900 focus:border-neutral-900 h-12"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-[#FFC107] text-black hover:bg-[#e0a800] font-bold text-lg h-12 shadow-sm transition-transform active:scale-[0.98]"
                            disabled={loading}
                        >
                            {loading ? "İşlem yapılıyor..." : (isRegister ? "Hesap Oluştur" : "Sisteme Giriş Yap")}
                        </Button>
                    </form>

                    <div className="space-y-4 pt-4">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-neutral-200" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 text-neutral-400">
                                    Veya seçenekler
                                </span>
                            </div>
                        </div>

                        <Button
                            onClick={handleGoogleLogin}
                            variant="outline"
                            className="w-full border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900 h-12 font-medium"
                            disabled={loading}
                        >
                            <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
                            Google ile Devam Et
                        </Button>
                    </div>

                    <div className="text-center pt-2">
                        <button
                            type="button"
                            onClick={() => setIsRegister(!isRegister)}
                            className="text-sm text-neutral-500 hover:text-neutral-900 underline underline-offset-4 transition-colors"
                        >
                            {isRegister ? "Zaten hesabın var mı? Giriş Yap" : "Hesabın yok mu? Kayıt Ol"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}