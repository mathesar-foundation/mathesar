module.exports = async function (test,assert) {
    test('Navigation methods', async ctx =>{
        // History
        await ctx.page.go('/test6');

        await ctx.page.click('#setHistory');
        await ctx.page.click('#links');
        await ctx.page.click('#internalSubLink');

        assert.is(
            await ctx.page.path(),
            '/test3/sub',
        'History URL correct');

        assert.is(
            await ctx.page.innerText('h1'),
            'Non exact route sub - OK',
        'History route is loaded');

        // Hash
        await ctx.page.go('/test6');

        await ctx.page.click('#setHash');
        await ctx.page.click('#links');
        await ctx.page.click('#internalSubLink');

        assert.is(
            await ctx.page.path(),
            '/#/test3/sub',
        'Hash URL correct');

        assert.is(
            await ctx.page.innerText('h1'),
            'Non exact route sub - OK',
        'Hash route is loaded');

        // Memory
        await ctx.page.go('/test6');

        await ctx.page.click('#setMemory');
        await ctx.page.click('#links');
        await ctx.page.click('#internalSubLink');

        assert.is(
            await ctx.page.path(),
            '/',
        'Memory URL correct');

        assert.is(
            await ctx.page.innerText('h1'),
            'Non exact route sub - OK',
        'Memory route is loaded');
    }
)}