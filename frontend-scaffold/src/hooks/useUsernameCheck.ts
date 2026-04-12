import { useState, useEffect } from 'react';
import { useContract } from './useContract';
import { validateUsername } from "@/utils/validation";
import {
  formatUserFacingContractError,
  isLikelyNetworkError,
  isLikelyProfileMissingSimulationError,
} from "@/utils/error";

export interface UseUsernameCheckResult {
  available: boolean | null;
  checking: boolean;
  error: string | null;
}

export const useUsernameCheck = (username: string): UseUsernameCheckResult => {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debouncedUsername, setDebouncedUsername] = useState('');
  const { getProfileByUsername } = useContract();

  // Debounce username input (500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUsername(username.trim());
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  // Reset state when username changes
  useEffect(() => {
    setAvailable(null);
    setError(null);
  }, [username]);

  // Check username availability
  useEffect(() => {
    if (!debouncedUsername) {
      setAvailable(null);
      setChecking(false);
      setError(null);
      return;
    }

    // First run local validation
    const validation = validateUsername(debouncedUsername);
    if (!validation.valid) {
      setAvailable(null);
      setChecking(false);
      setError(null);
      return;
    }

    const checkAvailability = async () => {
      setChecking(true);
      setError(null);
      
      try {
        await getProfileByUsername(debouncedUsername);
        // Profile found - username is taken
        setAvailable(false);
      } catch (err) {
        const errorMessage =
          err && typeof err === "object" && "message" in err
            ? String((err as Error).message)
            : String(err);

        if (isLikelyNetworkError(err)) {
          setError(
            "Unable to reach the network. Check your connection and try again."
          );
          setAvailable(null);
        } else if (
          isLikelyProfileMissingSimulationError(errorMessage) ||
          errorMessage.includes("No profile found") ||
          errorMessage.includes("No data")
        ) {
          // Simulation failed because no profile exists for this username
          setAvailable(true);
        } else {
          setError(formatUserFacingContractError(err));
          setAvailable(null);
        }
      } finally {
        setChecking(false);
      }
    };

    checkAvailability();
  }, [debouncedUsername, getProfileByUsername]);

  return {
    available,
    checking,
    error,
  };
};
