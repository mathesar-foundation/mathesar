const esbuild = require('esbuild');
const sveltePlugin = require('esbuild-svelte');
const pkg = require('./package.json');

(async ()=>{
    await esbuild.build({
        entryPoints: ['src/tinro.js'],
        bundle: true,
        outfile: 'dist/tinro_lib.js',
        format: 'esm',
        minify: true,
        external: [
            'svelte',
            'svelte/*'
        ]
    });

    await esbuild.build({
        entryPoints: ['cmp/index.js'],
        bundle: true,
        outfile: pkg.module,
        format: 'esm',
        minify: true,
        external: [
            'svelte',
            'svelte/*'
        ],
        plugins: [sveltePlugin()]
    });

    await esbuild.build({
        entryPoints: ['cmp/index.js'],
        bundle: true,
        outfile: pkg.main,
        format: 'cjs',
        minify: true,
        external: [
            'svelte',
            'svelte/*'
        ],
        plugins: [sveltePlugin()]
    });
})()
