---
title: Cancelling off-chain
---

In the last tutorial, we submitted an order to CoW Protocol. In this tutorial, we will attempt to cancel the order we just submitted.

## Off-chain cancellation

One of the many advantages of CoW Protocol and the use of intents is that we can cancel orders for free, off-chain. This means that we do not need to pay any gas fees to cancel an order.

To cancel an order, we need to know the `orderUid` of the order we want to cancel. This is the unique identifier you received in the last tutorial.

### Instantiate the SDK

We will start from the basic setup from the [quote tutorial](/tutorial/quote) after we have instantiated the `OrderBookApi` and configured the `signer`.

### Cancellation parameters

Now that we have an instantiated `OrderBookApi`, we can cancel an order. To do this, we need to know:

- the `orderUid` of the order we want to cancel, for example `0x8464affce2df48b60f6976e51414dbc079e9c30ef64f4c1f78c7abe2c7f96a0c29104bb91ada737a89393c78335e48ff4708727e659523a1`

```typescript
/// file: run.ts
import type { Web3Provider } from '@ethersproject/providers';
import { SupportedChainId, OrderBookApi } from '@cowprotocol/cow-sdk';

export async function run(provider: Web3Provider): Promise<unknown> {
    // ...

    const orderUid = `0x8464affce2df48b60f6976e51414dbc079e9c30ef64f4c1f78c7abe2c7f96a0c29104bb91ada737a89393c78335e48ff4708727e659523a1`

    // ...
}
```

### Signing the cancellation

Just like we did in the [sign order tutorial](/tutorial/sign), we need to sign the cancellation. To do this, we will use the `OrderSigningUtils` utility.

```typescript
/// file: run.ts
import type { Web3Provider } from '@ethersproject/providers';
+++import { SupportedChainId, OrderBookApi, OrderSigningUtils } from '@cowprotocol/cow-sdk';+++

export async function run(provider: Web3Provider): Promise<unknown> {
    // ...

    const orderCancellationsSigningResult = await OrderSigningUtils.signOrderCancellations({
        [orderUid],
        chainId,
        signer
    });

    // ...
}
```

> The cancellation API endpoint for a single `orderUid` is marked deprecated. This is why we are using the plural version of the API endpoint (and hey, it's more efficient too!).

### Cancelling the order

Now that we have the signature, we can attempt to cancel the order:

```typescript
/// file: run.ts
import type { Web3Provider } from '@ethersproject/providers';
import { SupportedChainId, OrderBookApi, OrderSigningUtils } from '@cowprotocol/cow-sdk';

export async function run(provider: Web3Provider): Promise<unknown> {
    // ...

    try {
        const cancellationsResult = await orderBookApi.sendSignedOrderCancellations({
            ...orderCancellationsSigningResult,
            orderUids: [orderUid],
        })
    
        return { cancellationsResult }
    } catch (e) {
        return e
    }
}
```

Just as we did in the [submit order tutorial](/tutorial/submit-order), we are using a `try/catch` block to handle errors.

## Run the code

To run the code, we can press the "Run" button in the bottom right panel (the web container).

When running the script, we may be asked to connect a wallet. We can use Rabby for this.

1. Accept the connection request in Rabby
2. Press the "Run" button again
3. Observe the cancellation result returned to the output panel

A successful cancellation should look like:

```json
/// file: output.json
{
    "cancellationsResult": "Cancelled"
}
```

> The API simply returns `200` and `"Cancelled"` if the cancellation is successful.

### Errors

A couple of errors may easily result when running this code:

- **`OrderFullyExecuted`**: The order you are trying to cancel has already been fully executed. This means that the order has been fully filled and the funds have been transferred to the `receiver`.
