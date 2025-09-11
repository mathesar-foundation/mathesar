module.exports = async function (test,assert) {
    test('Directive let:param', async ctx =>{
        await ctx.page.go('/test7/world');
        assert.is(
            await ctx.page.innerText('h1'),
            'Hello, world!',
        'Parameter was passed');
    }
)}