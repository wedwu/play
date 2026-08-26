const { app, output } = require("@azure/functions");
const { getRoom, saveRoom } = require("../roomStore");

const signalRMessage = output.generic({
  type: "signalR",
  name: "messages",
  hubName: "pokerhub",
  connectionStringSetting: "AzureSignalRConnectionString"
});

app.http("broadcastVote", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "broadcastVote",
  extraOutputs: [signalRMessage],
  handler: async (request, context) => {
    const body = await request.json();
    const { roomId, action } = body;

    if (!roomId || !action) {
      return { status: 400, jsonBody: { error: "roomId and action are required" } };
    }

    const state = await getRoom(roomId);

    if (action === "vote") {
      const { userId, userName, imageUrl, value } = body;
      const existing = state.votes.find((v) => v.userId === userId);
      if (existing) {
        existing.value = value;
        existing.userName = userName;
        existing.imageUrl = imageUrl;
      } else {
        state.votes.push({ userId, userName, imageUrl, value });
      }
    } else if (action === "reveal") {
      state.revealed = true;
    } else if (action === "reset") {
      state.revealed = false;
      state.votes = [];
    } else {
      return { status: 400, jsonBody: { error: `Unknown action: ${action}` } };
    }

    await saveRoom(state);

    context.extraOutputs.set(signalRMessage, [
      {
        target: "roomState",
        groupName: roomId,
        // While not revealed, hide card values from other clients so votes
        // can't be inferred before everyone reveals together.
        arguments: [
          {
            ...state,
            votes: state.votes.map((v) => ({
              ...v,
              value: state.revealed ? v.value : v.value !== null ? "hidden" : null
            }))
          }
        ]
      }
    ]);

    return { status: 200, jsonBody: { ok: true } };
  }
});
