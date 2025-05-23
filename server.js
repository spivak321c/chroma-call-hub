
// This file is used to run the WebRTC signaling and chat server
// for development purposes

require('esbuild').buildSync({
  entryPoints: ['src/server/server.ts'],
  bundle: true,
  platform: 'node',
  target: ['node16'],
  outfile: 'dist/server.js',
});

console.log('Starting signaling server...');
require('./dist/server.js');
