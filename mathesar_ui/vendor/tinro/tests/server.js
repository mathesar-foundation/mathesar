const {derver} = require('derver');

derver({
  dir: 'www',
  port: 5050,
  spa: true,
  watch: false,
});