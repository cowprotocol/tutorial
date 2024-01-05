import type { Web3Provider } from '@ethersproject/providers'
import { MetadataApi, latest } from '@cowprotocol/app-data'

export async function run(provider: Web3Provider): Promise<unknown> {
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
  })

  const { appDataHex, appDataContent } = await metadataApi.appDataToCid(appDataDoc)

  return {
    appDataDoc,
    appDataHex,
    appDataContent
  }
}
