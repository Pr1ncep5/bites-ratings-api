import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

const WS_URL = import.meta.env.VITE_WS_URL;

export function useRestaurantWebSocket(restaurantId: string) {
    const queryClient = useQueryClient();
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log(`WS Connected. Subscribing to: ${restaurantId}`);
            ws.send(JSON.stringify({ action: "subscribe", restaurantId }));
        };

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);

                if (message.type === "NEW_REVIEW" && message.restaurantId === restaurantId) {
                    console.log("Live update detected! Refetching data...");

                    queryClient.invalidateQueries({ queryKey: ["reviews", restaurantId] });
                    queryClient.invalidateQueries({ queryKey: ["restaurant", restaurantId] });
                }
            } catch (err) {
                console.error("Failed to parse WebSocket message", err);
            }
        };

        return () => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ action: "unsubscribe", restaurantId }));
            }
            ws.close();
        };
    }, [restaurantId, queryClient]);
}