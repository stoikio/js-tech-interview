import { connect, createServer } from 'node:net';

/**
 * True when nothing listens on the port. A server bound to localhost only does not stop another
 * one from binding every interface, so connecting is checked too.
 */
export async function isPortFree(port) {
  const answers = await Promise.all([canConnect('127.0.0.1', port), canConnect('::1', port)]);
  return !answers.includes(true) && (await canListen(port));
}

function canConnect(host, port) {
  return new Promise((resolve) => {
    const socket = connect({ host, port, timeout: 500 });
    const done = (connected) => {
      socket.destroy();
      resolve(connected);
    };
    socket.once('connect', () => done(true));
    socket.once('error', () => done(false));
    socket.once('timeout', () => done(false));
  });
}

function canListen(port) {
  return new Promise((resolve) => {
    const server = createServer();
    server.once('error', () => resolve(false));
    server.listen(port, () => server.close(() => resolve(true)));
  });
}
