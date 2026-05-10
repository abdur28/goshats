import { useEffect, useState } from "react";
import { listenToAddresses } from "@goshats/firebase";
import type { SavedAddress } from "@goshats/types";
import { useAuthStore } from "@/store/auth-store";

export function useSavedAddresses() {
  const uid = useAuthStore((s) => s.user?.uid);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      setAddresses([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    const unsubscribe = listenToAddresses(
      uid,
      (next) => {
        setAddresses(next);
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [uid]);

  return { addresses, isLoading, error };
}
