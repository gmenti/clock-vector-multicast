const configReader = require('./config-reader');
const multicastManager = require('./multicast-manager');
const dgramManager = require('./dgram-manager');
const { sleep, getRandomInt } = require('./helpers');

if (process.argv.length !== 4) throw new Error('Invalid args received, example usage: "node index.js 1 ./configs/test"')

setImmediate(async () => {
  const myId = parseInt(process.argv[2]);
  const configName = process.argv[3];
  const configs = await configReader.getAll(configName);

  const myConfig = configs.find(config => config.id === myId);
  if (!myConfig) throw new Error('Not finded config with id ' + myId);

  const othersConfig = configs.filter(config => config !== myConfig);

  console.log(`Loaded config ${configName}`, { myConfig, othersConfig });

  await dgramManager.init(myConfig.ip, myConfig.port);
  multicastManager.sendNewNodeEvent(myId);

  console.log('Waiting all nodes connect:', configs.length);
  while (multicastManager.getOnlineNodes().length < configs.length) {
    await sleep(1);
  }

  console.log('All nodes connected, starting events processment');

  const clockVector = [];
  configs.forEach((_, index) => {
    clockVector[index] = 0;
  });

  dgramManager.onReceiveMessage((message) => {
    for (let i = 0; i < message.clockVector.length; i++) {
      if (message.clockVector[i] > clockVector[i]) {
        clockVector[i] = message.clockVector[i];
      }
    }
    console.log(`${myId} [${clockVector.join(',')}] R ${message.sender} [${message.clockVector.join(',')}]`);
  });

  let processedEvents = 0;
  while (processedEvents < myConfig.events) {
    const myIndex = configs.indexOf(myConfig);
    clockVector[myIndex] = clockVector[myIndex] + 1;

    const isLocal = Math.random() > myConfig.chance;
    if (isLocal) {
      console.log(`${myId} [${clockVector.join(',')}] L`);
    } else {
      let destinationIndex = myIndex;
      while (destinationIndex === myIndex) {
        destinationIndex = getRandomInt(0, configs.length - 1);
      }
      const destinationConfig = configs[destinationIndex];
      console.log(`${myId} [${clockVector.join(',')}] S ${destinationConfig.id}`);

      try {
        await dgramManager.sendMessage(
          destinationConfig.ip,
          destinationConfig.port,
          myConfig.ip,
          myConfig.port,
          {
            sender: myId,
            clockVector,
          },
        );
      } catch (err) {
        console.log(err);
        console.error(err);
        process.exit(-1);
      }
    }
    processedEvents++;
    await sleep(1);
  }
});
