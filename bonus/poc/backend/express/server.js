const express = require("express");

const app = express();
const PORT = 4101;

const WIDGETS = [
  { id: 1, name: "city_temperature", service: "weather" },
  { id: 2, name: "recent_commits", service: "github" },
  { id: 3, name: "top_stories", service: "hackernews" },
];

app.get("/widgets", (req, res) => {
  res.json(WIDGETS);
});

app.listen(PORT, () => {
  console.log(`Express POC listening on :${PORT}`);
});
