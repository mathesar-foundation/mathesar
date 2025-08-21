<script>
	import {Route,router,active} from 'tinro';
	import Child from './Child.svelte';
	import RedirectSwitch from './RedirectSwitch.svelte';
	import RedirectByValue from './RedirectByValue.svelte';
	import RedirectFallback from './RedirectFallback.svelte';
	import Base from './Base.svelte';

	let isRedirect = false;
</script> 

<div class="layout">
	<div class="tests">
		<ul>
			<li><a href="/redirect1">Redirect test</a></li>
			<li> Redirect not exact <br/>
				<a href="/redirect2/sub">Sub</a> <a href="/redirect2/sub/slug">Sub2</a>
			</li>
			<li> Redirect relative <br/>
				<a href="/redirect3">Root</a> <a href="/redirect3/notroot">Not root</a>
			</li>
			<li><a href="/redirect4/off">Redirect switch</a></li>
			<li><a href="/redirect5">Redirect prop set</a></li>
			<li><a href="/redirect6">Redirect fallback</a></li>
			<li><a href="/test1">Simple route</a></li>
			<li><a href="/test2">Exact route</a></li>
			<li> Non exact route <br/>
				<a href="/test3">Root</a> <a href="/test3/sub">Sub</a>
			</li>
			<li><a id="links" href="/test4/">Links</a></li>
			<li> Fallbacks <br/>
				<a href="/blah">Root</a> <a href="/test5/blah">Root from sub</a> <a href="/test5/sub/blah">Sub from sub</a> <a href="/test5/sub2/blah">Redirected</a>
			</li>
			<li><a href="/test6">Change navigation type</a></li>
			<li><a href="/test7/world">Parameters</a></li>
			<li><a href="/test8/world?a=1&name=world&list=1,2,3#foo">Child</a></li>
			<li><a href="/test9">Active action</a></li>
			<li><a href="/test10">Without trailing slash</a></li>
			<li> Dynamic route params <br/>
				<a href="/test11/foo/bar">FooBar</a> <a href="/test11/abc/xyz?hello=world">AbcXyz</a>
			</li>
			<li>Only attribute<br/>
				<a href="/test12/foo">Matched</a> <a href="/test12/bar">Not matched</a>
				<a href="/test12/foo/bar">Submatched</a> <a href="/test12/foo/foo">Not submatched</a>
			</li>
			<li>Breadcrumbs<br/>
				<a href="/test13">Parent</a> 
				<a href="/test13/foo">Child</a> 
			</li>
			<li><a href="/test14">Reactive props</a></li>
			<li><a href="/test15">Base changing</a></li>
		</ul>
	</div>

	<div class="test">
			<Route path="/"><h1>Loaded tests page - OK</h1></Route>
			<Route path="/redirect1" redirect="/redirect" />
			<Route path="/redirect2/*" redirect="/redirect" />
			<Route path="/redirect"><h1>Redirect test - OK</h1></Route>
			<Route path="/redirect3/*">
				<Route path="/" redirect="subpage" />
				<Route path="/notroot" redirect="subpage" />
				<Route path="/subpage"><h1>Relative redirect test - OK</h1></Route>
			</Route>
			<Route path="/redirect4/*"><RedirectSwitch/></Route>
			<Route path="/redirect5/*"><RedirectByValue/></Route>
			<Route path="/redirect6/*"><RedirectFallback/></Route>
			<Route path="/test1"><h1>Simple route - OK</h1></Route>
			<Route path="/test2"><h1>Exact route - OK</h1></Route>
			<Route path="/test3/*">
				<Route path="/"><h1>Non exact route root- OK</h1></Route>
				<Route path="/sub"><h1>Non exact route sub - OK</h1></Route>
			</Route>
			<Route path="/test4">
				<h1>Links test</h1>
				<p><a href="/test1" id="internalLink">Internal route</a></p>
				<p><a href="/test3/sub" id="internalSubLink">Internal sub route</a></p>
				<p><a href="foo" id="internalLinkRelative">Internal relative route</a></p>
				<p><a href="/abc" id="ignoreLink" tinro-ignore>Internal route ignored</a></p>
				<p><a href="https://github.com/AlexxNB/tinro" id="externalLink">External route</a></p>
				<p><a href="/#/test1" id="internalHashLink">With hash</a></p>
				<p><a href="mailto:foo@domain.tld" id="mailtoLink">Mailto</a></p>
				<p><a href="/test1" target="_blank">Target blank</a></p>
				<p><a href="/test1" target="_self">Target self</a></p>
			</Route>
			<Route path="/test4/foo"><h1>Relative link - OK</h1></Route>
			<Route path="/test5/*">
				<Route path="/sub/*">
					<Route fallback><h1>Sub fallback</h1></Route>
				</Route>
				<Route path="/sub2/*">
					<Route fallback redirect="/redirect" />
				</Route>
			</Route>
			<Route path="/test6">
				<button id="setHistory" on:click={()=>{router.goto('/'); router.mode.history();router.goto('/')}}>History</button>
				<button id="setHash" on:click={()=>{router.goto('/'); router.mode.hash();router.goto('/')}}>Hash</button>
				<button id="setMemory" on:click={()=>{router.goto('/'); router.mode.memory();router.goto('/')}}>Memory</button>
			</Route>
			<Route path="/test7/:name" let:params><h1>Hello, {params.name}!</h1></Route>
			<Route path="/test8/:name"><Child /></Route>
			<Route path="/test9/*">
				<h1>Links test</h1>
				<p><a use:active href="/test1" id="activeNoActive">Not active</a></p>
				<p><a use:active href="/test9" id="activeNotExact">Not exact</a></p>
				<p><a use:active href="/test9" id="activeExact" exact>Exact</a></p>
				<p><a use:active href="/test9?foo=bar" id="activeQuery" exact>Exact with query</a></p>
				<p><a use:active href="/test9#foo" id="activeFragment" exact>Exact with fragment</a></p>
				<p><a use:active href="/test9?bar=foo#foo" id="activeQueryAndFragment" exact>Exact with fragment and query</a></p>
				<p><a use:active href="/test9/" id="activeTrailingSlash" exact>Exact with trailing slash</a></p>
				<p><a use:active href="/test9/sub" id="activeExactSub" exact>Exact sub</a></p>
				<p><a use:active href="/test9" id="activeCustomclass" active-class="customactive">Not exact, custom class</a></p>
				<p><a use:active href="/test9" id="activeWithdata" data-exact data-active-class="customactive">exact, custom class, data</a></p>
				<p><a use:active href="/#/test9" id="activeHash" exact>Hash-style link, exact</a></p>
			</Route>
			<Route path="test10"><h1>Without trailing slash - OK</h1></Route>
			<Route path="/test11/:first/:second">
				<Child />
			</Route>
			<Route path="/test12/*" firstmatch>
				<Route path="/foo"><h1>Only matched - OK</h1></Route>
				<Route path="/:var"><h1>Only didn't matched - OK</h1></Route>
				<Route path="/foo/bar"><h1>Only matched subpage- OK</h1></Route>
				<Route path="/foo/:var"><h1 id="notmatch">Only didn't matched subpage - OK</h1></Route>
			</Route>

			<Route path="/test13/*" breadcrumb="Parent">
				<Route path="/" let:meta><h1>{JSON.stringify(meta.breadcrumbs)}</h1></Route>
				<Route path="/foo" breadcrumb="Child" let:meta><h1>{JSON.stringify(meta.breadcrumbs)}</h1></Route>
			</Route>

			<Route path="/test14/*">
				<button id="turnOnRedirect" on:click={()=>isRedirect="/redirect"}>Turn on redirect</button>
				<Route path="/" redirect={isRedirect}><h1>Not redirected - OK</h1></Route>
			</Route>

			
			<Base/>
			
			<Route fallback><h1>Root fallback</h1></Route>
	</div>
</div>



<style>
	.layout{display: flex;}
	.tests{
		border-right: 1px solid black;
		padding: 10px;
		width: 300px;
	}
	.test{
		padding:10px;
	}
	:global(.active){
		color: red !important;
	}
	:global(.customactive){
		color: green !important;
	}
</style>