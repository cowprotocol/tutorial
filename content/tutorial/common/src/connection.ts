/**
 * The app periodically pings the tutorial app to check if it is still alive
 * See Output.svelte
 */
export function connection() {
    ping()

    setInterval(ping, 200)
}

function ping() {
    window.parent.postMessage({type: 'ping'}, '*')
    // window.parent.postMessage({type: 'path', path: '/'}, '*')
}
