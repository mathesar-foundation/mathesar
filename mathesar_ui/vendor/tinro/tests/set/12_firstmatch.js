module.exports = async function (test,assert) {
   test('Firstmatch property', async ctx =>{
    await ctx.page.go('/test12/foo/bar');

      assert.equal(
         await ctx.page.innerText('h1'),
         'Only matched subpage- OK',
      'Open first matched page');

   
      assert.not.ok(
         await ctx.page.innerText('#notmatch'),
         'Second matched page did not opened'
      );

   }
)}