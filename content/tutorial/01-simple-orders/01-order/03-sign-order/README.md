---
title: Signing
---

Here we will build on the previous tutorial and sign the quote we got from the [quote tutorial](/tutorial/quote-order), so that we can place an order on CoW Protocol.

## Intents and signatures

CoW Protocol uses [intents](https://beta.docs.cow.fi/cow-protocol/reference/core/intents) to represent orders. An intent is a [signed message](https://beta.docs.cow.fi/cow-protocol/reference/core/signing-schemes). Most intents are signed using the [EIP-712](https://eips.ethereum.org/EIPS/eip-712) signing scheme, and this is what we will use in this tutorial.

## Signing an order

In the previous tutorial, we received an `OrderQuoteResponse` object. This object contains all the data that we need to sign an order.

### Types and utilities

For signing, we will use the `UnsignedOrder` type from the `SDK`, along with the `OrderSigningUtils` utility.

```typescript
/// file: run.ts
import type { Web3Provider } from '@ethersproject/providers';
+++import { OrderBookApi, SupportedChainId, OrderQuoteRequest, OrderQuoteSideKindSell, OrderSigningUtils, UnsignedOrder } from '@cowprotocol/cow-sdk';+++

export async function run(provider: Web3Provider): Promise<unknown> {
  // ...

  const order: UnsignedOrder = {
    ...quote,
    receiver: ownerAddress, // required due type mismatch
  }
}
```

> The `OrderQuoteResponse` type contains a `receiver` field, however the type of this field is not compatible with the `UnsignedOrder` type. This is why we need to override the `receiver` field with the `ownerAddress` (which is the address of the wallet we are using).

### Sign the order

Now that we have the `UnsignedOrder`, we can sign it:

```typescript
/// file: run.ts
import type { Web3Provider } from '@ethersproject/providers';
import { OrderBookApi, SupportedChainId, OrderQuoteRequest, OrderQuoteSideKindSell, OrderSigningUtils, UnsignedOrder } from '@cowprotocol/cow-sdk';

export async function run(provider: Web3Provider): Promise<unknown> {
  // ...

  return OrderSigningUtils.signOrder(order, chainId, signer);
}
```

## Run the code

To run the code, we can press the "Run" button in the bottom right panel (the web container).

When running the script, we may be asked to connect a wallet. We can use Rabby for this.

1. Accept the connection request in Rabby
2. Press the "Run" button again
3. Observe the `SigningResult` object returned to the output panel

An example signing result should look like:

```json
/// file: output.json
{
  "signature": "0x98ac143acad82e3908489ac8ca3f908cb49b0a861f15a51fc0a79bdea6dcca0212403f419ed8b022881a7cecf7358a69c2cfa9596e877fc67bea5be6d9981cf51b",
  "signingScheme": "eip712"
}
```

In the above case, we can see the `signature` returned is the `ECDSA` signature of the `EIP-712` hash of the `UnsignedOrder`. Now this can be used to place an order on CoW Protocol.