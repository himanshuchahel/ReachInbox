
import { Router } from "express";
import {
  authenticateWithGoogle,
  consumeGoogleOAuthState,
  createGoogleAuthUrl,
} from "../services/auth.service.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { prisma } from "../lib/prisma.js";

const router = Router();

const FRONTEND_URL =
  process.env.FRONTEND_URL || "http://localhost:5173";

// Start Google OAuth
router.get("/google", async (_req, res) => {
  try {
    console.log("[Google OAuth] Initializing login...");

    const authUrl = await createGoogleAuthUrl();

    console.log("[Google OAuth] Authorization URL generated.");

    return res.json({
      success: true,
      authUrl,
    });
  } catch (error) {
    console.error("[Google OAuth] Initialization failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to initialize Google login",
    });
  }
});

// Google OAuth callback
router.get("/google/callback", async (req, res) => {
  try {
    console.log("\n========== GOOGLE OAUTH CALLBACK ==========");

    const { code, state, error } = req.query;

    console.log("[Callback] Google returned callback.");

    if (error) {
      console.error("[Callback] Google authentication denied.");

      return res.redirect(
        `${FRONTEND_URL}/login?error=google_auth_cancelled`
      );
    }

    if (
      typeof code !== "string" ||
      typeof state !== "string"
    ) {
      console.error("[Callback] Missing or invalid parameters.");

      return res.redirect(
        `${FRONTEND_URL}/login?error=invalid_callback`
      );
    }

    console.log("[Callback] OAuth parameters received.");

    // Validate OAuth state
    const validState = await consumeGoogleOAuthState(state);

    console.log("[Callback] State validation:", validState);

    if (!validState) {
      console.error("[Callback] Invalid or expired state.");

      return res.redirect(
        `${FRONTEND_URL}/login?error=invalid_state`
      );
    }

    // Authenticate Google account
    console.log("[Callback] Authenticating Google account...");

    const result = await authenticateWithGoogle(code);

    console.log("[Callback] Google authentication successful.");
    console.log("[Callback] User ID:", result.user.id);
    console.log("[Callback] User email:", result.user.email);
    console.log("[Callback] Token generated:", Boolean(result.token));

    if (!result.token) {
      throw new Error("JWT token was not generated");
    }

    // Redirect to frontend with token in URL fragment
    const redirectUrl = new URL(
      "/auth/callback",
      FRONTEND_URL
    );

    redirectUrl.hash = `token=${encodeURIComponent(result.token)}`;

    console.log(
      "[Callback] Redirect destination:",
      redirectUrl.origin + redirectUrl.pathname
    );

    console.log("[Callback] Token included in URL fragment:", true);
    console.log("========== OAUTH CALLBACK COMPLETE ==========\n");

    return res.redirect(302, redirectUrl.toString());

  } catch (error) {
    console.error("\n[Google OAuth] Callback failed:", error);

    return res.redirect(
      `${FRONTEND_URL}/login?error=google_auth_failed`
    );
  }
});

// Authenticated user profile
router.get("/me", authenticate, async (_req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: res.locals.userId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.json({
      success: true,
      data: user,
    });

  } catch (error) {
    console.error("[Auth] Fetching user failed:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch user profile",
    });
  }
});

export default router;
