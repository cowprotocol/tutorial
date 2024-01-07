import type { Web3Provider } from '@ethersproject/providers'
import { BigNumber, utils } from 'ethers'
import {
  SupportedChainId,
  OrderBookApi,
  SigningScheme,
  OrderQuoteRequest,
  OrderQuoteSideKindSell,
  OrderCreation,
  COW_PROTOCOL_SETTLEMENT_CONTRACT_ADDRESS,
} from '@cowprotocol/cow-sdk'
import { hashOrder, domain, Order } from '@cowprotocol/contracts'
import { MetadataApi, latest } from '@cowprotocol/app-data'
import { orderParametersToOrder } from '/src/lib/gpv2Order'

export async function run(provider: Web3Provider): Promise<unknown> {
    const chainId = +(await provider.send('eth_chainId', []));
    if (chainId !== SupportedChainId.GNOSIS_CHAIN) {
        await provider.send('wallet_switchEthereumChain', [{ chainId: SupportedChainId.GNOSIS_CHAIN }]);
    }
    const orderBookApi = new OrderBookApi({ chainId })
    const metadataApi = new MetadataApi()

    const appCode = 'Decentralized CoW'
    const environment = 'production'
    const referrer = { address: `0xcA771eda0c70aA7d053aB1B25004559B918FE662` }
    const quoteAppDoc: latest.Quote = { slippageBips: '50' }
    const orderClass: latest.OrderClass = { orderClass: 'limit' }

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

    const signSafeMessageHash = async (safeAddress: string, message: string): Promise<string> => {
        return await signer._signTypedData(
            { verifyingContract: safeAddress, chainId },
            { SafeMessage: [{ type: "bytes", name: "message" }] },
            { message }
        )
    };

    const safeAddress = '0x075E706842751c28aAFCc326c8E7a26777fe3Cc2'

    const sellAmount = '1000000000000000000';
    const sellToken = '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d';
    const buyToken = '0x177127622c4A00F3d409B75571e12cB3c8973d3c';

    const quoteRequest: OrderQuoteRequest = {
        sellToken,
        buyToken,
        receiver: safeAddress,
        sellAmountBeforeFee: sellAmount,
        kind: OrderQuoteSideKindSell.SELL,
        appData: appDataContent,
        appDataHash: appDataHex,
        from: ownerAddress,
        onchainOrder: true,
        signingScheme: SigningScheme.EIP1271,
    }

    const { quote } = await orderBookApi.getQuote(quoteRequest);

    const commonParams = {
        sellAmount,
        buyAmount: BigNumber.from(quote.buyAmount).mul(9950).div(10000).toString(),
        feeAmount: '0',
        partiallyFillable: true,    
    }

    const order: Order = orderParametersToOrder({
        ...quote,
        ...commonParams,
        appData: appDataHex,
    });

    const hash = hashOrder(
        domain(chainId, COW_PROTOCOL_SETTLEMENT_CONTRACT_ADDRESS[chainId]),
        order
    );
    const msg = utils.defaultAbiCoder.encode(['bytes32'], [hash]);
    const signature = await signSafeMessageHash(safeAddress, msg);

    const createOrder: OrderCreation = {
        ...quote,
        appData: appDataContent,
        appDataHash: appDataHex,
        from: safeAddress,
        signature,
        signingScheme: SigningScheme.EIP1271,
    }

    const orderUid = await orderBookApi.sendOrder(createOrder);

    return { orderUid }
}
