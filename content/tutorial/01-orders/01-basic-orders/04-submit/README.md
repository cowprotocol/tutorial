---
title: Submitting
---

Further building on the previous tutorial, we will now submit the order we signed in the [sign order tutorial](/tutorial/sign) to CoW Protocol.

## Submitting an order

Submitting orders to the API may very well result in an error. For this reason, we should **ALWAYS** handle errors. To do this, we will use the `try/catch` syntax.

```typescript
/// file: run.ts
import type { Web3Provider } from '@ethersproject/providers';
+++import { OrderBookApi, SupportedChainId, OrderQuoteRequest, OrderQuoteSideKindSell, OrderSigningUtils, UnsignedOrder, SigningScheme } from '@cowprotocol/cow-sdk';+++

export async function run(provider: Web3Provider): Promise<unknown> {
  // ...

    try {
        const orderId = await orderBookApi.sendOrder({
            ...quote,
            ...orderSigningResult,
            signingScheme: orderSigningResult.signingScheme as unknown as SigningScheme
        })
  
        return { orderId }    
    } catch (e) {
        return e
    }
}
```

> Currently the `OrderSigningResult` returns an enum which is not compatible with the `SigningScheme` type. This is why we need to cast it to `unknown` and then to `SigningScheme`.

## Run the code

To run the code, we can press the "Run" button in the bottom right panel (the web container).

When running the script, we may be asked to connect a wallet. We can use Rabby for this.

1. Accept the connection request in Rabby
2. Press the "Run" button again
3. Observe the `orderId` returned to the output panel

An example `orderId` should look like:

```json
/// file: output.json
{
    "orderId": "0xae842840f65743bc84190a68da1e4adf1771b242fa903b6c2e87bc5050e07c1329104bb91ada737a89393c78335e48ff4708727e65952d5e"
}
```

> The [`orderId`](https://beta.docs.cow.fi/cow-protocol/reference/contracts/core/settlement#orderuid) is the unique identifier for the order we have just submitted. We can use this `orderId` (also known as `orderUid`) to check the status of the order on [CoW Explorer](https://beta.docs.cow.fi/cow-protocol/tutorials/cow-explorer/order). Keep this handy, as we will practice some more with this `orderId` in the next tutorial!

### Errors

A couple of errors may easily result when running this code:

- **`InsufficientBalance`**: The wallet you have signed with does not have enough balance for the `sellToken`. A reminder in this example, the `sellToken` is `wxDai` on Gnosis chain.
- **`InsufficientAllowance`**: In this case, the wallet has enough balance, however you have missed out a step in the [approve tutorial](/tutorial/approve) and have not approved the `relayerAddress` to spend the `sellToken` on your behalf.
