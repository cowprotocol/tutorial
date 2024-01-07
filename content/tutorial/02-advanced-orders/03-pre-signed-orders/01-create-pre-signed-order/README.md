---
title: Creating order
---

There are two types of wallets:
 - EOA (externally owned account) wallets, which are controlled by a private key
 - Smart contract wallets, which are controlled by a smart contract

Since smart contract wallets, such as [`Safe`](https://safe.global) are controlled by a smart contract, they can't sign transactions using [`EIP-712`](https://beta.docs.cow.fi/cow-protocol/reference/core/signing-schemes#eip-712). However, CoW Protocol supports smart contract wallets by allowing them to sign using:
- [`EIP-1271`](https://beta.docs.cow.fi/cow-protocol/reference/core/signing-schemes#eip-1271)
- [`PRESIGN`](https://beta.docs.cow.fi/cow-protocol/reference/core/signing-schemes#presign)

This tutorial will show you how to create an order using `PreSign` signing scheme, using a `Safe` wallet. It is assumed that you have a `Safe` wallet with at least one owner, and that the `owner` is the account you're using to run the tutorial.

> While this tutorial demonstrates how to create an order using `PreSign` from a `Safe` wallet, you can use any smart contract, including one you create yourself.

## Required dependencies

For pre-signed orders, we need to use:
- `OrderBookApi` to get a quote send an order to the CoW Protocol order book
- `MetadataApi` to generate order meta data
- `Safe` to create and sign the transaction to the Settlement contract
- `SafeApiKit` to propose the transaction to Safe owners

## Contract (`GPv2Settlement`) interaction

For interacting with contracts, the tutorials use [ethers.js](https://docs.ethers.io/v5/).

To interact with a contract, we need to know:

- the contract address
- the ABI

> As we're going to be sending the transaction from a `Safe` wallet, in this case we don't need to connect to the contract with a `signer`, and just a `provider` is enough.

### Contract address

`GPv2Settlement` is a core contract and it's deployed on each supported network. Core contracts deployment addresses can be found in the [CoW Protocol docs](https://beta.docs.cow.fi/cow-protocol/reference/contracts/core).

This is such a common use case that the SDK provides an export for the `GPv2Settlement` contract address:

```typescript
/// file: run.ts
import type { Web3Provider } from '@ethersproject/providers'
import {
  SupportedChainId,
  OrderBookApi,
  COW_PROTOCOL_SETTLEMENT_CONTRACT_ADDRESS,
} from '@cowprotocol/cow-sdk'
import { MetadataApi, latest } from '@cowprotocol/app-data'

export async function run(provider: Web3Provider): Promise<unknown> {
  // ...
}
```

### `GPv2Settlement` ABI

We can retrieve the ABI for the `GPv2Settlement` contract from the contract's verified code on [Gnosisscan](https://gnosisscan.io/address/0x9008D19f58AAbD9eD0D60971565AA8510560ab41#code). We're just going to be using the `setPreSignature` function from the `GPv2Settlement` contract, so we can define that as a `const`:

```typescript
/// file: run.ts
import type { Web3Provider } from '@ethersproject/providers'
import {
  SupportedChainId,
  OrderBookApi,
  COW_PROTOCOL_SETTLEMENT_CONTRACT_ADDRESS,
} from '@cowprotocol/cow-sdk'
import { MetadataApi, latest } from '@cowprotocol/app-data'

export async function run(provider: Web3Provider): Promise<unknown> {
  // ...
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
  // ...
}
```

### `Safe` wallet

This tutorial uses the [`Safe`](https://safe.global) wallet to sign the transaction to the `GPv2Settlement` contract. To interact with the `Safe` wallet, we need:

- an owner's wallet
- the `Safe` SDK
- the `Safe` address

#### Helper functions

To make the code more readable, we are going to define helper functions that:

- provide retrievable transaction service URLs by chain ID
- retrieve instances of the `Safe` SDK and the `safeApiKit`
- propose a given transaction to a `Safe`

##### Transaction service URLs

This is relatively simple and we can just define a `const`:

```typescript
/// file: run.ts
// ...
export async function run(provider: Web3Provider): Promise<unknown> {
  // ...
 
  const SAFE_TRANSACTION_SERVICE_URL: Record<SupportedChainId, string> = {
    [SupportedChainId.MAINNET]: 'https://safe-transaction-mainnet.safe.global',
    [SupportedChainId.GNOSIS_CHAIN]: 'https://safe-transaction-gnosis-chain.safe.global',
    [SupportedChainId.GOERLI]: 'https://safe-transaction-goerli.safe.global',
  }

  // ...
}
```

##### `Safe` SDK and `safeApiKit`

```typescript
/// file: run.ts
import type { Web3Provider } from '@ethersproject/providers'
+++import { ethers } from 'ethers'+++
import {
  SupportedChainId,
  OrderBookApi,
} from '@cowprotocol/cow-sdk'
import { MetadataApi, latest } from '@cowprotocol/app-data'
+++import { MetaTransactionData } from '@safe-global/safe-core-sdk-types'+++
+++import Safe, { EthersAdapter } from '@safe-global/protocol-kit'+++
+++import SafeApiKit from '@safe-global/api-kit'+++

export async function run(provider: Web3Provider): Promise<unknown> {
  // ...
  const getSafeSdkAndKit = async (safeAddress: string) => {
    const ethAdapter = new EthersAdapter({ ethers, signerOrProvider: signer })
    const txServiceUrl = SAFE_TRANSACTION_SERVICE_URL[chainId]
    const safeApiKit = new SafeApiKit({ txServiceUrl, ethAdapter })
  
    const safeSdk = await Safe.create({ethAdapter, safeAddress});

    return { safeApiKit, safeSdk }
  }
  // ...
}
```

The above function returns an object with the `safeApiKit` and the `safeSdk` instances, initialized with the `signer` and a nominated `safeAddress`.

##### Propose transaction to `Safe`

```typescript
/// file: run.ts
// ...

export function run(provider: Web3Provider): Promise<unknown> {
  // ...

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

  // ...
}
```

The above function takes a `MetaTransactionData` object (i.e. `to`, `value`, `data` tuple) and then creates, signs and sends the transaction to the `Safe` wallet. It returns the `safeTxHash` and the `senderSignature`.

#### `Safe` address

The `Safe` address is the address of the smart contract wallet that we're going to be using to make the trade. Replace the `safeAddress` with the address of your `Safe` wallet:

```typescript
/// file: run.ts
// ...

export async function run(provider: Web3Provider): Promise<unknown> {
  // ...
  const safeAddress = '0x075E706842751c28aAFCc326c8E7a26777fe3Cc2'
  // ...
}
```

### Contract instance

Now that we have the contract address and the ABI, we can create the contract instance. As we are just going to be ABI encoding the `setPreSignature` function, we don't need to connect to the contract with a `signer` or a `provider`:

```typescript
/// file: run.ts
// ...

export async function run(provider: Web3Provider): Promise<unknown> {
  // ...
  const settlementContract = new Contract(COW_PROTOCOL_SETTLEMENT_CONTRACT_ADDRESS[chainId], abi)
  // ...
}
```

### Connect to the Safe

Now that we have the `Safe` address and associated helper functions, we can connect to the `Safe`:

```typescript
/// file: run.ts
// ...

export async function run(provider: Web3Provider): Promise<unknown> {
  // ...
  const { safeApiKit, safeSdk } = await getSafeSdkAndKit(safeAddress)
  // ...
}
```

### Get a quote

As per normal, we are going to request a quote to buy COW tokens with wxDAI using `OrderBookApi`:

```typescript
/// file: run.ts
// ...
import {
  SupportedChainId,
  OrderBookApi,
+++  SigningScheme,+++
+++  OrderQuoteRequest,+++
+++  OrderQuoteSideKindSell,+++
+++  OrderCreation,+++
  COW_PROTOCOL_SETTLEMENT_CONTRACT_ADDRESS
} from '@cowprotocol/cow-sdk'
// ...

export function run(provider: Web3Provider): Promise<unknown> {
  // ...
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
  // ...
}
```

### Submit the order

Now that we have the quote, we can submit the order to the order book. As we're using `PreSign`, we need to pay special attention to the fields: 

- `from`: the address of the `Safe` wallet
- `signature`: empty bytes, i.e. `0x`
- `signingScheme`: `SigningScheme.PRESIGN`

```typescript
/// file: run.ts
// ...
+++import { BigNumber, Contract, ethers } from 'ethers'+++
// ...

export function run(provider: Web3Provider): Promise<unknown> {
  // ...
  const order: OrderCreation = {
    ...quote,
    sellAmount,
    buyAmount: BigNumber.from(quote.buyAmount).mul(9950).div(10000).toString(),
    feeAmount: '0',
    appData: appDataContent,
    appDataHash: appDataHex,
    partiallyFillable: true,
    +++from: safeAddress,+++
    +++signature: '0x',+++
    +++signingScheme: SigningScheme.PRESIGN,+++
  }

  const orderUid = await orderBookApi.sendOrder(order)
  // ...
}
```
> The above applies a 0.5% slippage to the order.

> This is the first instance demonstrating the use of a `limit` order. This is done by setting the `feeAmount` to `0`. **Caution**: Ensure that you have set the metadata order class to `limit` otherwise the order will be rejected.

At this stage, the order is created in the order book, but it is not valid (it will show as 'Signing' in the [Explorer](https://explorer.cow.fi/)). To make the order valid, we need to create a transaction to the `GPv2Settlement` contract that sets the pre-signature (i.e. `setPreSignature`).

### Sign the order

Now that we have the `orderUid`, we can create the transaction to the `GPv2Settlement` contract to set the pre-signature:

```typescript
/// file: run.ts
// ...

export function run(provider: Web3Provider): Promise<unknown> {
  // ...
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
```

In the above code, we:

- encode the `setPreSignature` function with the `orderUid` and `true` (i.e. `signed`)
- populate the transaction for the `Safe` wallet (i.e. `to` to call the `GPv2Settlement` contract, `value` to `0` and `data` to the encoded `setPreSignature` function)
- propose the transaction to the `Safe` wallet

## Run the code

To run the code, we can press the "Run" button in the bottom right panel (the web container).

When running the script, we may be asked to connect a wallet. We can use Rabby for this.

1. Accept the connection request in Rabby
2. Press the "Run" button again
3. Observe the `orderUid`, `safeTxHash` and `senderSignature` in the output panel
4. Browse to your `Safe` wallet and confirm the transaction
5. On successful confirmation of the transaction, the order will be valid and can be filled

The output should look similar to:

```json
/// file: output.json
{
    "orderUid": "0x83b53f9252440ca4b5e78dbbff309c90149cd4789efcef5128685c8ac35d3f8d075e706842751c28aafcc326c8e7a26777fe3cc2659ae2e7",
    "safeTxHash": "0x86d38bed8d424ccae082090407040741e7683487343611a016a47430c0e1a2a6",
    "senderSignature": "0x67675bf119b7d850f7d2daf814c921aa4f3a1202e83121002a73935bb7d89ad9397508a4067dde81f5653604130bb7b5d2d92f712354389cdb478d4dca751d1b1b"
}
```

Keep the `orderUid` around for the next tutorial!