import type { Web3Provider } from '@ethersproject/providers'
import { MetadataApi, latest } from '@cowprotocol/app-data'
import { OrderBookApi, SupportedChainId } from '@cowprotocol/cow-sdk'

export async function run(provider: Web3Provider): Promise<unknown> {
  const chainId = +(await provider.send('eth_chainId', []));
  if (chainId !== SupportedChainId.GNOSIS_CHAIN) {
    throw new Error(`Please connect to the Gnosis chain. ChainId: ${chainId}`);
  }

  const orderBookApi = new OrderBookApi({ chainId: SupportedChainId.GNOSIS_CHAIN });
  const metadataApi = new MetadataApi()

  const appCode = 'Decentralized CoW'
  const environment = 'production'
  const referrer = { address: `0xcA771eda0c70aA7d053aB1B25004559B918FE662` }

  const quoteAppDoc: latest.Quote = { slippageBips: '50' }
  const orderClass: latest.OrderClass = { orderClass: 'market' }

  const appDataDoc = await metadataApi.generateAppDataDoc({
    appCode,
    environment,
    metadata: {
      referrer,
      quote: quoteAppDoc,
      orderClass
    },
  });

  const { appDataHex, appDataContent } = await metadataApi.appDataToCid(appDataDoc);

  const fullAppData = await orderBookApi.uploadAppData(appDataHex, appDataContent);

  return { fullAppData }
}
