import {
    createContext,
    useCallback,
    useMemo,
    useState,
    type ReactNode,
} from "react";

type User = {
    uuid: string;
    login: string;
    fullName: string;
    role: string;
};

type AuthContextValue = {
    user: User | null;
    accessToken: string | null;
    isAuthenticated: boolean;
    setAuth: (
        user: User,
        accessToken: string,
        refreshToken: string
    ) => void;
    clearAuth: () => void;
};

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_KEY = "user";

export const AuthContext = createContext<AuthContextValue | null>(null);

function readUser(): User | null {
    const storedUser = localStorage.getItem(USER_KEY);
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);

    if (!storedUser || !accessToken) {
        return null;
    }

    return JSON.parse(storedUser) as User;
}

function AuthProviderInner({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(readUser);
    const [accessToken, setAccessToken] = useState<string | null>(() => {
        return localStorage.getItem(ACCESS_TOKEN_KEY);
    });

    const setAuth = useCallback(
        (
            nextUser: User,
            nextAccessToken: string,
            nextRefreshToken: string
        ) => {
            localStorage.setItem(ACCESS_TOKEN_KEY, nextAccessToken);
            localStorage.setItem(REFRESH_TOKEN_KEY, nextRefreshToken);
            localStorage.setItem(USER_KEY, JSON.stringify(nextUser));

            setUser(nextUser);
            setAccessToken(nextAccessToken);
        },
        []
    );

    const clearAuth = useCallback(() => {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        localStorage.removeItem(USER_KEY);

        setUser(null);
        setAccessToken(null);
    }, []);

    const value = useMemo(
        () => ({
            user,
            accessToken,
            isAuthenticated: Boolean(user && accessToken),
            setAuth,
            clearAuth,
        }),
        [user, accessToken, setAuth, clearAuth]
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function AuthProvider({ children }: { children: ReactNode }) {
    return <AuthProviderInner>{children}</AuthProviderInner>;
}