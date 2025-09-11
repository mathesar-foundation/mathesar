module.exports = async function (test,assert) {
    test('Child component test', async ctx =>{
        await ctx.page.go('/test8/world?a=1&name=world&list=1,2,3');

        assert.is(
            await ctx.page.innerText('#params'),
            '{"name":"world"}',
        'Params passed');

        assert.is(
            await ctx.page.innerText('#query'),
            '{"a":"1","name":"world","list":["1","2","3"]}',
        'Query passed');
    }
)}