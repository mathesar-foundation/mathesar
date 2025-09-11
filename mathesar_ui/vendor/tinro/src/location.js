import MODES from './modes';
import {parseQuery,makeQuery,prefix} from './lib';
import { get } from 'svelte/store';

let memoURL;
let from;
let last;
let base = '';

export const location = createLocation();

function createLocation(){
    let MODE = MODES.getDefault();

    let listener;

    const reset = _ => window.onhashchange = window.onpopstate = memoURL = null;
    const dispatch = _ => listener && listener(readLocation(MODE));

    const setMode = (newMode)=>{
        newMode && (MODE = newMode);
        reset();
        MODE !== MODES.OFF 
        && MODES.run( MODE ,
            _ => window.onpopstate = dispatch,
            _ => window.onhashchange = dispatch
        )
        && dispatch()
    }

    const makeURL = (parts)=>{
        const loc = Object.assign(readLocation(MODE),parts);
        return loc.path 
             + prefix(makeQuery(loc.query),'?') 
             + prefix(loc.hash,'#')
    }

    return {
        mode: setMode,
        get: _ => readLocation(MODE),
        go(href,replace){
            writeLocation(MODE,href,replace);
            dispatch();
        },
        start(fn){
            listener = fn;
            setMode()
        },
        stop(){
            listener = null;
            setMode(MODES.OFF)
        },
        set(parts){
            this.go(makeURL(parts), !parts.path);
        },
        methods(){return locationMethods(this)},
        base: newbase => base=newbase
    }
}

function writeLocation(MODE, href, replace){
    !replace && (from=last);
       
    const setURL = (url) => history[`${replace ? 'replace' : 'push'}State`]({}, '', url);

    MODES.run( MODE,
        _ => setURL(base+href),
        _ => setURL(`#${href}`),
        _ => memoURL = href
    );
}

function readLocation(MODE){
    const l = window.location;
    const url = MODES.run( MODE,
        _ => (base ? l.pathname.replace(base,'') : l.pathname)+l.search+l.hash,
        _ => String(l.hash.slice(1)||'/'),
        _ => memoURL || '/'
    );

    const match = url.match(/^([^?#]+)(?:\?([^#]+))?(?:\#(.+))?$/);

    last=url;
  
    return {
        url,
        from,
        path: match[1] || '',
        query: parseQuery(match[2] || ''),
        hash: match[3] || '',
    };
}

function locationMethods(l){

    const getQ = ()=>l.get().query;
    const setQ = (v)=>l.set({query:v})
    const updQ = (fn)=>setQ(fn(getQ()));

    const getH = ()=>l.get().hash;
    const setH = (v)=>l.set({hash:v})

    return {
        hash: {
            get: getH,
            set: setH,
            clear: ()=>setH('')
        },
        query: {
            replace: setQ,
            clear: ()=>setQ(''),
            get(name){
                return name ? getQ()[name] : getQ();
            },
            set(name,v){
                updQ(q => (q[name]=v,q))
            },
            delete(name){
                updQ(q => ((q[name] && delete q[name]),q));
            }
        }
    }
}