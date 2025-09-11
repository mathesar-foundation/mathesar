<script>
    import {Route} from 'tinro';
    let flag = false;
</script>

<h1>Redirect switch</h1>

{#if flag}
    <Route path="/off" redirect='/redirect4/on' />
    <Route path="/on"><b>On</b></Route>
{:else}
    <Route path="/on" redirect='/redirect4/off' />
    <Route path="/off"><b>Off</b></Route>
{/if}

<div>
    <button id="setRedirectSwitch" on:click={()=>flag=!flag}>Switch to {flag ? 'Off' : 'On'}</button>
</div>