module.exports = async function (test,assert) {
    test('Fallbacks', async ctx =>{

        await ctx.page.go('/blah');
        assert.is(
            await ctx.page.innerText('h1'),
            'Root fallback',
        'Root fallback from root');

        await ctx.page.go('/test5/blah');
        assert.is(
            await ctx.page.innerText('h1'),
            'Root fallback',
        'Root fallback from sub');

        await ctx.page.go('/test5/sub/blah');
        assert.is(
            await ctx.page.innerText('h1'),
            'Sub fallback',
        'Sub fallback from sub');

        await ctx.page.go('/test5/sub2/blah');
        assert.is(
            await ctx.page.innerText('h1'),
            'Redirect test - OK',
        'Fallback with redirect');
    }
)}