"use client";

import { useState, useEffect } from "react";
import { Geist_Mono, Playfair_Display } from "next/font/google";
import Image from "next/image";

const geistMono = Geist_Mono({ subsets: ["latin"] });
const playfair = Playfair_Display({ subsets: ["latin"] });

// Target Date: Jan 9, 2026 14:00:00 (Turkey Time GMT+3)
const TARGET_DATE = new Date("2026-01-09T11:00:00+03:00").getTime();

const QUOTES = [
    { text: "Sabır, boyun eğmek değil, mücadele etmektir.", author: "Hz. Ömer" },
    { text: "Beklemesini bilenin her şey ayağına gelir.", author: "Honoré de Balzac" },
    { text: "Taşı delen suyun gücü değil, damlaların sürekliliğidir.", author: "Latin Atasözü" },
    { text: "Roma bir günde kurulmadı.", author: "Anonim" },
    { text: "Emek olmadan yemek olmaz.", author: "Türk Atasözü" },
    { text: "Sabır acıdır, fakat meyvesi tatlıdır.", author: "Jean-Jacques Rousseau" },
    { text: "Deha, %1 ilham ve %99 terdir.", author: "Thomas Edison" },
    { text: "Hiçbir şeye cesaret edemeyen, hiçbir şeye ümit beslemesin.", author: "Friedrich Schiller" },
    { text: "Zorluklar, başarının değerini artıran süslerdir.", author: "Moliere" },
    { text: "Büyük işler, kuvvetle değil, devamlılıkla başarılır.", author: "Samuel Johnson" },
    { text: "En uzun yolculuklar bile tek bir adımla başlar.", author: "Lao Tzu" },
    { text: "Başarı, her gün tekrarlanan küçük çabaların toplamıdır.", author: "Robert Collier" },
    { text: "Damlaya damlaya göl olur.", author: "Türk Atasözü" },
    { text: "Güneşin sana ulaşmasını istiyorsan gölgeden çıkmalısın.", author: "Konfüçyüs" },
    { text: "Karanlığa küfredeceğine bir mum yak.", author: "Konfüçyüs" },
    { text: "Umut, uyanık insanların rüyasıdır.", author: "Aristoteles" },
    { text: "Taşlar değil, yapılan işler anıtları meydana getirir.", author: "John T. Motley" },
    { text: "Yarınlar yorgun ve bezgin kimselere değil, rahatını terk edebilen gayretli insanlara aittir.", author: "Cicero" },
    { text: "Sanatsız kalan bir milletin hayat damarlarından biri kopmuş demektir.", author: "Mustafa Kemal Atatürk" },
    { text: "Hayal gücü bilgiden daha önemlidir.", author: "Albert Einstein" },
    { text: "Düşünüyorum, öyleyse varım.", author: "René Descartes" },
    { text: "Bildiğim tek şey, hiçbir şey bilmediğimdir.", author: "Sokrates" },
    { text: "Zaman her şeyin ilacıdır.", author: "Türk Atasözü" },
    { text: "Kendini bil.", author: "Yunus Emre" }
];

export function CountdownGuard({ children }: { children: React.ReactNode }) {
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const [quoteIndex, setQuoteIndex] = useState<number>(0);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Initial random quote
        setQuoteIndex(Math.floor(Math.random() * QUOTES.length));
        setIsLoaded(true);

        // Timer Interval
        const timerInterval = setInterval(() => {
            const now = new Date().getTime();
            const difference = TARGET_DATE - now;
            setTimeLeft(difference);

            if (difference <= 0) {
                clearInterval(timerInterval);
            }
        }, 1000);

        // Quote Rotation Interval (Every 5 seconds)
        const quoteInterval = setInterval(() => {
            setQuoteIndex((prev) => {
                // Pick a random index distinct from the current one to avoid repetition
                let newIndex = Math.floor(Math.random() * QUOTES.length);
                while (newIndex === prev && QUOTES.length > 1) {
                    newIndex = Math.floor(Math.random() * QUOTES.length);
                }
                return newIndex;
            });
        }, 5000);

        return () => {
            clearInterval(timerInterval);
            clearInterval(quoteInterval);
        };
    }, []);

    if (!isLoaded || timeLeft === null) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-neutral-950 text-white">
                {/* Loading state */}
            </div>
        );
    }

    // If time is up, show the site
    if (timeLeft <= 0) {
        return <>{children}</>;
    }

    // Calculate time units
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    const currentQuote = QUOTES[quoteIndex];

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 text-white p-6 relative overflow-hidden">
            {/* Background Gradient */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neutral-800 via-neutral-950 to-neutral-950 opacity-40 z-0 pointer-events-none" />

            <div className="z-10 flex flex-col items-center max-w-2xl w-full text-center space-y-12">

                {/* Logo/Header */}
                <div className="space-y-4 animate-fade-in-down flex flex-col items-center">
                    {/* Fixed Logo Display: Explicit Dimensions */}
                    <div className="relative rounded-full overflow-hidden shadow-2xl border border-neutral-800">
                        <Image
                            src="/dernek-logo.jpeg"
                            alt="Dernek Logo"
                            width={120}
                            height={120}
                            className="object-cover"
                            priority
                        />
                    </div>
                    <h1 className={`${playfair.className} text-3xl md:text-5xl font-bold tracking-tight text-neutral-100 mt-4`}>
                        Büyük Açılış
                    </h1>
                    <p className="text-neutral-400 text-sm md:text-base">
                        Yüzüncü Yıl Tarih Kültür Sanat ve Fotoğraf Derneği
                    </p>
                </div>

                {/* Countdown Timer */}
                <div className={`${geistMono.className} grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 w-full`}>
                    {[
                        { label: "Gün", value: days },
                        { label: "Saat", value: hours },
                        { label: "Dakika", value: minutes },
                        { label: "Saniye", value: seconds },
                    ].map((item, idx) => (
                        <div key={idx} className="flex flex-col items-center p-4 bg-neutral-900/50 border border-neutral-800 rounded-xl backdrop-blur-sm">
                            <span className="text-4xl md:text-6xl font-bold bg-gradient-to-br from-white to-neutral-500 bg-clip-text text-transparent">
                                {String(item.value).padStart(2, "0")}
                            </span>
                            <span className="text-xs md:text-sm uppercase tracking-widest text-neutral-500 mt-2">
                                {item.label}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Quote - with Fade Key for Animation */}
                <div
                    key={quoteIndex} // Triggers re-render animation when index changes
                    className="space-y-4 max-w-lg mx-auto opacity-80 mt-8 animate-fade-in-up"
                >
                    <div className="w-12 h-0.5 bg-neutral-800 mx-auto mb-6" />
                    <p className={`${playfair.className} text-xl md:text-2xl italic leading-relaxed text-neutral-300 transition-all duration-500`}>
                        &ldquo;{currentQuote.text}&rdquo;
                    </p>
                    <p className="text-sm text-neutral-500 font-medium">
                        — {currentQuote.author}
                    </p>
                </div>

                {/* Date Info */}
                <div className="mt-12 text-xs text-neutral-600 font-mono">
                    Hedeflenen Açılış: 9 Ocak 2026, 14:00 (TSİ)
                </div>

            </div>
        </div>
    );
}
