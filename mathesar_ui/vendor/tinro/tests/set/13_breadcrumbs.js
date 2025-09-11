module.exports = async function (test,assert) {
    test('Breadcrumbs', async ctx =>{
        await ctx.page.go('/test13');
        assert.is(
            await ctx.page.innerText('h1'),
            '[{"name":"Parent","path":"/test13"}]',
        'Parent page breadcrumbs');

        await ctx.page.go('/test13/foo');
        assert.is(
            await ctx.page.innerText('h1'),
            '[{"name":"Parent","path":"/test13"},{"name":"Child","path":"/test13/foo"}]',
        'Child page breadcrumbs');
    }
)}