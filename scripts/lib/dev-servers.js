#!/usr/bin/env node
/**
 * helpers.js — dev-server detection for absolute-ui-ux (visual review).
 * CLI:    node helpers.js            → prints JSON array of open localhost ports
 * Module: const { detectDevServers } = require('./helpers');
 */

const net = require('net');

const COMMON_PORTS = [3000, 3001, 4173, 4200, 4321, 5000, 5173, 5174, 6006, 8000, 8080, 8888, 1234];

function checkPort(port, host = '127.0.0.1', timeout = 400) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const done = (open) => { socket.destroy(); resolve(open); };
    socket.setTimeout(timeout);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false));
    socket.once('error', () => done(false));
    socket.connect(port, host);
  });
}

async function detectDevServers(ports = COMMON_PORTS) {
  const results = await Promise.all(ports.map(async (port) => ((await checkPort(port)) ? port : null)));
  return results.filter(Boolean).map((port) => ({ port, url: `http://localhost:${port}` }));
}

module.exports = { detectDevServers, checkPort, COMMON_PORTS };

if (require.main === module) {
  detectDevServers().then((servers) => console.log(JSON.stringify(servers)));
}
