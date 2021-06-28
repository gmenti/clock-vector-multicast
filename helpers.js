const getRandomInt = (min, max) => {
  const minCeil = Math.ceil(min);
  const maxFloor = Math.floor(max);
  return Math.floor(Math.random() * (maxFloor - minCeil + 1)) + minCeil;
}

const sleep = time => new Promise(resolve => setTimeout(resolve, time));

module.exports = { sleep, getRandomInt };
