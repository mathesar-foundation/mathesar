export default {
    HISTORY: 1,
    HASH: 2,
    MEMORY: 3,
    OFF: 4,
    run(mode,fnHistory,fnHash,fnMemory){
        return mode === this.HISTORY 
            ? fnHistory && fnHistory()
            : mode === this.HASH
                ? fnHash && fnHash()
                : fnMemory && fnMemory()
    },
    getDefault(){
        return !window || window.location.pathname === 'srcdoc' ? this.MEMORY : this.HISTORY;
    }
}