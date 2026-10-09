const express = require('express');
const app = express();
app.get('/api/widgets', (req, res) => {
  res.json([
    { id: 1, name: 'weather', city: 'Paris' },
    { id: 2, name: 'crypto', coin: 'BTC' },
  ]);
});
app.listen(4000, () => console.log('backend listening on 4000'));
