export function connection() {
    ping()

    setInterval(ping, 200)
}

function ping() {
    window.parent.postMessage({type: 'ping'}, '*')
    // window.parent.postMessage({type: 'path', path: '/'}, '*')
}
