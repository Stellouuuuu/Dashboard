const fastify = require("fastify")();
const PORT = 4102;

const WIDGETS = [
  { id: 1, name: "city_temperature", service: "weather" },
  { id: 2, name: "recent_commits", service: "github" },
  { id: 3, name: "top_stories", service: "hackernews" },
];

fastify.get("/widgets", async () => WIDGETS);

fastify.listen({ port: PORT }, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Fastify POC listening on :${PORT}`);
});
