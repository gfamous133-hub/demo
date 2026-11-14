
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
        console.error("Incomplete payment error:", err);
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
        throw new Error("Server haijarudisha taarifa sahihi za akaunti.");
      }

      setUser(verifiedUser);
      setShowSignIn(false);
    } catch (err: any) {
      console.error("Server sign-in error:", err);
      setUser(null);

      window.alert(
        err?.response?.data?.message ||
        err?.message ||
        "Server imeshindwa kuthibitisha akaunti ya Pi."
      );
    }
  }, []);

  const signIn = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      const pi = (window as any).Pi;

      if (!pi || typeof pi.authenticate !== "function") {
        throw new Error(
          "Pi SDK haijapatikana. Hakikisha umefungua tovuti ndani ya Pi Browser na ujaribu tena."
        );
      }

      const scopes = [
        "username",
        "payments",
        "roles",
        "in_app_notifications",
      ];

      const authResult = await pi.authenticate(
        scopes,
        onIncompletePaymentFound
      );

      if (!authResult?.accessToken || !authResult?.user?.uid) {
        throw new Error(
          "Pi haikurudisha taarifa kamili za uthibitisho."
        );
      }

      await signInUser(authResult);
    } catch (err: any) {
      console.error("Pi authentication error:", err);

      window.alert(
        err?.message ||
        "Imeshindikana kuanzisha kuingia kwa Pi. Jaribu tena ndani ya Pi Browser."
      );
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, onIncompletePaymentFound, signInUser]);

  const signOut = useCallback(async () => {
    setIsLoading(true);

    try {
      await axiosClient.get("/user/signout");
      setUser(null);
    } catch (err) {
      console.error("Sign out error:", err);
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
