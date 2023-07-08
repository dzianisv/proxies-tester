const proxyValidator = require('./proxyValidator');
const fs = require('fs');

function readProxyListFromFile(filePath) {
  try {
    // Read the content of the file
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    // Split the content into lines
    const lines = fileContent.split('\n');

    // Initialize an array to store the proxies
    const proxies = [];

    // Process each line
    for (const line of lines) {
      // Split each line into IP and port
      const [ip, port] = line.split(':');

      // Validate IP and port
      if (ip && port) {
        let protocols = ['http'];
        if (port != 80) {
          protocols.push('socks4');
          protocols.push('socks5');
        }
        proxies.push({ ip: ip.trim(), port: parseInt(port.trim(), 10), protocols });
      }
    }

    return proxies;
  } catch (error) {
    console.error('Error reading proxy list:', error);
    return [];
  }
}

(async function main() {
  if (process.argv.length != 3){
    console.log('Usage: ', process.argv[0], process.argv[1], 'proxies.txt');
    return;
  }
  const validatedProxies = {};
  const concurrency = process.env.TEST_CONCURRENCY ? parseInt(process.env.TEST_CONCURRENCY) : 100;

  const proxies = readProxyListFromFile(process.argv[2]);
  await proxyValidator.validateList(proxies, concurrency, (proxy) => {
    if (validatedProxies.hasOwnProperty(proxy.ip)) {
      return;
    }
    validatedProxies[proxy.ip] == proxy;
    fs.appendFileSync('proxies-formated.txt', `${proxy.protocol}://${proxy.ip}:${proxy.port} ${proxy.throughput}\n`, 'utf-8');
    fs.appendFileSync('proxies-new.txt', `${proxy.ip}:${proxy.port}\n`, 'utf-8');
  });
})();

