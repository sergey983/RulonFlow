import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import { useAuth } from "../auth/useAuth";

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
        <div
            style={{
                maxWidth: 360,
                margin: "80px auto",
                padding: 24,
                border: "1px solid #e5e7eb",
                borderRadius: 8,
            }}
        >
            <h2>Вход в RulonFlow</h2>

            {error && <p style={{ color: "red" }}>{error}</p>}

            <form onSubmit={submit}>
                <label>
                    Логин
                    <input
                        value={loginValue}
                        onChange={event => setLoginValue(event.target.value)}
                        style={{ width: "100%", marginBottom: 12 }}
                        required
                    />
                </label>

                <label>
                    Пароль
                    <input
                        type="password"
                        value={password}
                        onChange={event => setPassword(event.target.value)}
                        style={{ width: "100%", marginBottom: 16 }}
                        required
                    />
                </label>

                <button type="submit" disabled={loading} style={{ width: "100%" }}>
                    {loading ? "Вход…" : "Войти"}
                </button>
            </form>
        </div>
    );
}