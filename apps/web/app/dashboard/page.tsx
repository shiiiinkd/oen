"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import LogoutButton from "../me/LogoutButton";

export default function DashboardPage() {
  const [data, setData] = useState<{ id: string; name: string } | null>(null);
  const router = useRouter();
  useEffect(() => {
    (async () => {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.ok) {
        setData(data);
      }
      if (res.status === 401) router.push("/login"); //401は未ログイン,.pushから.replaceに変更するかも
    })();
  }, [router]);

  return (
    <>
      <h1>DashboardPage</h1>
      {data ? <p>oen_session: {data.id}</p> : <p>oen_session is not set</p>}
      {data ? <p>name: {data.name}</p> : <p>name is not set</p>}
      <LogoutButton />
    </>
  );
}
