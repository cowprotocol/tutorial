import type { Web3Provider } from '@ethersproject/providers'
import { OrderBookApi, SupportedChainId } from '@cowprotocol/cow-sdk'

export async function run(provider: Web3Provider): Promise<unknown> {
  const orderBookApi = new OrderBookApi({ chainId: SupportedChainId.GNOSIS_CHAIN });
}
