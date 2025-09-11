# tinro

![npm](https://img.shields.io/npm/v/tinro?style=flat-square) ![GitHub Workflow Status](https://img.shields.io/github/workflow/status/AlexxNB/tinro/Publish%20on%20NPM?label=test&style=flat-square) ![npm bundle size](https://img.shields.io/bundlephobia/minzip/tinro?label=Bundle%20size&style=flat-square) ![npm](https://img.shields.io/npm/dt/tinro?style=flat-square) 


tinro is a highly declarative, [tiny](https://github.com/AlexxNB/tinro/blob/master/COMPARE.md), dependency free router for [Svelte](https://svelte.dev) web applications.

## Features

* Just one component to declare routes in your app
* Links are just common native `<a>` elements
* History API, Hash-based, or in-memory navigation
* Simple nested routes
* Routes with parameters (`/hello/:name`)
* Redirects
* Fallbacks on any nested level
* Parsing query parameters (`?x=42&hello=world&fruits=apple,banana,orange`)
* Manage URL's hash and query parts
* [Svelte's REPL](https://svelte.dev/repl/4bc37ff40ada4111b71fe292a4eb90f6) compatible

## Documentation

* [Install](#install)
* [Getting started](#getting-started)
* [Nesting](#nesting)
* [Links](#links)
* [Redirects](#redirects)
* [Fallbacks](#fallbacks)
* [Route meta](#route-meta)
    - [url](#metaurl)
    - [pattern](#metapattern)
    - [match](#metamatch)
    - [from](#metafrom)
    - [query](#metaquery)
    - [params](#metaparams)
    - [breadcrumbs](#metabreadcrumbs)
* [~~Parameters~~ (Deprecated since 0.5.0)](#parameters)
* [Navigation method](#navigation-method)
* [Base path](#base-path)
* [Manage hash and query](#manage-hash-and-query)
* [API](#api)
* [Recipes](#recipes)
    - [Lazy loading](#lazy-loading-components)
    - [Transitions](#transitions)
    - [Guarded routes](#guarded-routes)
    - [Scroll to top](#scroll-to-top)
    - [Navigation Announcer](#navigation-announcer)
* [Troubleshooting](#troubleshooting)


## Install

Install tinro as a dev dependency in your Svelte project:

```shell
$ npm i -D tinro
```

## Getting started

**tinro is very simple!** It provides just *one component* — `<Route>`. A common app structure looks like this:

```html
<script>
    import {Route} from 'tinro'; 
    import Contacts from './Contacts.svelte'; // <h1>Contacts</h1>
</script>

<nav>
    <a href="/">Home</a>
    <a href="/portfolio">Portfolio</a>
    <a href="/contacts">Contacts</a>
</nav>

<Route path="/"><h1>This is the main page</h1></Route>
<Route path="/portfolio/*">
    <Route path="/">
        <h1>Portfolio introduction</h1>
        <nav>
            <a href="/portfolio/sites">Sites</a> 
            <a href="/portfolio/photos">Photos</a>
        </nav>
    </Route>
    <Route path="/sites"><h1>Portfolio: Sites</h1></Route>
    <Route path="/photos"><h1>Portfolio: Photos</h1></Route>
</Route>
<Route path="/contacts"><Contacts /></Route>
```
See the example in action in [Svelte's REPL](https://svelte.dev/repl/4bc37ff40ada4111b71fe292a4eb90f6)

## Nesting

There are two types of routes you can declare in the `<Route>` component's `path` property:

### Exact path

Shows its content only when `path` matches the URL of the page *exactly*. You can't place a nested `<Route>` inside these components.

```html
<Route path="/">...</Route>
<Route path="/page">...</Route>
<Route path="/page/subpage">...</Route>
```

### Non-exact path

`<Route>` components with a `path` property that ends with `/*` show their content when a part of the page's URL matches with the path before the `/*`. A nested `<Route>` can be placed inside routes with a non-exact path only.

```html
<Route path="/books/*">
    Books list:
    <Route path="/fiction">...</Route>
    <Route path="/drama">...</Route>
</Route>
```

The `path` property of a nested `<Route>` is relative to its parent. To see the _Fiction_ category in the above example, you would point your browser to `http://mysite.com/books/fiction`.

Nested routes also work inside child components. So, we can rewrite the example this way:

```html
<!-- Bookslist.svelte-->
...
Books list:
<Route path="/fiction">...</Route>
<Route path="/drama">...</Route>

<!-- App.svelte-->
...
<Route path="/books/*">
    <Bookslist/>
</Route>
```

### Show first matched nested route only

Sometimes, you need to show only the first nested route from all those matched with a given URL. Use the `firstmatch` property on the parent `Route`:

```html
<Route path="/user/*" firstmatch>

    <!-- Will be open when URL is /user/add -->
    <Route path="/add">Add new user</Route> 

    <!-- Will be open when URL is /user/alex or /user/bob, but not /user/add -->
    <Route path="/:username" let:meta>Show user {meta.params.username}'s profile</Route> 

</Route>
```

## Links

There is no special component for links. Just use native `<a>` elements. When the `href` attribute starts with a single `/` (like `/mypage` or just `/`) or is a relative path(like `foo`, `foo/bar`), it will be treated as an internal link which will be matched with defined routes. Other cases do not affect the links' behavior. 

All internal links will be passed into the tinro router. However, it is possible to prevent this by adding the `tinro-ignore` or `data-tinro-ignore` attributes:

```html
<a href="/api/auth" tinro-ignore>Go to API page</a>
```

If you need to add the `active` class to links where the path corresponds to the current URL, use the `active` action from the `tinro` package:

```html
<script>
    import {active} from 'tinro';
</script>   

<!-- Common usage:
     class `active` will be added when URL is '/page' or any relative path like '/page/sub/sub' -->
<a href="/page" use:active>Link</a>

<!-- Exact match:
     class `active` will be added only when URL exactly equals '/page'  (but NOT '/page/sub') -->
<a href="/page" use:active exact>Link</a>

<!-- Custom class:
    class `myactive` will be added if link is active -->
<a href="/page" use:active active-class="myactive">Link</a>

<!-- Valid HTML usage:
    if you prefer to have valid HTML use `data-` prefix -->
<a href="/page" use:active data-exact data-active-class="myactive">Link</a>
```

## Redirects

You can redirect the browser to any path by using the `redirect` property:

```html
<!-- Exact redirect -->
<Route path="/noenter" redirect="/newurl"/>

<!-- Non-exact redirect will also work for any nested path -->
<Route path="/noenter/*" redirect="/newurl"/>
```

You can also redirect to a relative path — just write the new URL without `/` in front of it:

```html
<!-- This will redirect to /subpage/newurl -->
<Route path="/subpage/*">
    <Route path="/" redirect="newurl"/>
</Route>
```

## Fallbacks

Routes with the `fallback` property show their content when no matched address was found. Fallbacks may be placed inside a non-exact `<Route>` or belong to root routes. Fallbacks bubble, so if there is no fallback on the current level, the router will try to find one on any parent levels. See the example:

```html
<Route>  <!-- same as <Route path="/*"> -->
    <Route path="/">Root page</Route>
    <Route path="/page">Page</Route>
    <Route path="/sub1/*">
        <Route path="/subpage">Subpage1</Route>
    </Route>
    <Route path="/sub2/*">
        <Route path="/subpage">Subpage2</Route>
        <Route fallback>No subpage found</Route>
    </Route>
    <Route fallback>No page found</Route>
</Route>

<a href="/">...</a>               <!-- shows Root page -->
<a href="/page">...</a>           <!-- shows Page -->
<a href="/blah">...</a>           <!-- shows No page found -->
<a href="/sub1/subpage">...</a>   <!-- shows Subpage1 -->
<a href="/sub1/blah">...</a>      <!-- shows No page found -->
<a href="/sub1/blah/blah">...</a> <!-- shows No page found -->
<a href="/sub2/subpage">...</a>   <!-- shows Subpage2 -->
<a href="/sub2/blah">...</a>      <!-- shows No subpage found -->
<a href="/sub2/blah/blah">...</a> <!-- shows No subpage found -->
```

## Route meta

You can get useful meta data for each route by importing and calling `meta` from the `tinro` package. Notice, that `meta()` must be called only inside any `<Route>`'s child component.

```html 
<script>
    import {meta} from 'tinro';
    const route = meta();  
</script>

<h1>My URL is {route.url}!</h1>

<!-- If you need reactive updates, use it as a store -->
<h1>My URL is {$route.url}!</h1>
```

You can also get meta data with the `let:meta` directive:

```html 
<Route path="/hello" let:meta>
    <h1>My URL is {meta.url}!</h1>
</Route>
```

### `meta.url`

Current browser URL (includes query). 

*Example: `/books/stanislaw_lem/page2?order=descend`*


### `meta.pattern`

The pattern of the route path, including parameter placeholders. It is a combination of the `path` properties of all parent routes. 

*Example: `/books/:author`*

### `meta.match`

Part of the browser URL that is matched with the route pattern. 

*Example: `/books/stanislaw_lem`*

### `meta.from`

If present, the value of the browser URL before navigation to the current page. Useful to make a back button, for example.

*Example: `/books/stanislaw_lem/page1?order=descend`*

### `meta.query`

Object containing keys/values from the browser URL query string (if present).

*Example: `{order: "descend"}`*

### `meta.params`

If the route pattern has parameters, their values will be in the `meta.params` object.

```html
<!-- Example for URL "/books/stanislaw_lem/solaris"> -->
<Route path="/books/:author/*" let:meta>

    <!-- meta.params here {author:stanislaw_lem} -->
    Author: {meta.params.author}

    <Route path="/:title" let:meta>

        <!-- meta.params here {author:stanislaw_lem, title:solaris} -->
        Book: {meta.params.title}

    </Route>
</Route>
```

### `meta.breadcrumbs`

All parent routes that have a `breadcrumb` property will add a breadcrumb to the `meta.breadcrumbs` array. Each breadcrumb is an object with `name` and `path` fields.


```html
<Route path="/*" breadcrumb="Home">
    <Route path="/portfolio" breadcrumb="My Portfolio" let:meta>
        <ul class="breadcrumbs">
        {#each meta.breadcrumbs as bc}
            <li><a href={bc.path}>{bc.name}</a></li>
        {/each}
        </ul>

        This is my portfolio
    </Route>
</Route>
```


## Parameters

> **!** *`route.params` and `let:params` are DEPRECATED since v.0.5.0. and will be deleted in future versions!*

See [meta.params](#metaparams) section

## Navigation method

By default, navigation uses the `History API` which allows you to have clean page URLs, although it needs some setup on the server side. Instead, you may choose to use `hash` or `memory` navigation methods. There is no need to change links or paths in your app, everything else will still work the same.

```html
<!-- Root file of your project, ex. App.svelte -->
<script>
    import {Route,router} from 'tinro';

    router.mode.hash(); // enables hash navigation method

    // - OR -

    router.mode.memory(); // enables in-memory navigation method
</script>

<!-- Link will point browser to '/#/page/subpage' -->
<a href="/page/subpage">Subpage</a>

<!-- Route shows content when URL is '/#/page/subpage' -->
<Route path="/page/subpage">Subpage content</Route>
```

*Note: default navigation method in non-browser environment or inside iframes is `memory`*

### Server side setup for History API method

When you use the `History API` and point the browser to the root path `/` (usually `/index.html`) all links and Routes will work properly. But when you start your app on any subpage, like `/page/subpage`, you will see the `404 Not found` error. Because of this, you need to setup your server to point all requests to `/index.html`.

This is easy if you use the [official Svelte template](https://github.com/sveltejs/template). Just open `package.json` and find this NPM script:

```json
"start": "sirv public"
```

Replace it with this line:

```json
"start": "sirv public --single"
```

Now, start your app with `npm run dev` and open a URL like `http://localhost:5000/page/subpage`. You should see the app page, instead of the "Not found" error.

*For other servers you can read the following links: [Nginx](https://www.nginx.com/blog/creating-nginx-rewrite-rules/#Example&nbsp;%E2%80%93-Enabling-Pretty-Permalinks-for-WordPress-Websites), [Apache](https://httpd.apache.org/docs/2.4/rewrite/remapping.html#fallback-Resource), [Caddy](https://caddyserver.com/docs/caddyfile/directives/rewrite#examples)*

## Base path

When you deploy your app in subdirectory on the host and use history navigation mode you must use full links and routes for correct navigation. Other way is to set *base path*, and all links and routes will be treated relatively. For example, if you deploy on `https://myserver.com/subdir`, then set *base path* to `/subdir` in root component of your app:

```html
<script>
    import {router, Route} from 'tinro';
    router.base('/subdir');
</script>

<nav>
  <a href="/foo">Foo</a>
  <a href="/bar">Bar</a>
</nav>

<Route path="/foo">This is Foo</Route>
<Route path="/bar">This is Bar</Route>
```

*Notice: Base path must start but not end with `/`*

## Manage hash and query 

You can change URL's parts (such as query and hash) using `router.location` methods:

```javascript
import {router} from 'tinro';

router.goto('/foo'); //URL: /foo
router.location.query.set('name','alex'); //URL: /foo?name=alex
router.location.hash.set('bar'); //URL: /foo?name=alex#bar
router.location.query.set('page',1); //URL: /foo?name=alex&page=1#bar
router.location.query.replace({hello: 'world'}); //URL: /foo?hello=world#bar
router.location.query.clear(); //URL: /foo#bar
router.location.hash.clear(); //URL: /foo
```

## API

You can import the `router` object from the `tinro` package:

### `router.goto(href)`
Programmatically change the URL of the current page.

### `router.mode`
Methods to change curent router mode:

* `history()` - set HistoryAPI navigation method
* `hash()` - set hash navigation method
* `memory()` - set memory navigation method

### `router.base(path)`
Sets [base path](#base-path) for router

### `router.location.hash`
Methods, which allows to get or set current value of the URL's hash part:

* `get()` - get current hash value
* `set(value)` - set new hash value
* `clear()` - remove hash from the current URL

### `router.location.query`
Methods, which allows to get or modify current value of the URL's query part:

* `get(name?)` - get current query object, or its property value when `name` specified
* `set(name,value)` - update or add query property by `name`
* `delete(name)` - remove property with specified `name` from the query object
* `replace(object)` - replace current query object with new one
* `clear()` - remove query from the current URL

### `router.subscribe(func)`
The `router` object is a valid Svelte store, so you can subscribe to get the changing navigation data. `func` gets an object with page data:

* `url` - current browser URL (with query string)
* `from` - previous URL before navigation to current page (if present)
* `path` - current browser URL
* `hash` - the hash part of the URL, after `#` sign
* `query` - object, containing parsed query string

Note: you can use Svelte's auto-subscription to retrieve data from the `router` store:

```html
<script>
    import {router} from 'tinro';
</script>

Current page URL is: {$router.path}
```
### `router.mode.[history()|hash()|memory()]`
Run this in the app's root file to set the navigation method you need.

### `router.params()`
Deprecated. See `router.meta` instead.

## Recipes

tinro is not the most powerful router among all those available for Svelte applications. We prefer a smaller footprint in your bundles over having all possible features out of the box. But you can easily code some features yourself using the recipies below:

### Lazy loading components

If you want to have code-splitting and load components only when that page is requested, make this little component:

```html
<!-- Lazy.svelte-->
<script>
    export let component;
</script>

{#await component.then ? component : component()}
    Loading component...
{:then Cmp}
   <svelte:component this={Cmp.default} />
{/await}
```

And use it when you need a lazy loaded component in your routes:

```html
<Route path="/lazypage">
    <Lazy component={()=>import('./mypage.svelte')}/>
        <!-- OR -->
    <Lazy component={import('./mypage.svelte')}/>      
</Route>
```

### Transitions

If you want a transiton when the path changes, create a component like this:

```html
<!-- Transition.svelte -->
<script>
    import {router} from 'tinro';
    import {fade} from 'svelte/transition';
</script>

{#key $router.path}
    <div in:fade="{{ duration: 700 }}">
        <slot></slot>
    </div>
{/key}
```

Then, put your routes inside the *Transition* component:

```html
<Transition> 
    <Route path="/">...</Route>
    <Route path="/page1">...</Route>
    <Route path="/page2">...</Route>
</Transition>
```

### Guarded routes

You can protect routes from being loaded using only Svelte's logic blocks, like the `{#if}` statement:

```html
{#if user.authed}
    <Route path="/profile">This is a private page...</Route>
{:else}
    <Route path="/profile"><a href="/login">Please sign in first</a></Route>
    <Route path="/login">This is the sign in form...</Route>
{/if}
```

You can also create a special guard component as shown in [this example](https://svelte.dev/repl/5673ff403af14411b0cd1785be3d996f).


### Scroll to top

tinro doesn't control scrolling in your app, but sometimes you need to scroll to the top of the page after navigation. To do this, just add the `router` store subscription to your root component (ex. `App.svelte`). This way you can run any actions (not just scrolling) every time the `URL` changes.

```javascript
import {router} from `tinro`;
router.subscribe(_ => window.scrollTo(0, 0));
```

### Navigation announcer

The problem of any SPA router is that it does not use default browser navigation when user click the link. This cause accessibility issue for people who use screenreaders, because it won't announce that new page was loaded. You can fix this creating `Announce` component:

```html
<!-- Announcer.svelte-->
<script>
  import { router } from 'tinro';
  $: current = $router.path === '/' ? 'Home' : $router.path.slice(1);
</script>

<div aria-live="assertive" aria-atomic="true">
  {#key current}
    Navigated to {current}
  {/key}
</div>

<style>
  div {
    position: absolute;
    left: 0;
    top: 0;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    overflow: hidden;
    white-space: nowrap;
    width: 1px;
    height: 1px;
  }
</style>
```

Then place this component somewhere in your `App.svelte` root file:

```html
...
<Announcer />
...
```

## Troubleshooting

If you use Vite to bandle your app (including SvelteKit), you should exclude `tinro` from the `optimizedDeps` in Vite's config:

```javascript
  ...
  optimizeDeps: {
    exclude: ['tinro']
  },
  ...
```
