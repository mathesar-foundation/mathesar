module.exports = async function (test,assert) {
    test('Breadcrumbs', async ctx =>{
        await ctx.page.go('/test14');
        assert.is(
            await ctx.page.innerText('h1'),
            'Not redirected - OK',
        'Not redirected');

        await ctx.page.click('#turnOnRedirect');
        assert.is(
            await ctx.page.innerText('h1'),
            'Redirect test - OK',
        'Route now redirects');
    }
)}