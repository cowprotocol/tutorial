import type { Web3Provider } from '@ethersproject/providers'
import { Contract } from '@ethersproject/contracts'
import { OrderBookApi, UnsignedOrder, OrderKind, SigningScheme, OrderCreation } from '@cowprotocol/cow-sdk'
import { getSafeSdkAndKit } from './getSafeSdkAndKit'

import { APP_DATA, APP_DATA_HASH, SETTLEMENT_CONTRACT_ABI, SETTLEMENT_CONTRACT_ADDRESS } from './const'

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

  // Add all necessary fields to the order creation request
  const orderCreation: OrderCreation = {
    ...defaultOrder,
    from: safeAddress,
    signature: safeAddress,
    appData: APP_DATA,
    appDataHash: APP_DATA_HASH,
  }

  // Send order to CoW Protocol order-book
  const orderId = await orderBookApi.sendOrder(orderCreation)

  // Create the pre-signature transaction
  const presignCallData = settlementContract.interface.encodeFunctionData('setPreSignature', [
    orderId,
    true,
  ])
  const presignRawTx = {
    to: settlementContract.address,
    data: presignCallData,
    value: '0',
  }

  // Send pre-signature transaction to settlement contract
  // In this example we are using the Safe SDK, but you can use any other smart-contract wallet
  const safeTx = await safeSdk.createTransaction({safeTransactionData: presignRawTx})
  const signedSafeTx = await safeSdk.signTransaction(safeTx)
  const safeTxHash = await safeSdk.getTransactionHash(signedSafeTx)
  const senderSignature = signedSafeTx.signatures.get(account.toLowerCase())?.data || ''

  await safeApiKit.proposeTransaction({
    safeAddress,
    safeTransactionData: signedSafeTx.data,
    safeTxHash,
    senderAddress: account,
    senderSignature,
  })

  return { orderId, safeTxHash, senderSignature }
}
