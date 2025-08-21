const Chrome = require('puppeteer');
const {spawn} = require('child_process');
const ports = require('port-authority');

async function setup(context) {

    console.log('Launching test server...');
	if(!(await ports.check(5050))) throw new Error("Port 5050 already in use, can't launch test server.")
    context.srv = spawn('node',['server.js'],{
        detached: false,
        cwd: 'tests'
    });
    process.on("exit", () => context.srv.kill());
    await ports.wait(5050);

    console.log('Launching Chrome...');
	context.browser = await Chrome.launch({ headless: true });
	context.page = await context.browser.newPage();
    context.page.setDefaultTimeout('15000');

    let headers = '';
    await context.page.setRequestInterception(true);
    context.page.on("request", request => {
        headers = request.headers();
        request.continue();
    });

    context.page.innerText = async selector => {
        try{
            return await context.page.$eval(selector, e => e.innerText);
        }catch{
            return null;
        }
    }
    context.page.classList = async selector => await context.page.$eval(selector, e => Array.from(e.classList));
    context.page.go = async path => await context.page.goto('http://localhost:5050'+path);
    context.page.path = async _ => (await context.page.url()).replace('http://localhost:5050','');
    context.page.headers = _ => headers;
}

async function cleanup(context) {
    console.log('Done ✅')
    console.log('Stopping Chrome...');
	await context.page.close();
	await context.browser.close();

    console.log('Stopping test server...');
    context.srv.kill();
}

module.exports = {
    setup,
    cleanup
}