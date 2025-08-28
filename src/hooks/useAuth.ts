import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// [CORRECTED]: Use the full Supabase URL for the Edge Function call.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const updateUserRole = async (userId: string, role: string) => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/update-user-role`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Include the Authorization header with the service_role key.
      // This is necessary to access the function from the frontend.
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ userId, role }),
  });
  
  if (!response.ok) {
    let errorText = await response.text();
    try {
      const errorData = JSON.parse(errorText);
      errorText = errorData.error;
    } catch (e) {
      // If the response is not valid JSON, we'll use the plain text.
    }
    throw new Error(errorText || 'Failed to update user role on the server.');
  }
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string, phone?: string) => {
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          }
        }
      });

      if (signUpError) throw signUpError;
      
      toast({
        title: "Account created!",
        description: "You have been signed in successfully.",
      });

      return { error: null };
    } catch (error) {
      const errorMessage = (error instanceof Error) ? error.message : "An unknown error occurred";
      toast({
        title: "Sign up failed",
        description: errorMessage,
        variant: "destructive",
      });
      return { error };
    }
  };

  const signUpAsAdmin = async (email: string, password: string, firstName?: string, lastName?: string) => {
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          }
        }
      });

      if (signUpError) {
        throw signUpError;
      }
      
      if (data.user) {
        await updateUserRole(data.user.id, 'admin');
      }

      toast({
        title: "Admin account created!",
        description: "You have been signed in successfully. The admin role is being assigned. Please sign in again to activate.",
      });

      return { error: null };
    } catch (error) {
      const errorMessage = (error instanceof Error) ? error.message : "An unknown error occurred";
      toast({
        title: "Admin sign up failed",
        description: errorMessage,
        variant: "destructive",
      });
      return { error };
    }
  };

  const signIn = async (email: string, password: string, isAdminLogin: boolean = false) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        const errorMessage = error.message || "An unknown error occurred.";
        toast({
          title: "Sign in failed",
          description: errorMessage,
          variant: "destructive",
        });
        return { error };
      }

      if (isAdminLogin && data.user) {
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (roleError) {
          toast({
            title: "Permission check failed",
            description: roleError.message,
            variant: "destructive",
          });
          return { error: roleError };
        }
        
        if (!roleData) {
          await supabase.auth.signOut();
          toast({
            title: "Access Denied",
            description: "You do not have administrative privileges.",
            variant: "destructive",
          });
          return { error: new Error("You do not have administrative privileges.") };
        }
      }

      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully.",
      });

      return { error: null };
    } catch (error) {
      const errorMessage = (error instanceof Error) ? error.message : "An unknown error occurred";
      toast({
        title: "Sign in failed",
        description: errorMessage,
        variant: "destructive",
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;

      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });

      navigate('/');
    } catch (error) {
      const errorMessage = (error instanceof Error) ? error.message : "An unknown error occurred";
      toast({
        title: "Sign out failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return {
    user,
    session,
    loading,
    signUp,
    signUpAsAdmin,
    signIn,
    signOut,
  };
}
