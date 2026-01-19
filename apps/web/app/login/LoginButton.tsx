"use client";

export default function LoginButton() {
  const handleLogin = () => {
    window.location.href = "/api/auth/line";
  };
  return <button onClick={handleLogin}>LoginButtonコンポーネント</button>;
}
