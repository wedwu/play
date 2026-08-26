const { TableClient } = require("@azure/data-tables");

const TABLE_NAME = "PokerRooms";
let clientPromise = null;

function getClient() {
  if (!clientPromise) {
    const conn = process.env.AzureWebJobsStorage;
    clientPromise = (async () => {
      const client = TableClient.fromConnectionString(conn, TABLE_NAME, {
        allowInsecureConnection: true
      });
      await client.createTable().catch(() => {});
      return client;
    })();
  }
  return clientPromise;
}

// Table storage row keys can't contain "/", so roomId is sanitized for storage
// but kept intact for the SignalR group name.
function rowKeyFor(roomId) {
  return Buffer.from(roomId).toString("base64").replace(/=/g, "");
}

async function getRoom(roomId) {
  const client = await getClient();
  try {
    const entity = await client.getEntity("room", rowKeyFor(roomId));
    return JSON.parse(entity.stateJson);
  } catch (err) {
    if (err.statusCode === 404) {
      return { roomId, revealed: false, votes: [] };
    }
    throw err;
  }
}

async function saveRoom(state) {
  const client = await getClient();
  await client.upsertEntity(
    {
      partitionKey: "room",
      rowKey: rowKeyFor(state.roomId),
      stateJson: JSON.stringify(state)
    },
    "Replace"
  );
}

module.exports = { getRoom, saveRoom };
