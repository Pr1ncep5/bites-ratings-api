import { initializeSubscriberClient } from "../utils/client";
import { CHANNELS, type RestaurantUpdateEvent } from "./channels";
import { broadcast } from "./manager";

export async function initializePubSub() {
  const subscriber = await initializeSubscriberClient();

  await subscriber.subscribe(CHANNELS.RESTAURANT_UPDATES, (message) => {
    try {
      const event: RestaurantUpdateEvent = JSON.parse(message);
      broadcast(event.restaurantId, message);
    } catch (error) {
      console.error("Failed to process Pub/Sub message:", error);
    }
  });

  console.log(`Subscribed to channel: ${CHANNELS.RESTAURANT_UPDATES}`);
}
