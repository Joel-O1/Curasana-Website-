import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { markUserOnboarded } from "../lib/curasana-api";

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile(id, email) {
    // ilike: seeded rows may store mixed-case emails while Supabase Auth lowercases them
    const { data, error } = await supabase
      .from("users")
      .select("id, email, role, created_at, onboarded") // Ensure you're selecting these
      .eq("id", id) // Fixed: Usually you fetch by Auth ID if available
      .maybeSingle();
      
    if (error) { 
      console.warn("profile fetch:", error.message); 
      return null; 
    }
    return data;
  }

  // Ensures user row exists without crashing due to RLS policies
  async function ensureUserProfile(au) {
    const { data, error } = await supabase
      .from("users")
      .insert({
        id: au.id, // Ensure you pass the auth ID here
        email: au.email,
        role: "patient",
      })
      .select("id, email, role, created_at, onboarded")
      .single();
      
    if (error) {
      if (error.code === "23505" || error.code === "42501") {
        return fetchProfile(au.id, au.email);
      }
      console.warn("public.users insert:", error.message);
      return null;
    }
    return data;
  }

  async function ensurePatientProfile(userId, au) {
    if (!userId) return null;
    const meta = au?.user_metadata || {};
    const firstName = meta.first_name || meta.given_name || null;
    const lastName  = meta.last_name || meta.family_name || null;

    const { data } = await supabase
      .from("patient_profiles")
      .select("id, first_name, last_name")
      .eq("user_id", userId)
      .maybeSingle();

    if (data) {
      // Backfill names on profiles created before names were collected
      if (!data.first_name && (firstName || lastName)) {
        await supabase
          .from("patient_profiles")
          .update({ first_name: firstName, last_name: lastName })
          .eq("id", data.id);
      }
      return data.id;
    }

    // Safe trigger backup insertion
    const { data: created, error } = await supabase
      .from("patient_profiles")
      .insert({ user_id: userId, first_name: firstName, last_name: lastName })
      .select("id")
      .single();

    if (error) {
      // If it already exists (e.g., from a concurrent trigger execution), fetch it
      const { data: retry } = await supabase
        .from("patient_profiles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();
      if (retry) return retry.id;

      console.warn("patient profile error:", error.message); 
      return null; 
    }
    return created.id;
  }

  async function buildUser(au) {
    if (!au) return null;
    
    let p = await fetchProfile(au.id, au.email);
    if (!p) p = await ensureUserProfile(au);
    
    const patientId = p ? await ensurePatientProfile(p.id, au) : null;
    
    return {
      authId:    au.id,
      email:     au.email,
      // removed p?.username
      name:      au.user_metadata?.full_name || au.user_metadata?.name || au.email,
      role:      p?.role || "patient",
      dbId:      p?.id || null,
      patientId,
      onboarded: !!p?.onboarded,
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

  async function signUp(email, password, firstName, lastName) {
    // const username = `${firstName} ${lastName}`.trim();
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { first_name: firstName, last_name: lastName } },
    });
    if (error) return { data, error };

    if (data?.user) {
      await supabase.from("users").insert({email,
        role: "patient",
      }).then(({ error: e }) => {
        if (e) console.warn("public.users insert:", e.message);
      });
      setUser(await buildUser(data.user));
    }
    return { data, error };
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    return { error };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null); setSession(null);
  }

  // Updates the login password in Supabase Auth (auth.users), not patient_profiles.
  async function changePassword(email, currentPassword, newPassword) {
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });
    if (verifyError) {
      return { error: { message: "Current password is incorrect." } };
    }

    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { error };

    if (data?.user) setUser(await buildUser(data.user));
    return { data, error: null };
  }

  async function requestPasswordReset(email) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { data, error };
  }

  // ── NEW: mark user as onboarded ──
  async function markOnboarded() {
    if (!user?.dbId) return;
    await markUserOnboarded(user.dbId);
    setUser((prev) => (prev ? { ...prev, onboarded: true } : prev));
  }

  return (
    <Ctx.Provider value={{ user, session, loading, signIn, signUp, signInWithGoogle, signOut, changePassword, requestPasswordReset, markOnboarded }}>
      {children}
    </Ctx.Provider>
  );
}


export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be inside <AuthProvider>");
  return c;
}