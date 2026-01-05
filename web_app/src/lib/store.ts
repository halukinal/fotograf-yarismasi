
import { create } from 'zustand';
import { User } from 'firebase/auth';

interface AppState {
    user: User | null;
    setUser: (user: User | null) => void;
    isLoading: boolean;
    setIsLoading: (isLoading: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
    user: null,
    setUser: (user) => set({ user }),
    isLoading: true,
    setIsLoading: (isLoading) => set({ isLoading }),
}));
