import crypto from "crypto";
import { BrowserWindow } from "@electron/remote";

const authBase = "https://quaily.com";
const apiBase = "https://api.quail.ink";
const clientID = "866c9dba-e267-47b8-ad48-2ca9105dd3cd";
const redirectURI = "http://localhost:63812/oauth/code";
const scopes = ["user.full", "post.write"];

function generateCodeVerifier() {
  // Create 32 random bytes
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);

  // Base64-url encode (raw)
  // 1. Convert bytes to a normal Base64
  // 2. Replace unsafe URL chars (+, /, =) so we get a 'raw url encoding'
  let base64String = btoa(String.fromCharCode(...randomBytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  return base64String;
}

function getCodeFromUrl(url) {
  const redirectUrl = new URL(url);
  // If it's your expected callback route:
  // We got the callback, so we can parse params, e.g. ?code=XYZ
  const code = redirectUrl.searchParams.get('code');
  const returnedState = redirectUrl.searchParams.get("state") || "";
  if (code || returnedState) {
    // Exchange your code for a token, or do other flow tasks
    return { code, returnedState };
  }
  return { code: "", returnedState: "" };
}


async function startLoginElectron() {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = codeVerifier; // for plain
  const state = crypto.randomUUID();

  // Construct the authorization URL
  const authURL = new URL("/oauth/authorize", authBase);
  authURL.searchParams.set("response_type", "code");
  authURL.searchParams.set("client_id", clientID);
  authURL.searchParams.set("redirect_uri", redirectURI);
  authURL.searchParams.set("scope", scopes.join(" "));
  authURL.searchParams.set("state", state);
  authURL.searchParams.set("code_challenge", codeChallenge);
  authURL.searchParams.set("code_challenge_method", "plain");

  // Open a window to show the provider’s login/consent page
  const loginWindow = new BrowserWindow({
    width: 600,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Listen for the callback URL via webRequest
  const { session: { webRequest } } = loginWindow.webContents;

  const filter = {
    urls: [
      "http://localhost:63812/oauth/code*"
    ]
  };

  return new Promise((resolve, reject) => {
    const handleCallback = async (event, url) => {
      const { code, returnedState } = getCodeFromUrl(event, url, loginWindow);
      if (returnedState !== state) {
        throw new Error("State mismatch. Potential CSRF attack or lost session.");
      }
      if (!code) {
        throw new Error("No authorization code found in callback.");
      }
      // We can close the login window now
      loginWindow.close();

      // Exchange the code for a token
      const token = await exchangeCodeForToken(
        code,
        codeVerifier,
        redirectURI,
        clientID
      );
      return token;
    }
    // Listen for a navigation or redirect
    loginWindow.webContents.on('will-navigate', (event, url) => {
      event.preventDefault();
      try {
        const token = handleCallback(url);
        resolve(token);
      } catch (err) {
        loginWindow.close();
        reject(err);
      }
    });

    // Also handle redirect
    loginWindow.webContents.on('did-redirect-navigation', (event, url, isInPlace, isMainFrame) => {
      event.preventDefault();
      try {
        const token = handleCallback(url);
        resolve(token);
      } catch (err) {
        loginWindow.close();
        reject(err);
      }
    });

    // Intercept the callback request
    webRequest.onBeforeRequest(filter, async ({ url }) => {
      try {
        const token = handleCallback(url);
        resolve(token);
      } catch (err) {
        loginWindow.close();
        reject(err);
      }
    });

    // Load the authorization URL
    loginWindow.loadURL(authURL.toString());

    loginWindow.on("closed", () => {
    });
  });
}

/**
 * Exchange an authorization code + code_verifier for an access token.
 *
 * @param {string} code
 * @param {string} verifier
 * @param {string} redirectURI
 */
async function exchangeCodeForToken(code, verifier, redirectURI) {
  // token endpoint
  const tokenURL = new URL("/oauth/token", apiBase);

  // Build form data
  const bodyData = new URLSearchParams();
  bodyData.set("grant_type", "authorization_code");
  bodyData.set("code", code);
  bodyData.set("redirect_uri", redirectURI);
  bodyData.set("client_id", clientID);
  bodyData.set("code_verifier", verifier);

  const response = await fetch(tokenURL.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: bodyData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token endpoint error: ${response.status} ${errorText}`);
  }

  // Return JSON: { access_token, refresh_token, expires_in, ... }
  return await response.json();
}

async function refreshToken(refreshToken) {
  const tokenURL = new URL("/oauth/token", apiBase);

  const data = new URLSearchParams();
  data.set("grant_type", "refresh_token");
  data.set("refresh_token", refreshToken);
  data.set("client_id", clientID);

  const resp = await fetch(tokenURL.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: data,
  });

  if (!resp.ok) {
    const errorText = await resp.text();
    throw new Error(`Refresh token error: ${resp.status} ${errorText}`);
  }

  return await resp.json();
}

export {
  startLoginElectron,
  exchangeCodeForToken,
  refreshToken
}