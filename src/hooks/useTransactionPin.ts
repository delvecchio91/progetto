import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useTransactionPin = () => {
  const { user } = useAuth();
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkHasPin = useCallback(async () => {
    if (!user) {
      setHasPin(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('has_transaction_pin', {
        p_user_id: user.id
      });

      if (error) throw error;
      setHasPin(data);
    } catch (error) {
      console.error("Error checking PIN:", error);
      setHasPin(false);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkHasPin();
  }, [checkHasPin]);

  const verifyPin = async (pin: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase.rpc('verify_transaction_pin', {
        p_user_id: user.id,
        p_pin: pin
      });

      if (error) throw error;
      return data === true;
    } catch (error) {
      console.error("Error verifying PIN:", error);
      return false;
    }
  };

  const refreshPinStatus = () => {
    checkHasPin();
  };

  return {
    hasPin,
    isLoading,
    verifyPin,
    refreshPinStatus,
  };
};
