---
title: Viewing status
---

Now, you've submitted an order to CoW Protocol. In this tutorial, we will attempt to view the status of the order we just submitted.

## Viewing the status

With CoW Protocol, the only way to view the status of an order that has not yet been settled is to query the `OrderBookApi`. This is because the order is not yet on-chain, and therefore cannot be queried from the blockchain.

## Instantiate the SDK

We will start from the basic setup from the [quote tutorial](/tutorial/quote-order) after we have instantiated the `OrderBookApi`.

### Query parameters

Now that we have an instantiated `OrderBookApi`, we can query the status of an order. To do this, we need to know:

- the `orderUid` of the order we want to query, for example `0x8464affce2df48b60f6976e51414dbc079e9c30ef64f4c1f78c7abe2c7f96a0c29104bb91ada737a89393c78335e48ff4708727e659523a1`

```typescript
/// file: run.ts
import type { Web3Provider } from '@ethersproject/providers';
import { SupportedChainId, OrderBookApi } from '@cowprotocol/cow-sdk';

export async function run(provider: Web3Provider): Promise<unknown> {
  // ...
  const orderUid = `0x8464affce2df48b60f6976e51414dbc079e9c30ef64f4c1f78c7abe2c7f96a0c29104bb91ada737a89393c78335e48ff4708727e659523a1`;
  // ...
}
```

### Querying the order

In this tutorial, we will do two types of queries:

- `getOrder` to get general information about the order
- `getTrades` that will show us the trades that have been executed against the order

```typescript
/// file: run.ts
import type { Web3Provider } from '@ethersproject/providers';
import { SupportedChainId, OrderBookApi } from '@cowprotocol/cow-sdk';

export async function run(provider: Web3Provider): Promise<unknown> {
  // ...
    try {
        const order = await orderBookApi.getOrder(orderUid);
        const trades = await orderBookApi.getTrades({ orderUid });

        return {
            order,
            trades
        }
    } catch (e) {
        return e;
    }
  // ...
}
```

## Run the code

To run the code, we can press the "Run" button in the bottom right panel (the web container).

A successful query should look something like:

```json
/// file: output.json
{
    "order": { ... },
    "trades": [ ... ]
}
```

> The `order` and `trades` objects are quite large, so we have omitted them from this example.