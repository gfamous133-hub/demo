
import { Router } from "express";

import platformAPIClient from "../services/platformAPIClient";

import env from "../environments";

export default function mountUserEndpoints(router: Router) {

  router.post("/signin", async (req, res) => {

    const auth = req.body?.authResult;

    const userCollection = req.app.locals.userCollection;

    if (!auth?.accessToken || !auth?.user?.uid) {
      return res.status(400).json({
        error: "invalid_auth",
        message: "Missing Pi sign-in details",
      });
    }

    if (!userCollection) {
      return res.status(503).json({
        error: "service_unavailable",
        message: "Database not ready",
      });
    }

    let verifiedUser: any;

    try {
      const response = await platformAPIClient.get("/v2/me", {
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
        },
      });

      verifiedUser = response.data;
    } catch (err) {
      console.error("Error verifying Pi access token:", err);
      return res.status(401).json({
        error: "invalid_token",
        message: "Invalid access token",
      });
    }

    if (
      !verifiedUser?.uid ||
      verifiedUser.uid !== auth.user.uid ||
      !verifiedUser?.username
    ) {
      return res.status(401).json({
        error: "identity_mismatch",
        message: "Pi account verification failed",
      });
    }

    const isAdmin =
      Boolean(env.admin_pi_username) &&
      verifiedUser.username.toLowerCase() ===
        env.admin_pi_username.toLowerCase();

    const roles = isAdmin ? ["admin"] : [];

    try {
      let currentUser = await userCollection.findOne({
        uid: verifiedUser.uid,
      });

      if (currentUser) {
        await userCollection.updateOne(
          { _id: currentUser._id },
          {
            $set: {
              username: verifiedUser.username,
              accessToken: auth.accessToken,
              roles,
            },
          },
        );

        currentUser = await userCollection.findOne({
          _id: currentUser._id,
        });
      } else {
        const result = await userCollection.insertOne({
          username: verifiedUser.username,
          uid: verifiedUser.uid,
          roles,
          accessToken: auth.accessToken,
        });

        currentUser = await userCollection.findOne({
          _id: result.insertedId,
        });
      }

      req.session.currentUser = currentUser;

      return res.status(200).json({
        message: "User signed in",
      });
    } catch (err) {
      console.error("Error during sign-in:", err);
      return res.status(500).json({
        error: "internal_error",
        message: "Failed to sign in",
      });
    }
  });

  router.get("/signout", async (req, res) => {
    req.session.currentUser = null;

    return res.status(200).json({
      message: "User signed out",
    });
  });

}
