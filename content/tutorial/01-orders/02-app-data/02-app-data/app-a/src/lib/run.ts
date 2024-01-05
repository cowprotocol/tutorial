import type { Web3Provider } from '@ethersproject/providers'
import { MetadataApi } from '@cowprotocol/app-data'

export async function run(provider: Web3Provider): Promise<unknown> {
  const metadataApi = new MetadataApi()

  const appCode = '<YOUR_APP_CODE>'
  const environment = 'prod'
  const referrer = { address: `0x360Ba61Bc799edfa01e306f1eCCb2F6e0C3C8c8e` }

  const quote = { slippageBips: '0' } // Slippage percent, it's 0 to 100
  const orderClass = { orderClass: 'limit' } // "market" | "limit" | "liquidity"

  const appDataDoc = await metadataApi.generateAppDataDoc({
    appCode,
    environment,
    metadata: {
      referrer,
      quote,
      orderClass
    },
  })

  const { cid, appDataHex, appDataContent } = await metadataApi.appDataToCid(appDataDoc)

  return { appDataDoc, cid, appDataHex, appDataContent }
}
