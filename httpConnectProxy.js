const net = require('net');

function connect(host, port, proxy) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection(proxy.port, proxy.host, () => {
      // Connection established to the proxy server
      console.log(__filename, 'Connected to the proxy server');

      // Send HTTP CONNECT request to the destination host and port
      const request = `CONNECT ${host}:${port} HTTP/1.1\r\nHost: ${host}:${port}\r\n\r\n`;
      socket.write(request);
    });

    // Handle socket data
    socket.on('data', (data) => {
      // Check if the response indicates successful connection establishment
      const response = data.toString();
      if (response.includes('200 Connection established')) {
        console.log(__filename, 'Connection established');
        socket.removeAllListeners('data');``
        resolve(socket);
      } else {
        socket.end();
        reject(new Error(response));
      }
    });

    // Handle socket errors
    socket.on('error', (error) => {
      console.error(__filename, 'Socket error:', error);
      reject(error);
    });

    // Handle socket close
    socket.on('close', () => {
      console.log(__filename, 'Socket closed');
    });
  });
}

module.exports = {
    connect
};
