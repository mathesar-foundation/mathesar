module.exports = async function (test,assert) {
    test('Links', async ctx =>{
        
        await ctx.page.go('/test4');
        await ctx.page.click('#internalLink');
        assert.is(
            await ctx.page.innerText('h1'),
            'Simple route - OK',
        'Internal link');

        await ctx.page.go('/test4/');
        await ctx.page.click('#internalLinkRelative');
        assert.is(
            await ctx.page.innerText('h1'),
            'Relative link - OK',
        'Internal relative link');

        await ctx.page.go('/test4');
        await ctx.page.click('#ignoreLink');
        assert.is(
            ctx.page.headers().referer,
            'http://localhost:5050/test4',
        'Internal link ignored');

        await ctx.page.go('/test4');
        await ctx.page.click('#externalLink');
        assert.is(
            await ctx.page.url(),
            'https://github.com/AlexxNB/tinro',
        'External link');

        await ctx.page.go('/test4');
        await ctx.page.click('#internalHashLink');
        assert.is(
            await ctx.page.innerText('h1'),
            'Simple route - OK',
        'Hashed link');
    }
)}