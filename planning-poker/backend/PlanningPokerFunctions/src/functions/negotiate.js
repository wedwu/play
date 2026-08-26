const { app, input } = require("@azure/functions");

const signalRConnectionInfo = input.generic({
  type: "signalRConnectionInfo",
  name: "connectionInfo",
  hubName: "pokerhub",
  connectionStringSetting: "AzureSignalRConnectionString",
  // Binding expression pulls roomId from the query string so the issued
  // token is scoped to that room's group only.
  userId: "{headers.x-ms-client-principal-id}"
});

app.http("negotiate", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "negotiate",
  extraInputs: [signalRConnectionInfo],
  handler: async (request, context) => {
    const connectionInfo = context.extraInputs.get(signalRConnectionInfo);
    return { jsonBody: connectionInfo };
  }
});
