import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user chose "remember me" - if not, sign out on new browser session
    const checkSessionPreference = async () => {
      const rememberMe = localStorage.getItem("rememberMe");
      const sessionOnly = sessionStorage.getItem("sessionOnly");
      
      // If sessionOnly flag exists, user is in the same session - keep logged in
      // If rememberMe is not set and no sessionOnly flag, this is a new session - sign out
      if (!rememberMe && !sessionOnly) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          // User had a session but didn't choose "remember me" and this is a new browser session
          await supabase.auth.signOut();
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check session preference first, then get current session
    checkSessionPreference().then(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      localStorage.removeItem("rememberMe");
      sessionStorage.removeItem("sessionOnly");
      
      // Check if there's an active session before trying to sign out
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (currentSession) {
        await supabase.auth.signOut();
      }
      
      // Clear local state regardless
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error("Error during sign out:", error);
      // Still clear local state even if API call fails
      setUser(null);
      setSession(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
