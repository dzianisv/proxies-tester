
const cq = require('concurrent-queue');
const throughput = require('./throughput');

async function validate(proxy, timeout) {
    const speed = await throughput.testThrougput(proxy, timeout);
    if (speed > 100) {
        console.log(__filename, 'found a good proxy', JSON.stringify(proxy.protocols), proxy.ip, proxy.port, 'througput (Bps)', speed);
        return {...proxy, throughput: speed};
    } else {
        console.log(__filename, 'bad proxy', JSON.stringify(proxy.protocols), proxy.ip, proxy.port, 'througput (Bps)', speed);
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