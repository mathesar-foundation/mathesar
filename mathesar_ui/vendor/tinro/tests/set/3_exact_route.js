module.exports = async function (test,assert) {
    
    test('Exact route', async ctx =>{

        await ctx.page.go('/test2');
        assert.is(
            await ctx.page.innerText('h1'),
            'Exact route - OK',
        'Exact route opens');

        await ctx.page.go('/test2/sub');
        assert.is(
            await ctx.page.innerText('h1'),
            'Root fallback',
        'Exact route not opens with sub path');
    }

)}