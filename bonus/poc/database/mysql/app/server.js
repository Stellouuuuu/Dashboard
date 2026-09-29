const mysql = require("mysql2/promise");
const http = require("http");

let pool;

async function connectWithRetry(retries = 30) {
  for (let i = 0; i < retries; i++) {
    try {
      pool = mysql.createPool({ uri: process.env.DATABASE_URL });
      await pool.query("SELECT 1");
      return;
    } catch (err) {
      console.log(`DB not ready, retry ${i + 1}/${retries}...`);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  throw new Error("Could not connect to MySQL");
}

async function init() {
  await connectWithRetry();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS widgets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      config JSON NOT NULL
    )
  `);
  const [rows] = await pool.query("SELECT * FROM widgets LIMIT 1");
  if (rows.length === 0) {
    await pool.query("INSERT INTO widgets (name, config) VALUES (?, ?)", [
      "city_temperature",
      JSON.stringify({ city: "Paris", unit: "C" }),
    ]);
    console.log("Widget inserted");
  }
}

const server = http.createServer(async (req, res) => {
  if (req.url === "/widget" && req.method === "GET") {
    const [rows] = await pool.query("SELECT * FROM widgets ORDER BY id LIMIT 1");
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(rows[0]));
    return;
  }
  res.writeHead(404);
  res.end();
});

init().then(() => {
  server.listen(3000, () => console.log("POC database/mysql app listening on :3000"));
});
