const { MongoClient } = require("mongodb");
const http = require("http");

let db;

async function connectWithRetry(retries = 20) {
  for (let i = 0; i < retries; i++) {
    try {
      const client = new MongoClient(process.env.DATABASE_URL);
      await client.connect();
      db = client.db("poc");
      return;
    } catch (err) {
      console.log(`DB not ready, retry ${i + 1}/${retries}...`);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  throw new Error("Could not connect to MongoDB");
}

async function init() {
  await connectWithRetry();
  const widgets = db.collection("widgets");
  const existing = await widgets.findOne({});
  if (!existing) {
    await widgets.insertOne({
      name: "city_temperature",
      config: { city: "Paris", unit: "C" },
    });
    console.log("Widget inserted");
  }
}

const server = http.createServer(async (req, res) => {
  if (req.url === "/widget" && req.method === "GET") {
    const widget = await db.collection("widgets").findOne({});
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(widget));
    return;
  }
  res.writeHead(404);
  res.end();
});

init().then(() => {
  server.listen(3000, () => console.log("POC database/mongodb app listening on :3000"));
});
