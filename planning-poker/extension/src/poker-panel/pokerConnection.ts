import * as signalR from "@microsoft/signalr";

/**
 * Connects to the Azure Functions + Azure SignalR Service backend.
 * Each work item gets its own "room" (group) keyed by `org/project/workItemId`,
 * so simultaneous estimation sessions never cross-talk.
 *
 * BACKEND_BASE_URL must point at your deployed Function App, e.g.
 * https://your-planning-poker.azurewebsites.net/api
 */
export const BACKEND_BASE_URL = "https://YOUR-FUNCTION-APP.azurewebsites.net/api";

export interface Vote {
  userId: string;
  userName: string;
  imageUrl?: string;
  value: string | null; // null = "voted but hidden", card value once revealed
}

export interface RoomState {
  roomId: string;
  revealed: boolean;
  votes: Vote[];
}

type Listener = (state: RoomState) => void;

export class PokerConnection {
  private connection: signalR.HubConnection | null = null;
  private listeners: Listener[] = [];
  public roomId: string;

  constructor(roomId: string) {
    this.roomId = roomId;
  }

  async connect(): Promise<void> {
    const negotiateResponse = await fetch(
      `${BACKEND_BASE_URL}/negotiate?roomId=${encodeURIComponent(this.roomId)}`,
      { method: "POST" }
    );
    if (!negotiateResponse.ok) {
      throw new Error(`Negotiate failed: ${negotiateResponse.status}`);
    }
    const { url, accessToken } = await negotiateResponse.json();

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(url, { accessTokenFactory: () => accessToken })
      .withAutomaticReconnect()
      .build();

    this.connection.on("roomState", (state: RoomState) => {
      this.listeners.forEach((l) => l(state));
    });

    await this.connection.start();

    // Ask the backend for current state on join (covers late joiners)
    await fetch(`${BACKEND_BASE_URL}/getState?roomId=${encodeURIComponent(this.roomId)}`);
  }

  onStateChange(listener: Listener) {
    this.listeners.push(listener);
  }

  async castVote(userId: string, userName: string, imageUrl: string | undefined, value: string) {
    await fetch(`${BACKEND_BASE_URL}/broadcastVote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId: this.roomId,
        action: "vote",
        userId,
        userName,
        imageUrl,
        value
      })
    });
  }

  async reveal() {
    await fetch(`${BACKEND_BASE_URL}/broadcastVote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId: this.roomId, action: "reveal" })
    });
  }

  async reset() {
    await fetch(`${BACKEND_BASE_URL}/broadcastVote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId: this.roomId, action: "reset" })
    });
  }

  disconnect() {
    this.connection?.stop();
  }
}
