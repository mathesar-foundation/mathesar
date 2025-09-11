module.exports = async function (test,assert) {
    test('Active action', async ctx =>{
        const links = [
            'activeNoActive',
            'activeNotExact',
            'activeExact',
            'activeExactSub',
            'activeCustomclass',
            'activeWithdata',
            'activeHash',
            'activeQuery',
            'activeFragment',
            'activeQueryAndFragment',
            'activeTrailingSlash',
        ];

        await ctx.page.go('/test9');

        let set = await getLinks(ctx.page,links);

        assert.ok(set['activeNoActive'].length === 0, 'Not active link');
        assert.ok(set['activeNotExact'].includes('active'), 'Active, not exact');
        assert.ok(set['activeExact'].includes('active'), 'Active, exact');
        assert.ok(set['activeExactSub'].length === 0, 'Not active sub, exact');
        assert.ok(set['activeCustomclass'].includes('customactive'), 'Active, custom class');
        assert.ok(set['activeWithdata'].includes('customactive'), 'Active, custom class, with data');
        assert.ok(set['activeHash'].includes('active'), 'Active, hash-link');
        assert.ok(set['activeQuery'].includes('active'), 'Active', 'With query');
        assert.ok(set['activeFragment'].includes('active'), 'Active', 'With fragment');
        assert.ok(set['activeQueryAndFragment'].includes('active'), 'Active', 'With  and fragment');
        assert.ok(set['activeTrailingSlash'].includes('active'), 'Active', 'With trailing slash');

        await ctx.page.go('/test9/sub');

        set = await getLinks(ctx.page,links);
        assert.ok(set['activeNoActive'].length === 0, 'Not active link');
        assert.ok(set['activeNotExact'].includes('active'), 'Active, not exact');
        assert.ok(set['activeExact'].length === 0, 'Not active, exact');
        assert.ok(set['activeExactSub'].includes('active'), 'Active sub, exact');
        assert.ok(set['activeCustomclass'].includes('customactive'), 'Active, custom class');
        assert.ok(set['activeWithdata'].length === 0, 'Not active, custom class, with data');
        assert.ok(set['activeHash'].length === 0, 'Not active, hash-link');
        assert.ok(set['activeQuery'].length === 0, 'Not active, hash-link');
        assert.ok(set['activeFragment'].length === 0, 'Not active, hash-link');
        assert.ok(set['activeQueryAndFragment'].length === 0, 'Not active, hash-link');
        assert.ok(set['activeTrailingSlash'].length === 0, 'Not active, hash-link');
    }
)}

async function getLinks(p,l){
    let o = {};
    for(let id of l){
        o[id] = await p.classList('#'+id);
    }
    return o;
}