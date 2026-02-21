import { Hono } from "hono";
import { upgradeWebSocket } from "hono/bun";
import { subscribeClient, unsubscribeClient, removeClient } from "../pubsub/manager";
import { registerAuthenticatedClient, removeAuthenticatedClient, getUserIdForConnection } from "../pubsub/user-manager";
import { auth, type AuthType } from "../lib/auth";

const router = new Hono<{ Variables: AuthType }>();

router.get(
  "/",
  async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });

    if (!session?.user) {
      return c.text("Unauthorized", 401);
    }

    c.set("user", session.user);
    return next();
  },
  upgradeWebSocket((c) => {
    const user = c.get("user")!;

    return {
      async onOpen(_event, ws) {
        console.log(`WebSocket client connected for user: ${user.id}`);

        await registerAuthenticatedClient(ws, user.id);

        ws.send(
          JSON.stringify({
            type: "AUTHENTICATED",
            userId: user.id,
            message: "Welcome! You are securely connected for real-time notifications.",
          }),
        );
      },

      async onMessage(event, ws) {
        try {
          const data = JSON.parse(event.data as string);

          if (data.action === "subscribe" && data.restaurantId) {
            subscribeClient(ws, data.restaurantId);
            ws.send(JSON.stringify({ type: "SUBSCRIBED", restaurantId: data.restaurantId }));
          } else if (data.action === "unsubscribe" && data.restaurantId) {
            unsubscribeClient(ws, data.restaurantId);
            ws.send(JSON.stringify({ type: "UNSUBSCRIBED", restaurantId: data.restaurantId }));
          } else {
            ws.send(JSON.stringify({ type: "ERROR", message: "This was an unknown action." }));
          }
        } catch {
          ws.send(JSON.stringify({ type: "ERROR", message: "This was an invalid JSON message." }));
        }
      },

      async onClose(_event, ws) {
        console.log("WebSocket client disconnected");
        removeClient(ws);
        const userId = getUserIdForConnection(ws);
        if (userId) {
          await removeAuthenticatedClient(ws);
        }
      },
    };
  })
);

export default router;
