import type { Web3Provider } from '@ethersproject/providers'
import { BigNumber, Contract, ethers } from 'ethers'
import {
  SupportedChainId,
  OrderBookApi,
  SigningScheme,
  OrderQuoteRequest,
  OrderQuoteSideKindSell,
  OrderCreation,
  COW_PROTOCOL_SETTLEMENT_CONTRACT_ADDRESS
} from '@cowprotocol/cow-sdk'
import { MetadataApi, latest } from '@cowprotocol/app-data'
import { MetaTransactionData } from '@safe-global/safe-core-sdk-types'
import Safe, { EthersAdapter } from '@safe-global/protocol-kit'
import SafeApiKit from '@safe-global/api-kit'

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

  const abi = [
    {
      "inputs": [
        { "internalType": "bytes", "name": "orderUid", "type": "bytes" },
        { "internalType": "bool", "name": "signed", "type": "bool" }
      ],
      "name": "setPreSignature",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ]
 
  const SAFE_TRANSACTION_SERVICE_URL: Record<SupportedChainId, string> = {
    [SupportedChainId.MAINNET]: 'https://safe-transaction-mainnet.safe.global',
    [SupportedChainId.GNOSIS_CHAIN]: 'https://safe-transaction-gnosis-chain.safe.global',
    [SupportedChainId.GOERLI]: 'https://safe-transaction-goerli.safe.global',
  }
  
  const getSafeSdkAndKit = async (safeAddress: string) => {
    const ethAdapter = new EthersAdapter({ ethers, signerOrProvider: signer })
    const txServiceUrl = SAFE_TRANSACTION_SERVICE_URL[chainId]
    const safeApiKit = new SafeApiKit({ txServiceUrl, ethAdapter })
  
    const safeSdk = await Safe.create({ethAdapter, safeAddress});

    return { safeApiKit, safeSdk }
  }

  const proposeSafeTx = async (params: MetaTransactionData) => {
    const safeTx = await safeSdk.createTransaction({safeTransactionData: params})
    const signedSafeTx = await safeSdk.signTransaction(safeTx)
    const safeTxHash = await safeSdk.getTransactionHash(signedSafeTx)
    const senderSignature = signedSafeTx.signatures.get(ownerAddress.toLowerCase())?.data || ''
  
    // Send the pre-signed transaction to the Safe
    await safeApiKit.proposeTransaction({
      safeAddress,
      safeTransactionData: signedSafeTx.data,
      safeTxHash,
      senderAddress: ownerAddress,
      senderSignature,
    })

    return { safeTxHash, senderSignature }
  }

  const safeAddress = '0x075E706842751c28aAFCc326c8E7a26777fe3Cc2'
  const settlementContract = new Contract(COW_PROTOCOL_SETTLEMENT_CONTRACT_ADDRESS[chainId], abi)

  const { safeApiKit, safeSdk } = await getSafeSdkAndKit(safeAddress)

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
  }

  const { quote } = await orderBookApi.getQuote(quoteRequest);

  const order: OrderCreation = {
    ...quote,
    sellAmount,
    buyAmount: BigNumber.from(quote.buyAmount).mul(9950).div(10000).toString(),
    feeAmount: '0',
    appData: appDataContent,
    appDataHash: appDataHex,
    partiallyFillable: true,
    from: safeAddress,
    signature: '0x',
    signingScheme: SigningScheme.PRESIGN,
  }

  const orderUid = await orderBookApi.sendOrder(order)

  const presignCallData = settlementContract.interface.encodeFunctionData('setPreSignature', [
    orderUid,
    true,
  ])

  const presignRawTx: MetaTransactionData = {
    to: settlementContract.address,
    value: '0',
    data: presignCallData,
  }

  const { safeTxHash, senderSignature } = await proposeSafeTx(presignRawTx)

  return { orderUid, safeTxHash, senderSignature }
}
