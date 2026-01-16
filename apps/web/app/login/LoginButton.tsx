"use client";

import { useRouter } from "next/navigation";

export default function LoginButton() {
  const router = useRouter();
  const handleLogin = async () => {
    const res = await fetch("/api/login/mock", { method: "POST" });
    if (res.ok) {
      router.push("/me");
    } else {
      console.log("ステータスエラー: " + res.status);
    }
  };
  return <button onClick={handleLogin}>LoginButtonコンポーネント</button>;
}
