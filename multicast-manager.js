const mdns = require('multicast-dns')({
  multicast: true,
  port: 4321,
  ip: '230.0.0.1',
  ttl: 255,
  loopback: true,
  reuseAddr: true,
});

const sendEvent = (event, data) => {
  mdns.query(JSON.stringify({ event, data }));
};

const onlineNodes = new Set();
const getOnlineNodes = () => [...onlineNodes];

const sendNewNodeEvent = (id) => sendEvent('new_node', id);
const sendOnlineNodesEvent = () => sendEvent('online_nodes', getOnlineNodes());

mdns.on('query', (query) => {
  const message = JSON.parse(query.questions[0].name);
  switch (message.event) {
    case 'new_node':
      onlineNodes.add(message.data);
      sendOnlineNodesEvent();
      break;

    case 'online_nodes':
      message.data.forEach(node => onlineNodes.add(node));
      break;
  }
});

module.exports = {
  getOnlineNodes,
  sendNewNodeEvent,
  sendOnlineNodesEvent,
};
