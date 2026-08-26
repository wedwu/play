const { app, output } = require("@azure/functions");
const { getRoom } = require("../roomStore");

const signalRMessage = output.generic({
  type: "signalR",
  name: "messages",
  hubName: "pokerhub",
  connectionStringSetting: "AzureSignalRConnectionString"
});

app.http("getState", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "getState",
  extraOutputs: [signalRMessage],
  handler: async (request, context) => {
    const roomId = request.query.get("roomId");
    if (!roomId) {
      return { status: 400, jsonBody: { error: "roomId is required" } };
    }

    const state = await getRoom(roomId);

    context.extraOutputs.set(signalRMessage, [
      {
        target: "roomState",
        groupName: roomId,
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

    return { status: 200, jsonBody: state };
  }
});
