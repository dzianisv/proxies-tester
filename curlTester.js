const { spawn } = require('child_process');

function testProxy(proxy, timeout = 5000, url = 'https://link.testfile.org/500MB') {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    const proc = spawn('curl', ['-v', '-m', (timeout / 1000).toString(), '-s', '--proxy', `${proxy.protocol}://${proxy.ip}:${proxy.port}`, '-L', url]);
    let dataReceived = 0;
    let stderr;

    proc.stdout.on('data', (data) => {
      dataReceived += data.length;
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString('utf8');
    });

    proc.on('close', (code) => {
      if ((code != 28 && code != 0) || dataReceived == 0) {
        // console.log(__filename, proxy.protocol, proxy.ip, proxy.port, 'curl exited with code', code);
        reject(stderr);
        return;
      }

      const timeTaken = (Date.now() - start) / 1000; // time in seconds

      // Throughput is bytes/second
      const throughput = dataReceived / timeTaken;
      resolve(throughput);
    });
  });
}

module.exports = {
  testProxy
};