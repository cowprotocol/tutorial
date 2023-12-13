import type { Web3Provider } from '@ethersproject/providers'
import { OrderSigningUtils, UnsignedOrder, OrderKind } from '@cowprotocol/cow-sdk'

export async function run(provider: Web3Provider): Promise<unknown> {
  const accounts = await provider.listAccounts()
  const account = accounts[0]

  const chainId = +(await provider.send('eth_chainId', []))

  const order: UnsignedOrder = {
    sellToken: '0x6b175474e89094c44da98b954eedeac495271d0f',
    buyToken: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    receiver: account,
    sellAmount: '2',
    buyAmount: '1',
    validTo: Math.round((Date.now() + 200_000) / 1000),
    appData: '0x',
    feeAmount: '0',
    kind: OrderKind.SELL,
    partiallyFillable: false,
  }

  const signer = provider.getSigner()

  return OrderSigningUtils.signOrder(order, chainId, signer)
}
