import { Web3Provider } from '@ethersproject/providers'

export const web3Provider = new Web3Provider(window.ethereum)

// Connect to injected wallet
window.ethereum?.enable()
