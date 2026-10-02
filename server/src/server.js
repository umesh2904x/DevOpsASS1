'use strict';

const app = require('./app');

const PORT = process.env.PORT || 3000;
const server = app().listen(PORT, () => {
  console.log(`ShopVerse running at http://localhost:${PORT}`);
});

process.on('SIGTERM', () => server.close(() => process.exit(0)));

module.exports = server;
