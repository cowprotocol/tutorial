import type { Web3Provider } from '@ethersproject/providers'
import {
  OrderBookApi,
  SupportedChainId,
  OrderQuoteRequest,
  OrderQuoteSideKindSell,
  OrderSigningUtils,
  UnsignedOrder,
  SigningScheme
} from '@cowprotocol/cow-sdk'
import { MetadataApi, latest } from '@cowprotocol/app-data'

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
  })

  const { appDataHex, appDataContent } = await metadataApi.appDataToCid(appDataDoc)

  const signer = provider.getSigner();
  const ownerAddress = await signer.getAddress();

  const sellToken = '0xe91d153e0b41518a2ce8dd3d7944fa863463a97d'; // wxDAI
  const buyToken = '0x177127622c4A00F3d409B75571e12cB3c8973d3c'; // COW
  const sellAmount = '1000000000000000000'; // 1 wxDAI

  const quoteRequest: OrderQuoteRequest = {
    sellToken,
    buyToken,
    from: ownerAddress,
    receiver: ownerAddress,
    sellAmountBeforeFee: sellAmount,
    kind: OrderQuoteSideKindSell.SELL,
  };

  const { quote } = await orderBookApi.getQuote(quoteRequest);

  const order: UnsignedOrder = {
    ...quote,
    receiver: ownerAddress,
  }

  const orderSigningResult = await OrderSigningUtils.signOrder(
    order,
    chainId,
    signer
  )

  try {
    const orderId = await orderBookApi.sendOrder({
      ...quote,
      ...orderSigningResult,
      signingScheme: orderSigningResult.signingScheme as unknown as SigningScheme
    })

    return {
      orderId,
    }
  } catch (e) {
    return e
  }
}
