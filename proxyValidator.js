
const cq = require('concurrent-queue');
const nodeTester = require('./stdlibTester');
const curlTester = require('./curlTester');
const throughputThreshold = 1000;

async function validate(proxy, timeout) {
    try {
        const speed = await nodeTester.testProxy(proxy, timeout);
        if (speed > throughputThreshold) {
            console.log(__filename, 'found a good proxy', proxy.protocol, proxy.ip, proxy.port, 'througput (Bps)', speed);
            return {...proxy, throughput: speed};
        } else {
            console.log(__filename, 'bad proxy', proxy.protocol, proxy.ip, proxy.port, 'througput (Bps)', speed);
            return null;
        }
    } catch(err) {
        console.log(__filename, proxy, err);
        return null;
    }
}

async function validateList(proxyList, concurrency = 100, onValidProxy = (proxy) => { }) {

    const queue = cq().limit({ concurrency: concurrency }).process(async function (proxy) {
        return await validate(proxy, timeout = 5000);
    });

    let validated = [];

    for (let proxy of proxyList) {
        for (let protocol of proxy.protocols) {
            let testProxy = { ip: proxy.ip, port: proxy.port, protocol };
            console.log(__filename, 'validate', JSON.stringify(testProxy));``
            queue(testProxy, (err, ret) => {
                if (ret) {
                    validated.push(ret);
                    onValidProxy(ret);
                } else if (err) {
                    //console.log(proxy, err);
                }
            });
        }
    }

    return new Promise((resolve, reject) => {
        queue.drained(() => {
            console.log(__filename, 'tasks queue drained');
            resolve(validated);
        });

        if (queue.size == 0) {
            resolve(validated);
        }

    });
}


module.exports = {
    validate,
    validateList,
}