const { Client } = require("pg");
const http = require("http");

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function connectWithRetry(retries = 20) {
  for (let i = 0; i < retries; i++) {
    try {
      await client.connect();
      return;
    } catch (err) {
      console.log(`DB not ready, retry ${i + 1}/${retries}...`);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  throw new Error("Could not connect to Postgres");
}

async function init() {
  await connectWithRetry();
  await client.query(`
    CREATE TABLE IF NOT EXISTS widgets (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      config JSONB NOT NULL
    )
  `);
  const { rows } = await client.query("SELECT * FROM widgets LIMIT 1");
  if (rows.length === 0) {
    await client.query("INSERT INTO widgets (name, config) VALUES ($1, $2)", [
      "city_temperature",
      JSON.stringify({ city: "Paris", unit: "C" }),
    ]);
    console.log("Widget inserted");
  }
}

const server = http.createServer(async (req, res) => {
  if (req.url === "/widget" && req.method === "GET") {
    const { rows } = await client.query("SELECT * FROM widgets ORDER BY id LIMIT 1");
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(rows[0]));
    return;
  }
  res.writeHead(404);
  res.end();
});

init().then(() => {
  server.listen(3000, () => console.log("POC database/postgresql app listening on :3000"));
});
