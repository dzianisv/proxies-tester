const net = require('net');
const dns = require('node:dns').promises;

const Socks5States = Object.freeze({
  SENT_HELLO: 1,
  RECEIVED_HELLO_ACK: 2,
  SENT_CONNECT: 3,
  RECEIVED_CONNECT_ACK: 4
})

function buildSocks5ConnectPacketDomain(host, port) {
  const domainLength = Buffer.byteLength(host);
  const request = Buffer.alloc(5 + domainLength + 2);
  request[0] = 0x05; // SOCKS5 version
  request[1] = 0x01; // CONNECT command
  request[2] = 0x00; // Reserved byte
  request[3] = 0x03; // Address type: Domain name
  request[4] = domainLength; // Length of the destination host
  request.write(host, 5); // Destination host
  request.writeUInt16BE(port, 5 + domainLength);
  return request;
}

function buildSocks5ConnectPacket(ip, port) {
  const parts = ip.split('.').map(Number);
  const request = Buffer.from([
    0x05,       // SOCKS version
    0x01,       // CONNECT command
    0x00,       // Reserved byte
    0x01,       // Address type: IPv4,
    ...parts,   // IP address
    port >> 8,  // Destination port (high byte)
    port & 0xff,// Destination port (low byte)
  ]);

  return request;
}

function buildSocks4ConnectPacket(ip, port) {
  const parts = ip.split('.').map(Number);
  const request = Buffer.from([
    0x04,       // SOCKS version
    0x01,       // CONNECT command
    port >> 8,  // Destination port (high byte)
    port & 0xff,// Destination port (low byte)
    ...parts,   // IP address
    0x00        // Null byte for user-id
  ]);
  return request;
}

async function connect(host, port, proxy) {
  const ip = (await dns.resolve(host))[0];

  console.log(__filename, 'resolved', host, 'to', ip);
  return new Promise((resolve, reject) => {
    const socket = net.createConnection(proxy.port, proxy.host, () => {
      if (proxy.protocol === 'socks4') {
        const packet = buildSocks4ConnectPacket(ip, port);
        socket.write(packet);
        socket.on('data', (data) => {
          if (data[0] !== 0x00 || data[1] !== 0x5A) {
            socket.end();
            reject(new Error('Failed to establish connection with the SOCKS4 proxy server'));
            return;
          }

          socket.removeAllListeners('data');
          resolve(socket);
        });

      } else if (proxy.protocol === 'socks5') {
        const handshake = Buffer.from([0x05, 0x01, 0x00]);
        socket.write(handshake);
        let state = Socks5States.SENT_HELLO;

        socket.on('data', (data) => {
          console.log(__filename, 'received', data.toString('hex'), 'for', proxy.protocol, proxy.ip, proxy.port);
          if (state == Socks5States.SENT_HELLO && data[0] === 0x05 && data[1] === 0x00) {
            const packet = buildSocks5ConnectPacketDomain(host, port);
            socket.write(packet);
            console.log(__filename, 'sent connect packet', packet.toString('hex'));
            state = Socks5States.SENT_CONNECT;
          } else if (state == Socks5States.SENT_CONNECT && data[0] == 0x5 && data[1] == 0x0 && data[2] == 0x0) {
            console.log(__filename, "received connect ack", proxy.protocol, proxy.ip, proxy.port);
            socket.removeAllListeners('data');
            resolve(socket);
          } else {
            socket.end();
            reject(new Error('Failed to negotiate SOCKS5 authentication method'));
          }
        });
      } else {
        socket.end();
        reject(new Error('Unsupported proxy protocol'));
      }
    });

    socket.on('error', (error) => {
      reject(error);
    });

    socket.on('close', () => {
      console.log('socket closed');
    });
  });
}

module.exports = {
  connect
};
