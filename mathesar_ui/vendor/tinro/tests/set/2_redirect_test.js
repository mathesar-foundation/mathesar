module.exports = async function (test,assert) {
    test('Testing redirects', async ctx =>{

        await ctx.page.go('/redirect1');
        assert.is( 
            await ctx.page.path(),
            '/redirect',
        'Exact redirect');

        await ctx.page.go('/redirect2');
        assert.is( 
            await ctx.page.path(),
            '/redirect',
        'Exact redirect level 0');

        await ctx.page.go('/redirect2/sub/');
        assert.is( 
            await ctx.page.path(),
            '/redirect',
        'Exact redirect level 1');

        await ctx.page.go('/redirect2/sub/slug');
        assert.is( 
            await ctx.page.path(),
            '/redirect',
        'Exact redirect level 2');

        await ctx.page.go('/redirect4/off');
        await ctx.page.click('#setRedirectSwitch');
        assert.is(
            await ctx.page.innerText('b'),
            'On',
        'Route switch');

        await ctx.page.go('/redirect5');
        await ctx.page.click('#setRedirectButton');
        assert.is( 
            await ctx.page.path(),
            '/redirect',
        'Set redirect prop');

        await ctx.page.go('/redirect6');
        assert.is( 
            await ctx.page.innerText('h2'),
            'Login',
        '1st redirect');
        await ctx.page.click('#r6Login');
        assert.is( 
            await ctx.page.innerText('h2'),
            '404',
        '2st redirect');
    }
)}