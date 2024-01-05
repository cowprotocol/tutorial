---
title: Eth-Flow
---

There are two types of wallets:
 - EOA (externally owned account) wallets, which are controlled by a private key
 - Smart contract wallets, which are controlled by a smart contract

Since smart contract wallets are controlled by a smart contract, they can't sign transactions using `EIP-712`.
Anyway, CoW Protocol supports smart contract wallets by allowing them to create pre-signed orders.
The key of pre-signed orders is a transaction to Settlement contract that proves the ownership of an order.

In this example we will create a pre-signed order using Safe, but you can use any smart contract wallet.

## Required dependencies

For pre-signed orders, we need to use:
 - `OrderBookApi` to send an order to the CoW Protocol order-book
 - `MetadataApi` to generate order meta data
 - `Safe` to create and sign the transaction to the Settlement contract
 - `SafeApiKit` to propose the transaction to Safe owners

## Define the order parameters

First of all, we should define the order parameters.
The description of each parameter can be found in the [Order structure docs.](https://TODO)

```
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
  +++signingScheme: SigningScheme.PRESIGN+++
}
```

> `signingScheme` is the only difference between a regular order and a pre-signed order

## Order meta data

For analytics purposes, we can add some metadata to the order.
The metadata is a JSON document that is stored in IPFS and referenced by the order.
The metadata is optional, but it's recommended to add it.
After order creation, the metadata will be displayed in [the Explorer](https://explorer.cow.fi/).

```
const appCode = '<YOUR_APP_CODE>'
const environment = 'prod'

// Slippage percent, it's 0 to 100
const quote = { slippageBips: '50' }

// "market" | "limit" | "liquidity"
const orderClass = { orderClass: 'limit' }

// Generate the app-data document
const appDataDoc = await metadataApi.generateAppDataDoc({
  appCode,
  environment,
  metadata: {
    quote,
    orderClass
  },
})

const +++{ appDataHex, appDataContent }+++ = await metadataApi.appDataToCid(appDataDoc)
```

## Post the order to the order-book

Having the order and the metadata, we can post the order to the order-book.  
`orderId` is the ID of the order in the order-book, and it's a key for the Settlement contract transaction.

```
const orderCreation: OrderCreation = {
  ...defaultOrder,
  from: safeAddress,
  signature: safeAddress,
  appData: appDataContent,
  appDataHash: appDataHex,
}

// Send order to CoW Protocol order-book
const +++orderId+++ = await orderBookApi.sendOrder(orderCreation)
```

## Create the transaction to the Settlement contract

In the previous step, we created an order in the order-book, but it's not valid yet.
To make it valid, we need to create a transaction to the Settlement contract that proves the ownership of the order.

```
// Create the pre-signature transaction
const presignCallData = settlementContract.interface.encodeFunctionData(+++'setPreSignature'+++, [
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

// Send the pre-signed transaction to the Safe
await +++safeApiKit.proposeTransaction+++({
  safeAddress,
  safeTransactionData: signedSafeTx.data,
  safeTxHash,
  senderAddress: account,
  senderSignature,
})
```

## Sign and execute transaction

After the transaction is proposed to the Safe, the Safe owners should sign and execute it.
After the transaction is executed, the order will be valid and can be filled.
