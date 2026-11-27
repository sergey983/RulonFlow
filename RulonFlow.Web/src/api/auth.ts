import { api } from "./client";

export interface LoginRequest {
    login: string;
    password: string;
}

export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    expiresAt: string;
    user: {
        uuid: string;
        login: string;
        fullName: string;
        roles: string[];
        permissions: string[];
    };
}

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_KEY = "user";

export async function login(
    request: LoginRequest
): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>(
        "/auth/login",
        request
    );

    return response.data;
}

export function getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function saveAuth(response: LoginResponse): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, response.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
}

export function clearAuth(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

export function getCurrentUser() {
    const value = localStorage.getItem(USER_KEY);

    return value ? JSON.parse(value) : null;
}