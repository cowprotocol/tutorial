import './style.css'
import './types.ts'

import { Buffer } from 'buffer'
window.Buffer = Buffer // Yep, this is a hack

import { run } from './lib/run.ts'
import { web3Provider } from './web3-provider.ts'

function ping() {
  window.parent.postMessage({type: 'ping'}, '*')
}

/**
 * The app periodically pings the tutorial app to check if it is still alive
 * See Output.svelte
 */
ping();
setInterval(ping, 200);

/**
 * Check if the user is connected to the wallet
 */
(async function(){
  const appContainer = document.querySelector<HTMLDivElement>('#app')!

  // There is no injected wallet in the browser
  if (!web3Provider) {
    appContainer.innerHTML = `
      <p>Please, install some injected browser wallet first. For example: Rabby, Metamask</p>
    `
    return
  }

  const accounts = await web3Provider.listAccounts()

  // Wallet is already connected
  if (accounts.length) {
    initExercise(appContainer)
    return
  }

  // Wallet is not connected
  appContainer.innerHTML = `
      <p>Connect your wallet to continue</p>
      <button id="connectWallet">Connect wallet</button>
    `

  connectWallet(appContainer)

  return
})()

function initExercise(appContainer: HTMLDivElement) {
  appContainer.innerHTML = `
      <button id="runExample">Run example</button>
      <br/>
      <p>Output:</p>
      <textarea id="outputContainer" readonly></textarea>
    `

  const runExampleBtn = document.querySelector<HTMLButtonElement>('#runExample')!
  const outputContainer = document.querySelector<HTMLTextAreaElement>('#outputContainer')!

  // Launch exercise
  runExampleBtn.addEventListener('click', async () => {
    runExampleBtn.innerHTML = 'Running...'

    run(web3Provider!).then(result => {
      outputContainer.innerHTML = JSON.stringify(result, null, 4)
    }).catch(error => {
      outputContainer.innerHTML = error.message
    }).finally(() => {
      runExampleBtn.innerHTML = 'Run example'
    })
  })
}

function connectWallet(appContainer: HTMLDivElement) {
  const connectWalletBtn = document.querySelector<HTMLButtonElement>('#connectWallet')!

  connectWalletBtn.addEventListener('click', () => {
    window.ethereum!.enable().then(() => {
      initExercise(appContainer)
    })
  })
}
