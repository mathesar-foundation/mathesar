import {getContext} from 'svelte';
import {writable} from 'svelte/store';
import {getAttr,getRouteMatch} from './lib';
import {location} from './location';
import {meta} from './tinro';  /* DEPRECATED */
import MODES from './modes';

export const router = routerStore();

function routerStore(){

    const {subscribe} = writable(location.get(), set => {
        location.start(set);
        let un = aClickListener(location.go)
        return ()=>{
            location.stop();
            un();
        }
    });

    return {
        subscribe,
        goto: location.go,
        params: getParams, /* DEPRECATED */
        meta: meta, /* DEPRECATED */
        useHashNavigation: s => location.mode(s ? MODES.HASH : MODES.HISTORY), /* DEPRECATED */
        mode: {
            hash: ()=>location.mode(MODES.HASH),
            history: ()=>location.mode(MODES.HISTORY),
            memory: ()=>location.mode(MODES.MEMORY),
        },
        base: location.base,
        location: location.methods()
    }
}

export function active(node){
    let href;
    let exact;
    let cl;
    let current;

    const getAttributes = () => {
        href = getAttr(node,'href').replace(/^\/#|[?#].*$|\/$/g,''),
        exact = getAttr(node,'exact',true),
        cl = getAttr(node,'active-class',true,'active');
    }

    const matchLink = ()=>{
        const match = getRouteMatch(href,current); 
        match && (match.exact && exact || !exact) ? node.classList.add(cl) : node.classList.remove(cl);
    }

    getAttributes();
          
    return {
        destroy: router.subscribe(r => {current = r.path; matchLink()}),
        update: () => { getAttributes(); matchLink()}
    }
}

function aClickListener(go){
    const h = e => {
        const a = e.target.closest('a[href]');
        const target = a  && getAttr(a,'target',false,'_self');
        const ignore = a  && getAttr(a,'tinro-ignore');
        const key = e.ctrlKey || e.metaKey || e.altKey || e.shiftKey;

        if(target == '_self' && !ignore && !key && a){
            const href = a.getAttribute('href').replace(/^\/#/,'');

            if(!/^\/\/|^#|^[a-zA-Z]+:/.test(href)) {
                e.preventDefault();
                go(href.startsWith('/') ? href : a.href.replace(window.location.origin,''));
            }
        }
    }

    addEventListener('click', h);
    return () => removeEventListener('click', h);
}

/* DEPRECATED */
function getParams(){
    return getContext('tinro').meta.params;
}

