import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { PokerConnection, RoomState } from "./pokerConnection";

const DECK = ["0", "0.5", "1", "2", "3", "5", "8", "13", "20", "40", "100", "?", "☕"];

interface Props {
  roomId: string;
  currentUserId: string;
  currentUserName: string;
  currentUserImage?: string;
  onApplyEstimate: (value: number) => void;
}

export const PokerPanel: React.FC<Props> = ({
  roomId,
  currentUserId,
  currentUserName,
  currentUserImage,
  onApplyEstimate
}) => {
  const [connection] = useState(() => new PokerConnection(roomId));
  const [state, setState] = useState<RoomState>({ roomId, revealed: false, votes: [] });
  const [myVote, setMyVote] = useState<string | null>(null);
  const [status, setStatus] = useState<"connecting" | "connected" | "error">("connecting");

  useEffect(() => {
    connection.onStateChange(setState);
    connection
      .connect()
      .then(() => setStatus("connected"))
      .catch((err) => {
        console.error(err);
        setStatus("error");
      });
    return () => connection.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const average = useMemo(() => {
    if (!state.revealed) return null;
    const numeric = state.votes
      .map((v) => parseFloat(v.value ?? ""))
      .filter((n) => !Number.isNaN(n));
    if (numeric.length === 0) return null;
    return Math.round((numeric.reduce((a, b) => a + b, 0) / numeric.length) * 10) / 10;
  }, [state]);

  const handleVote = (value: string) => {
    setMyVote(value);
    connection.castVote(currentUserId, currentUserName, currentUserImage, value);
  };

  return (
    <div style={styles.container}>
      {status === "error" && (
        <div style={styles.banner}>
          Couldn't connect to the planning poker service. Check your network/backend URL.
        </div>
      )}

      <div style={styles.votersRow}>
        {state.votes.length === 0 && (
          <div style={styles.emptyState}>No one has voted yet. Pick a card below.</div>
        )}
        {state.votes.map((v) => (
          <div key={v.userId} style={styles.voterCard}>
            <div
              style={{
                ...styles.cardFace,
                ...(state.revealed ? styles.cardFlipped : styles.cardBack)
              }}
            >
              {state.revealed ? v.value : "🂠"}
            </div>
            <div style={styles.voterName}>{v.userName}</div>
          </div>
        ))}
      </div>

      {state.revealed && average !== null && (
        <div style={styles.resultRow}>
          <span>Average: <strong>{average}</strong></span>
          <button style={styles.applyBtn} onClick={() => onApplyEstimate(Math.round(average))}>
            Apply {Math.round(average)} to Story Points
          </button>
        </div>
      )}

      <div style={styles.deck}>
        {DECK.map((card) => (
          <button
            key={card}
            onClick={() => handleVote(card)}
            style={{
              ...styles.deckCard,
              ...(myVote === card ? styles.deckCardSelected : {})
            }}
          >
            {card}
          </button>
        ))}
      </div>

      <div style={styles.controls}>
        <button style={styles.secondaryBtn} onClick={() => connection.reveal()}>
          Reveal
        </button>
        <button
          style={styles.secondaryBtn}
          onClick={() => {
            setMyVote(null);
            connection.reset();
          }}
        >
          Reset Round
        </button>
      </div>
    </div>
  );
};

const styles: { [k: string]: React.CSSProperties } = {
  container: { padding: 12, fontSize: 13 },
  banner: {
    background: "#fde7e9",
    color: "#a4262c",
    padding: 8,
    borderRadius: 4,
    marginBottom: 10
  },
  votersRow: { display: "flex", gap: 10, flexWrap: "wrap", minHeight: 70, marginBottom: 10 },
  emptyState: { color: "#666", fontStyle: "italic" },
  voterCard: { display: "flex", flexDirection: "column", alignItems: "center", width: 56 },
  cardFace: {
    width: 44,
    height: 60,
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 600,
    fontSize: 16,
    border: "1px solid #ccc"
  },
  cardBack: { background: "#0078d4", color: "#fff" },
  cardFlipped: { background: "#fff", color: "#222" },
  voterName: { fontSize: 11, marginTop: 4, textAlign: "center", maxWidth: 56, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  resultRow: { display: "flex", alignItems: "center", gap: 12, marginBottom: 10 },
  applyBtn: {
    background: "#0078d4",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    padding: "6px 10px",
    cursor: "pointer"
  },
  deck: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 },
  deckCard: {
    width: 40,
    height: 54,
    borderRadius: 6,
    border: "1px solid #ccc",
    background: "#fff",
    cursor: "pointer",
    fontWeight: 600
  },
  deckCardSelected: { background: "#0078d4", color: "#fff", borderColor: "#0078d4" },
  controls: { display: "flex", gap: 8 },
  secondaryBtn: {
    background: "#f3f2f1",
    border: "1px solid #ccc",
    borderRadius: 4,
    padding: "6px 10px",
    cursor: "pointer"
  }
};
