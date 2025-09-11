module.exports = async function (test,assert) {

    test('Dev app launch', async ctx =>{
        await ctx.page.go('/');
        
        assert.is( 
            await ctx.page.innerText('h1'),
            'Loaded tests page - OK',
        'App is loaded');
    }

)}