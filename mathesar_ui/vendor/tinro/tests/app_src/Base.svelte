<script>
    import {router,Route} from 'tinro';
</script>

<Route path="/test15/*">
    <Route path="/"><h1>Main</h1></Route>
</Route>

<Route path="/t15foo"><h1>Foo</h1></Route>
<Route path="/t15bar"><h1>Bar</h1></Route>

<nav>
    <a href="/t15foo">To Foo</a>
    <a href="/t15bar">To bar</a>
</nav>

<button on:click={()=>router.base('/test15')}>Set base '/test15'</button>
<button on:click={()=>router.base('')}>Clear base</button>