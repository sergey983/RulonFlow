import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import { useAuth } from "../auth/useAuth";
import Button from "../ui/Button";
import Input from "../ui/Input";
import './LoginPage.css';

export default function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { setAuth } = useAuth();

    const [loginValue, setLoginValue] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const from =
        (location.state as { from?: { pathname: string } } | null)?.from
            ?.pathname ?? "/";

    async function submit(event: React.FormEvent) {
        event.preventDefault();

        setLoading(true);
        setError(null);

        try {
            const response = await login({
                login: loginValue,
                password,
            });

            setAuth(
                response.user,
                response.accessToken,
                response.refreshToken
            );

            navigate(from, { replace: true });
        } catch (e) {
            setError(
                e instanceof Error
                    ? e.message
                    : "Не удалось войти"
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-panel">
                <div className="auth-panel__header">
                    <svg className="auth-panel__logo" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <h1 className="auth-panel__title">RulonFlow</h1>
                    <p className="auth-panel__subtitle">Система управления складом</p>
                </div>

                <form onSubmit={submit} className="auth-form">
                    {error && (
                        <div className="alert alert--danger">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="15" y1="9" x2="9" y2="15" />
                                <line x1="9" y1="9" x2="15" y2="15" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    <Input
                        label="Логин"
                        type="text"
                        value={loginValue}
                        onChange={e => setLoginValue(e.target.value)}
                        placeholder="Введите логин"
                        required
                        autoComplete="username"
                    />

                    <Input
                        label="Пароль"
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Введите пароль"
                        required
                        autoComplete="current-password"
                    />

                    <Button
                        type="submit"
                        variant="primary"
                        size="lg"
                        isLoading={loading}
                        style={{ width: "100%" }}
                    >
                        {loading ? "Вход…" : "Войти в систему"}
                    </Button>
                </form>

                <div className="auth-panel__footer">
                    © 2026 RulonFlow. Система управления складом
                </div>
            </div>
        </div>
    );
}
