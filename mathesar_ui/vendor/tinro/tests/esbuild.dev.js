const esbuild = require('esbuild');
const sveltePlugin = require('esbuild-svelte');
const { derver } = require('derver');

const DEV = process.argv.includes('--dev');
const CWD = process.cwd();

(async ()=>{
    await build_tinro_lib();
    await build_test_app();

    if(DEV){
        derver({
            dir: 'tests/www',
            watch: ['tests/www','tests/app_src','cmp','src'],
            spa: true,
            onwatch:async (lr,item)=>{
                if(['tests/app_src','cmp','src'].includes(item)){
                    lr.prevent();
                    await build_tinro_lib();
                    await build_test_app();
                }
            }
        })
    }
})()


async function build_tinro_lib(){
    await esbuild.build({
        entryPoints: ['src/tinro.js'],
        bundle: true,
        outfile: 'tests/dist/tinro_lib_test.js',
        format: 'esm',
        sourcemap: DEV && 'inline',
        minify: !DEV,
        external: [
            'svelte',
            'svelte/*'
        ]
    });
}

async function build_test_app(){
    await esbuild.build({
        entryPoints: ['tests/app_src/app.js'],
        bundle: true,
        globalName: 'app',
        outfile: 'tests/www/build/bundle.js',
        sourcemap: DEV && 'inline',
        minify: !DEV,
        plugins: [
            aliasPlugin,
            sveltePlugin({
                dev: DEV,
                css: css => css.write('tests/www/build/bundle.css')
            })
        ]
    });
}


const aliasPlugin = {
    name: 'alias-plugin',
    setup(build) {
      build.onResolve({ filter: /\/dist\/tinro_lib$/ }, args => {
        return { path: CWD + '/tests/dist/tinro_lib_test.js' }
      });

      build.onResolve({ filter: /^tinro/ }, args => {
        return { path: CWD + '/cmp/index.js' }
      });
    },
  }