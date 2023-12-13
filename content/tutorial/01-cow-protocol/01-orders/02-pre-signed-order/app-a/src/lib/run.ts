import type { Web3Provider } from '@ethersproject/providers'
import { Contract } from '@ethersproject/contracts'
import { OrderBookApi, UnsignedOrder, OrderKind, SigningScheme } from '@cowprotocol/cow-sdk'
import { getSafeSdkAndKit } from './getSafeSdkAndKit'

import { SETTLEMENT_CONTRACT_ABI, SETTLEMENT_CONTRACT_ADDRESS } from './const'

export async function run(provider: Web3Provider): Promise<unknown> {
  const safeAddress = '<PUT_YOUR_SAFE_ADDRESS>'

  // Get chainId and account from the current provider
  const accounts = await provider.listAccounts()
  const account = accounts[0]
  const chainId = +(await provider.send('eth_chainId', []))

  // Create the CoW Protocol OrderBookApi instance
  const orderBookApi = new OrderBookApi({ chainId })

  // Create the CoW Protocol Settlement contract instance
  const settlementContract = new Contract(SETTLEMENT_CONTRACT_ADDRESS, SETTLEMENT_CONTRACT_ABI)

  // Create the Safe SDK and Safe API Kit instances
  const {safeApiKit, safeSdk} = await getSafeSdkAndKit(chainId, provider, safeAddress)

  // Create the order
  // Pay attention to the `signingScheme` field that is set to `SigningScheme.PRESIGN`
  const defaultOrder: UnsignedOrder = {
    receiver: safeAddress,
    buyAmount: '650942340000000000000',
    buyToken: '0x91056D4A53E1faa1A84306D4deAEc71085394bC8',
    sellAmount: '100000000000000000',
    sellToken: '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6',
    validTo: Math.round((Date.now() + 900_000) / 1000),
    appData: '0x',
    feeAmount: '0',
    kind: OrderKind.SELL,
    partiallyFillable: true,
    signingScheme: SigningScheme.PRESIGN,
  }
}
