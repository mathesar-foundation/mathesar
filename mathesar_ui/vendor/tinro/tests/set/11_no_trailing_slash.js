module.exports = async function (test,assert) {
    test('No trailing slash', async ctx =>{
        await ctx.page.go('/test10');
        assert.is(
            await ctx.page.innerText('h1'),
            'Without trailing slash - OK',
        'Route without slash opens');
    }
)}