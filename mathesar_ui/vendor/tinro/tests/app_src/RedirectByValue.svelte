<script>
    import {Route} from 'tinro';
    let active = false;
</script>

<h1>Redirect switch</h1>
<Route path="/" redirect={active ? '/redirect' : false} />

<div>
    <button id="setRedirectButton" on:click={()=>active=true}>Turn on redirect</button>
</div>