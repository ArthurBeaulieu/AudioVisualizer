const express = require('express');
const path = require('path');
const compression = require('compression');
const zlib = require('node:zlib');
// App and preferences
const version = '1.0.0';
const port = 1337;
const app = express();
// Log
console.log(`${(new Date()).toISOString()} | AudioVisualizer v${version} | Starting server`);
// Ensure responses are compressed through this midleware
app.use(compression({
  level: zlib.constants.Z_BEST_COMPRESSION,
}));
// url definitions
app.use('/dist', express.static(path.join(__dirname, '../../dist'), { // Serve static bundles
  maxAge: '864000000' // 10 days caching for app assets
}));
app.use('/doc', express.static(path.join(__dirname, '../../doc'), { // Serve documentation files
  maxAge: '2592000000' // 30 days caching for documentation
}));
app.use('/', express.static(path.join(__dirname, '../../demo'), { // Serve static files
    maxAge: '864000000' // 10 days caching for app assets
}));
// Serve main html at /
app.get('/', (req, res) => {
  console.log(`${(new Date()).toISOString()} | AudioVisualizer v${version} | example.html page requested`);
  res.sendFile(path.join(__dirname, '../../demo/example.html'));
});
// Start server console
app.listen(port, () => {
  console.log(`${(new Date()).toISOString()} | AudioVisualizer v${version} | Server started and listening on port ${port}`);
});
