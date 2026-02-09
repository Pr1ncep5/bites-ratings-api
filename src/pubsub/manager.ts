import type { WSContext } from "hono/ws";

const subscriptions = new Map<string, Set<WSContext>>();

const clientSubscriptions = new Map<WSContext, Set<string>>();

export function subscribeClient(ws: WSContext, restaurantId: string) {
  if (!subscriptions.has(restaurantId)) {
    subscriptions.set(restaurantId, new Set());
  }

  subscriptions.get(restaurantId)!.add(ws);

  if (!clientSubscriptions.has(ws)) {
    clientSubscriptions.set(ws, new Set());
  }

  clientSubscriptions.get(ws)!.add(restaurantId);
}

export function unsubscribeClient(ws: WSContext, restaurantId: string) {
  subscriptions.get(restaurantId)?.delete(ws);
  if (subscriptions.get(restaurantId)?.size === 0) {
    subscriptions.delete(restaurantId);
  }

  clientSubscriptions.get(ws)?.delete(restaurantId);
  if (clientSubscriptions.get(ws)?.size === 0) {
    clientSubscriptions.delete(ws);
  }
}

export function removeClient(ws: WSContext) {
  const restaurantIds = clientSubscriptions.get(ws);

  if (restaurantIds) {
    for (const restaurantId of restaurantIds) {
      subscriptions.get(restaurantId)?.delete(ws);
      if (subscriptions.get(restaurantId)?.size === 0) {
        subscriptions.delete(restaurantId);
      }
    }
  }
  clientSubscriptions.delete(ws);
}

export function broadcast(restaurantId: string, message: string) {
  const clients = subscriptions.get(restaurantId);
  if (!clients) return;

  for (const ws of clients) {
    try {
      ws.send(message);
    } catch {
      removeClient(ws);
    }
  }
}
