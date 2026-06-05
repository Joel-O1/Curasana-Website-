import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile(email) {
    const { data, error } = await supabase
      .from("users")
      .select("id, username, email, role, created_at")
      .eq("email", email)
      .single();
    if (error) { console.warn("profile fetch:", error.message); return null; }
    return data;
  }

  async function buildUser(au) {
    if (!au) return null;
    const p = await fetchProfile(au.email);
    return {
      authId: au.id,
      email:  au.email,
      name:   p?.username || au.user_metadata?.username || au.email,
      role:   p?.role || "patient",
      dbId:   p?.id || null,
      onboarded: !!p,
    };
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ? await buildUser(s.user) : null);
      setLoading(false);
    });

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange(async (_ev, s) => {
        setSession(s);
        setUser(s?.user ? await buildUser(s.user) : null);
        setLoading(false);
      });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data?.user) setUser(await buildUser(data.user));
    return { data, error };
  }

  async function signUp(email, password, username) {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { username } },
    });
    if (error) return { data, error };

    if (data?.user) {
      await supabase.from("users").insert({
        username, email,
        password_hash: "supabase_auth",
        role: "patient",
      }).then(({ error: e }) => {
        if (e) console.warn("public.users insert:", e.message);
      });
      setUser(await buildUser(data.user));
    }
    return { data, error };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null); setSession(null);
  }

  return (
    <Ctx.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be inside <AuthProvider>");
  return c;
}
