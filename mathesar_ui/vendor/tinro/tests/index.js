const { test } = require('uvu');
const assert = require('uvu/assert');
const env = require('./environment');
const fs = require('fs');

test.before(env.setup);
test.after(env.cleanup);

const testfiles = fs.readdirSync('tests/set').sort((a,b)=>Number(a.split('_')[0])-Number(b.split('_')[0]));

for(let file of testfiles){
	if(!file.startsWith('_') && file.endsWith('.js')){
		require(`./set/${file}`)(test,assert);
	}
}

test.run();