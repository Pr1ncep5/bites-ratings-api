import type { WSContext } from "hono/ws";
import type { RedisClientType } from "redis";
import { userNotificationsChannel } from "../utils/keys";

// Map userId -> Set of WebSocket connections (user may have multiple tabs open)
const authenticatedClients = new Map<string, Set<WSContext>>();

// Map WSContext -> userId (for reverse lookup on disconnect)
const clientToUser = new Map<WSContext, string>();

// Set of user channels we're subscribed to
const subscribedChannels = new Set<string>();

// Reference to the subscriber client (set during initialization)
let subscriberClient: RedisClientType | null = null;

/**
 * Initialize the user manager with the subscriber client
 */
export function initializeUserManager(subscriber: RedisClientType) {
  subscriberClient = subscriber;
}

/**
 * Register an authenticated WebSocket connection for a user
 * Subscribes to user's notification channel if not already subscribed
 */
export async function registerAuthenticatedClient(
  ws: WSContext,
  userId: string,
): Promise<void> {
  // Track the WebSocket connection
  if (!authenticatedClients.has(userId)) {
    authenticatedClients.set(userId, new Set());
  }
  authenticatedClients.get(userId)!.add(ws);
  clientToUser.set(ws, userId);

  // Subscribe to user's notification channel if not already subscribed
  const channel = userNotificationsChannel(userId);
  if (!subscribedChannels.has(channel) && subscriberClient) {
    subscribedChannels.add(channel);
    await subscriberClient.subscribe(channel, (message) => {
      broadcastToUser(userId, message);
    });
    console.log(`[UserManager] Subscribed to channel: ${channel}`);
  }

  console.log(
    `[UserManager] User ${userId} registered. Active connections: ${authenticatedClients.get(userId)!.size}`,
  );
}

/**
 * Remove a WebSocket connection
 * Unsubscribes from user's channel if no more connections for that user
 */
export async function removeAuthenticatedClient(ws: WSContext): Promise<void> {
  const userId = clientToUser.get(ws);
  if (!userId) return;

  clientToUser.delete(ws);

  const userConnections = authenticatedClients.get(userId);
  if (userConnections) {
    userConnections.delete(ws);

    // If no more connections for this user, unsubscribe from their channel
    if (userConnections.size === 0) {
      authenticatedClients.delete(userId);
      const channel = userNotificationsChannel(userId);

      if (subscribedChannels.has(channel) && subscriberClient) {
        subscribedChannels.delete(channel);
        await subscriberClient.unsubscribe(channel);
        console.log(`[UserManager] Unsubscribed from channel: ${channel}`);
      }
    }
  }

  console.log(
    `[UserManager] User ${userId} connection removed. Remaining: ${authenticatedClients.get(userId)?.size ?? 0}`,
  );
}

/**
 * Broadcast a message to all WebSocket connections for a specific user
 */
export function broadcastToUser(userId: string, message: string): void {
  const connections = authenticatedClients.get(userId);
  if (!connections || connections.size === 0) return;

  for (const ws of connections) {
    try {
      ws.send(message);
    } catch {
      // Connection might be closed, will be cleaned up on next disconnect
    }
  }
}

/**
 * Check if a user has any active WebSocket connections
 */
export function isUserConnected(userId: string): boolean {
  const connections = authenticatedClients.get(userId);
  return connections !== undefined && connections.size > 0;
}

/**
 * Get the userId for a WebSocket connection (if authenticated)
 */
export function getUserIdForConnection(ws: WSContext): string | undefined {
  return clientToUser.get(ws);
}
