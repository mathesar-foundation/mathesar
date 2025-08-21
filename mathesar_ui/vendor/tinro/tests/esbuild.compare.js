const esbuild = require('esbuild');
const sveltePlugin = require('esbuild-svelte');
const svelte = require('svelte/compiler');
const fs = require("fs");
const {execSync} = require('child_process');

const CWD = process.cwd();

(async ()=>{

    await build_with_tinro();
    await build_no_tinro();

    compare();
})();

async function build_with_tinro(){
    await esbuild.build({
        entryPoints: ['tests/app_src/app.js'],
        bundle: true,
        globalName: 'app',
        outfile: 'tests/dist/compare/bundle_with_tinro.js',
        minify: true,
        plugins: [
            aliasPlugin(),
            sveltePlugin({
                compileOptions:{
                    css: true
                }
            })
        ]
    });
}

async function build_no_tinro(){
    await esbuild.build({
        entryPoints: ['tests/app_src/app.js'],
        bundle: true,
        globalName: 'app',
        outfile: 'tests/dist/compare/bundle_no_tinro.js',
        minify: true,
        plugins: [
            mockTinroPlugin(),
            sveltePlugin({
                compileOptions:{
                    css: true
                }
            })
        ]
    });
}

function aliasPlugin(){return {
    name: 'alias-plugin',
    setup(build) {
      build.onResolve({ filter: /\/dist\/tinro_lib$/ }, args => {
        return { path: CWD + '/tests/dist/tinro_lib_test.js' }
      });

      build.onResolve({ filter: /^tinro$/ }, args => {
        return { path: CWD + '/cmp/index.js' }
      });

      build.onResolve({ filter: /cmp\/Route\.svelte$/ }, args => {
        return { path: CWD + '/cmp/Route.svelte' }
      });
    },
  }
}

function mockTinroPlugin(){return {
    name: 'mock-tinro-plugin',
    setup(build) {
        build.onResolve({ filter: /^tinro/ }, args => {
            return { path: CWD + '/cmp/index.js' }
        });

        build.onResolve({ filter: /\/dist\/tinro_lib$/ }, args => {
            return { path: 'tinro_lib_mock', namespace: 'mock' }
        });

        build.onLoad({ filter: /tinro_lib_mock/, namespace: 'mock' }, (args) => {
            return {
                contents: `
                    export const router = {
                        subscribe:()=>{},
                        mode:{
                            history: ()=>{},
                            hash: ()=>{},
                            memory: ()=>{}
                        },
                        location:{
                            hash: {},
                            query: {}
                        },
                        goto:()=>{}
                    };
					export const active = ()=>{};
					export const meta = {};
					export const createRouteObject = () => {};
                    import {writable} from 'svelte/store';
                    import {setContext,getContext} from 'svelte';
                    writable();
                    setContext();
                    getContext();
                `,
                resolveDir: '.'
            }
        });
        build.onLoad({ filter: /Route\.svelte$/ }, (args) => {
            return {
                contents: svelte.compile('<slot/>').js.code
            }
        });
    }
  }
}




function compare(){
    execSync("tar -czvf tests/dist/compare/bundle_with_tinro.tar.gz tests/dist/compare/bundle_with_tinro.js")
    execSync("tar -czvf tests/dist/compare/bundle_no_tinro.tar.gz tests/dist/compare/bundle_no_tinro.js")

    const with_tinro = fs.statSync("tests/dist/compare/bundle_with_tinro.js").size;
    const with_tinro_gz = fs.statSync("tests/dist/compare/bundle_with_tinro.tar.gz").size;
    const no_tinro = fs.statSync("tests/dist/compare/bundle_no_tinro.js").size;
    const no_tinro_gz = fs.statSync("tests/dist/compare/bundle_no_tinro.tar.gz").size;

    const with_tinro_kb = `${(with_tinro/1024).toFixed(2)} Kb`;
    const no_tinro_kb = `${(no_tinro/1024).toFixed(2)} Kb`;
    const tinro_value_kb = `${((with_tinro - no_tinro)/1024).toFixed(2)} Kb`;

    const with_tinro_gz_kb = `${(with_tinro_gz/1024).toFixed(2)} Kb`;
    const no_tinro_gz_kb = `${(no_tinro_gz/1024).toFixed(2)} Kb`;
    const tinro_gz_value_kb = `${((with_tinro_gz - no_tinro_gz)/1024).toFixed(2)} Kb`;

    fs.unlinkSync('tests/dist/compare/bundle_with_tinro.js');
    fs.unlinkSync('tests/dist/compare/bundle_with_tinro.tar.gz');
    fs.unlinkSync('tests/dist/compare/bundle_no_tinro.js');
    fs.unlinkSync('tests/dist/compare/bundle_no_tinro.tar.gz');
    fs.rmdirSync('tests/dist/compare');

    fs.writeFileSync('COMPARE.md',`# How much tinro adds to your bundle?

Current tinro value is **${tinro_value_kb}** (${tinro_gz_value_kb} gzipped).

## Comparsion

* bundle.js with tinro inside: **${with_tinro_kb}** (${with_tinro_gz_kb} gzipped)
* bundle.js with mocked tinro : **${no_tinro_kb}** (${no_tinro_gz_kb} gzipped)

## How do we compare?

Comparsion made by building [testing app](https://github.com/AlexxNB/tinro/tree/master/tests) in production mode two times. First one with tinro letest version inside. In the second case - all imports from tinro are mocked by empty exports.
    `);

    console.log('COMPARE:')
    console.log(` - With tinro: ${with_tinro_kb} (${with_tinro_gz_kb} gzipped)`)
    console.log(` - No tinro: ${no_tinro_kb} (${no_tinro_gz_kb} gzipped)`)
    console.log('---------------');
    console.log(` The tinro value is: ${tinro_value_kb} (${tinro_gz_value_kb} gzipped)`);
  }