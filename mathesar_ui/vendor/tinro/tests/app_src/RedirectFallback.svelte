<script>
    import {Route} from 'tinro';
    let isAuthed = false;
</script>

<h1>Redirect fallback</h1>
<nav>
    <a id="r6LinkCabinet" href="/redirect6/">Cabinet</a>
    <a id="r6Link404" href="/redirect6/foo">404</a>
</nav>

<Route>
    {#if isAuthed}
        <Route path="/"><h2>Cabinet</h2> <button on:click={()=>isAuthed=false} id="r6Logout">Logout</button></Route>
        <Route fallback><h2>404</h2></Route>
    {:else}
        <Route path="/login"><h2>Login</h2> <button on:click={()=>isAuthed=true} id="r6Login">Login</button></Route>
        <Route fallback redirect="/redirect6/login"/>
    {/if}
</Route>