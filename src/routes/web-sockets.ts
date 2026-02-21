import { Hono } from "hono";
import { upgradeWebSocket } from "hono/bun";
import {
  subscribeClient,
  unsubscribeClient,
  removeClient,
} from "../pubsub/manager";
import {
  registerAuthenticatedClient,
  removeAuthenticatedClient,
  getUserIdForConnection,
} from "../pubsub/user-manager";
import { auth, type AuthType } from "../lib/auth";

const router = new Hono<{ Variables: AuthType }>();

router.get(
  "/",
  upgradeWebSocket(() => ({
    onOpen(_event, ws) {
      console.log("WebSocket client connected");
      ws.send(
        JSON.stringify({
          type: "CONNECTED",
          message: "Welcome to real-time updates. Send {\"action\":\"authenticate\",\"token\":\"...\"} to receive personal notifications.",
        }),
      );
    },

    async onMessage(event, ws) {
      try {
        const data = JSON.parse(event.data as string);

        if (data.action === "authenticate" && data.token) {
          try {
            const headers = new Headers();
            headers.set("authorization", `Bearer ${data.token}`);

            const session = await auth.api.getSession({ headers });

            if (session?.user) {
              await registerAuthenticatedClient(ws, session.user.id);
              ws.send(
                JSON.stringify({
                  type: "AUTHENTICATED",
                  userId: session.user.id,
                  message: "You will now receive real-time notifications",
                }),
              );
            } else {
              ws.send(
                JSON.stringify({
                  type: "AUTH_ERROR",
                  message: "Invalid or expired token",
                }),
              );
            }
          } catch (error) {
            console.error("WebSocket auth error:", error);
            ws.send(
              JSON.stringify({
                type: "AUTH_ERROR",
                message: "Authentication failed",
              }),
            );
          }
        }

        else if (data.action === "subscribe" && data.restaurantId) {
          subscribeClient(ws, data.restaurantId);
          ws.send(
            JSON.stringify({
              type: "SUBSCRIBED",
              restaurantId: data.restaurantId,
            }),
          );
        } else if (data.action === "unsubscribe" && data.restaurantId) {
          unsubscribeClient(ws, data.restaurantId);
          ws.send(
            JSON.stringify({
              type: "UNSUBSCRIBED",
              restaurantId: data.restaurantId,
            }),
          );
        } else {
          ws.send(
            JSON.stringify({
              type: "ERROR",
              message:
                'Unknown action. Available: {"action":"authenticate","token":"..."}, {"action":"subscribe","restaurantId":"..."}, {"action":"unsubscribe","restaurantId":"..."}',
            }),
          );
        }
      } catch {
        ws.send(
          JSON.stringify({ type: "ERROR", message: "Invalid JSON message" }),
        );
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
  })),
);

export default router;
