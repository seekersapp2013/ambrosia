
import { ConvexHttpClient } from "convex/browser";
import { api } from "./convex/_generated/api.js";

const convex = new ConvexHttpClient(process.env.VITE_CONVEX_URL);

async function runTest() {
  // This is a placeholder for authentication.
  // In a real scenario, you would need to get a valid token.
  // For this test, we'll assume the user is authenticated.
  // You can get a token by signing in through the web interface and
  // inspecting the `token` in the browser's local storage.
  const token = process.env.CONVEX_TOKEN;
  if (!token) {
    console.error("CONVEX_TOKEN environment variable not set.");
    return;
  }
  convex.setAuth(token);

  try {
    const result = await convex.mutation(api.notifications.createTestNotification);
    console.log("Test notification created successfully:", result);
  } catch (error) {
    console.error("Error creating test notification:", error);
  }
}

runTest();
