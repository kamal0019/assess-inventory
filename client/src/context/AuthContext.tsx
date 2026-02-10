"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface User {
    _id: string;
    name: string;
    email: string;
    token: string;
    department?: string;
    designation?: string;
    role?: string;
    is2FAEnabled?: boolean;
}

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string, token?: string) => Promise<any>;
    logout: () => void;
    isLoading: boolean;
    error: string | null;
    enable2FA: () => Promise<any>;
    verify2FA: (otp: string) => Promise<any>;
    disable2FA: () => Promise<any>;
    updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    // Check if user is logged in
    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }, []);

    const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    const updateUser = (userData: Partial<User>) => {
        setUser(prev => {
            if (!prev) return null;
            const updated = { ...prev, ...userData };
            localStorage.setItem("user", JSON.stringify(updated));
            return updated;
        });
    };

    // Login function
    const login = async (email: string, password: string, token?: string) => {
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch(`${BASE_URL}/api/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password, token }),
            });

            const data = await res.json();

            if (!res.ok) {
                if (res.status === 401 && data.message === 'Invalid 2FA token') {
                    throw new Error('Invalid 2FA token');
                }
                throw new Error(data.error || data.message || "Login failed");
            }

            // Check if 2FA is required
            if (data.requires2FA) {
                return data; // Return data to let component handle UI
            }

            // Save user to state and local storage
            setUser(data);
            localStorage.setItem("user", JSON.stringify(data));

            // Redirect to dashboard
            router.push("/");
            return data;
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const enable2FA = async () => {
        const token = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")!).token : '';
        const res = await fetch(`${BASE_URL}/api/auth/2fa/generate`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` }
        });
        return res.json();
    };

    const verify2FA = async (otp: string) => {
        const token = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")!).token : '';
        const res = await fetch(`${BASE_URL}/api/auth/2fa/verify`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ token: otp })
        });
        return res.json();
    };

    const disable2FA = async () => {
        const token = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")!).token : '';
        const res = await fetch(`${BASE_URL}/api/auth/2fa/disable`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` }
        });
        return res.json();
    };

    // Logout function
    const logout = () => {
        setUser(null);
        localStorage.removeItem("user");
        document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";
        // Navigation handled by component
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading, error, enable2FA, verify2FA, disable2FA, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
