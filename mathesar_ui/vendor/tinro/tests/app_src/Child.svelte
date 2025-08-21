<script>
    import {meta,router} from 'tinro';
    let routeData = meta();
</script>

<h1>I'm child</h1>

<h4>Params: </h4>
<div id="params">{JSON.stringify($routeData.params)}</div>

<h4>Query: </h4>
<div id="query">{JSON.stringify($routeData.query)}</div>

<h4>Meta:</h4>
<div id="meta"><pre>{JSON.stringify($routeData,null,'  ')}</pre></div>


<button on:click={()=>router.location.query.set('foo','bar')}>Set query</button>
<button on:click={()=>router.location.hash.set('bar')}>Set hash</button>
<button on:click={()=>router.location.query.clear()}>Clear query</button>
<button on:click={()=>router.location.hash.clear()}>Clear hash</button>