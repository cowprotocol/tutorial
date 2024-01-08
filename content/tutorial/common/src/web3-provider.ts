import { Web3Provider } from '@ethersproject/providers'

export const web3Provider = window.ethereum ? new Web3Provider(window.ethereum) : null
