import { Hono } from "hono";
import { upgradeWebSocket } from "hono/bun";
import {
  subscribeClient,
  unsubscribeClient,
  removeClient,
} from "../pubsub/manager";
import type { AuthType } from "../lib/auth";

const router = new Hono<{ Variables: AuthType }>();

router.get(
  "/",
  upgradeWebSocket(() => ({
    onOpen(_event, ws) {
      console.log("WebSocket client connected");
      ws.send(JSON.stringify({ type: "CONNECTED", message: "Welcome to real-time updates" }));
    },

    onMessage(event, ws) {
      try {
        const data = JSON.parse(event.data as string);

        if (data.action === "subscribe" && data.restaurantId) {
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
                'Unknown action. Use {"action":"subscribe","restaurantId":"..."} or {"action":"unsubscribe","restaurantId":"..."}',
            }),
          );
        }
      } catch {
        ws.send(
          JSON.stringify({ type: "ERROR", message: "Invalid JSON message" }),
        );
      }
    },

    onClose(_event, ws) {
      console.log("WebSocket client disconnected");
      removeClient(ws);
    },
  })),
);

export default router;
