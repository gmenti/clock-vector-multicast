const fs = require('fs');
const path = require('path');

const getAll = (configName) => new Promise((resolve, reject) => {
  const configPath = path.join(__dirname, configName);
  fs.readFile(configPath, (err, data) => {
    if (err) return reject(err);
    const configs = data.toString()
      .split('\n')
      .filter(row => row.trim().length)
      .map(row => row.split(' '))
      .map(row => {
        // row format: id host port chance events min_delay max_delay

        const config = {
          id: parseInt(row[0]),
          host: row[1],
          port: parseInt(row[2]),
          chance: parseFloat(row[3]),
          events: parseInt(row[4]),
          minDelay: parseInt(row[5]),
          maxDelay: parseInt(row[6]),
        };

        return config;
      });
    resolve(configs);
  });
});

module.exports = { getAll };
