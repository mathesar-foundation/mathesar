<script>

    import {createRouteObject} from './../dist/tinro_lib';

    export let path = '/*';
    export let fallback = false;
    export let redirect = false;
    export let firstmatch = false;
    export let breadcrumb = null;

    let showContent = false;
    let params = {}; /* DEPRECATED */
    let meta = {};

    const route = createRouteObject({
        fallback,
        onShow(){showContent=true},
        onHide(){showContent=false},
        onMeta(newmeta){
            meta=newmeta;
            params = meta.params /* DEPRECATED */
        }
    });

    $: route.update({
        path,
        redirect,
        firstmatch,
        breadcrumb,
    });
</script>

{#if showContent}
    <slot {params} {meta}></slot>
{/if}