module.exports = async function (test,assert) {
    test('Not exact route', async ctx =>{

        await ctx.page.go('/test3');
        assert.is(
            await ctx.page.innerText('h1'),
            'Non exact route root- OK',
        'Not exact route root opens');

        await ctx.page.go('/test3/sub');
        assert.is(
            await ctx.page.innerText('h1'),
            'Non exact route sub - OK',
        'Not exact route sub opens');
    }
)}