import type { Web3Provider } from '@ethersproject/providers'
import { OrderBookApi, SupportedChainId } from '@cowprotocol/cow-sdk'

export async function run(provider: Web3Provider): Promise<unknown> {
  const orderBookApi = new OrderBookApi({ chainId: SupportedChainId.GNOSIS_CHAIN });

  const appDataHash = '0x462ed5aa08a031342e30dcd1bc374da7ca9be2800ca7a87e43590880aa034554';

  const appDataDoc = await orderBookApi.getAppData(appDataHash);

  const fullAppData = JSON.parse(appDataDoc.fullAppData)

  return fullAppData;
}
