import './style.css'
import './types.ts'

import { Buffer } from 'buffer'
window.Buffer = Buffer // Yep, this is a hack

import { run } from './lib/run.ts'
import { connection } from './connection.ts'
import { web3Provider } from './web3-provider.ts'

// Launch the tutorial app
connection()

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
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

  run(web3Provider).then(result => {
    outputContainer.innerHTML = JSON.stringify(result, null, 4)
  }).catch(error => {
    outputContainer.innerHTML = error.message
  }).finally(() => {
    runExampleBtn.innerHTML = 'Run example'
  })
})
