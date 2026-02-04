"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import LogoutButton from "../me/LogoutButton";
import PostCreateForm from "./PostCreateForm";

export default function DashboardPage() {
  const [data, setData] = useState<{
    id: string;
    lineSub: string;
    displayName?: string;
  } | null>(null);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/auth/me");
      const data = await res.json();

      if (res.status === 401) {
        router.replace("/login");
      } else {
        setData(data);
      }
    })();
  }, [router]);

  return (
    <>
      <h1>DashboardPage</h1>
      {data ? <p>oen_session: {data.id}</p> : <p>oen_session is not set</p>}
      {data ? <p>lineSub: {data.lineSub}</p> : <p>lineSub is not set</p>}
      {data ? (
        <p>displayName: {data.displayName}</p>
      ) : (
        <p>displayName is not set</p>
      )}
      <LogoutButton />
      <PostCreateForm />
    </>
  );
}
