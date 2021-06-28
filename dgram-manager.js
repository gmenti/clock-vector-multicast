const uuid = require('uuid');
const dgram = require('dgram');
const { sleep } = require('./helpers');
const server = dgram.createSocket('udp4');

const timeout = 100;
const ackMessages = [];

const init = async (ip, port) => new Promise(resolve => {
  server.bind(port, ip, resolve);
});

const sendMessage = async (address, port, fromAddress, fromPort, message) => {
  if (message.key === 'ack') {
    return server.send(Buffer.from(JSON.stringify(message)), port, address);
  }
  Object.assign(message, { id: uuid.v4(), fromAddress, fromPort });
  server.send(Buffer.from(JSON.stringify(message)), port, address);
  const startedAt = Date.now();
  while (!ackMessages.includes(message.id)) {
    if (Date.now() - startedAt >= timeout) throw new Error('Ack not received, timeout ' + timeout + 'ms');
    await sleep(1);
  }
};

const onReceiveMessage = (cb) => {
  server.on('message', (msg, rinfo) => {
    const event = JSON.parse(msg.toString());
    if (event.key === 'ack') {
      ackMessages.push(event.id);
    } else {
      sendMessage(event.fromAddress, event.fromPort, null, null, {
        key: 'ack',
        id: event.id,
      });
      cb(event, rinfo);
    }
  });
};

module.exports = { init, sendMessage, onReceiveMessage };
