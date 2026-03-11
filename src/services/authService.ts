const API_BASE_URL = "https://django-restframework-products-backend.onrender.com/api/auth";

export interface RegisterPayload {
    username: string;
    email: string;
    password: string;
    user_type: string;
}

export interface LoginPayload {
    username: string;
    password: string;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    token?: string;
    user?: {
        username: string;
        email: string;
        user_type: string;
    };
}

export const authService = {
    async register(payload: RegisterPayload): Promise<AuthResponse> {
        try {
            const response = await fetch(`${API_BASE_URL}/register/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            return {
                message: 'user registered successfully',
                success: true,
                user: data.user,
                token: data.token,
            };
        } catch (error) {
            return {
                success: false,
                message: "Error registering user",
            };
        }
    },

    async login(payload: LoginPayload): Promise<AuthResponse> {
        try {
            const response = await fetch(`${API_BASE_URL}/login/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            if (!data.token) {
                return {
                    success: false,
                    message: "Invalid credentials",
                };
            }
            localStorage.setItem("authToken", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            return {
                success: true,
                message: "Login successful",
                user: data.user,
                token: data.token,
            }
        } catch (error) {
            return {
                success: false,
                message: "Error logging in",
            };
        }
    },

    logout() {
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
    },

    getToken(): string | null {
        if (typeof window !== "undefined") {
            return localStorage.getItem("authToken");
        }
        return null;
    },

    getUser() {
        if (typeof window !== "undefined") {
            const user = localStorage.getItem("user");
            return user ? JSON.parse(user) : null;
        }
        return null;
    },

    isAuthenticated(): boolean {
        if (typeof window !== "undefined") {
            return !!localStorage.getItem("authToken");
        }
        return false;
    },
};
