
import { useCallback, useState } from "react";
import { axiosClient } from "../lib/axiosClient";
import type { AuthResult, PaymentDTO, User } from "../types/pi";

type SignInResponse = {
  message: string;
  user: User;
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [showSignIn, setShowSignIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const onIncompletePaymentFound = useCallback(
    async (payment: PaymentDTO) => {
      try {
        await axiosClient.post("/payments/incomplete", { payment });
      } catch (err) {
        console.error("Error handling incomplete payment:", err);
      }
    },
    []
  );

  const signInUser = useCallback(async (authResult: AuthResult) => {
    try {
      const response = await axiosClient.post<SignInResponse>(
        "/user/signin",
        { authResult }
      );

      const verifiedUser = response.data?.user;

      if (
        !verifiedUser?.uid ||
        !verifiedUser?.username ||
        !Array.isArray(verifiedUser.roles)
      ) {
        throw new Error("Invalid verified user response");
      }

      setUser(verifiedUser);
      setShowSignIn(false);
    } catch (err) {
      console.error("Error signing in:", err);
      setUser(null);
    }
  }, []);

  const signIn = useCallback(async () => {
    setIsLoading(true);

    try {
      const scopes = [
        "username",
        "payments",
        "roles",
        "in_app_notifications",
      ];

      const authResult = await window.Pi.authenticate(
        scopes,
        onIncompletePaymentFound
      );

      await signInUser(authResult);
    } catch (err) {
      console.error("Error authenticating:", err);
    } finally {
      setIsLoading(false);
    }
  }, [onIncompletePaymentFound, signInUser]);

  const signOut = useCallback(async () => {
    setIsLoading(true);

    try {
      await axiosClient.get("/user/signout");
      setUser(null);
    } catch (err) {
      console.error("Error signing out:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const closeSignIn = useCallback(() => {
    setShowSignIn(false);
  }, []);

  return {
    user,
    isAuthenticated: Boolean(user),
    showSignIn,
    signIn,
    signOut,
    closeSignIn,
    requireAuth: () => setShowSignIn(true),
    isLoading,
  };
};
