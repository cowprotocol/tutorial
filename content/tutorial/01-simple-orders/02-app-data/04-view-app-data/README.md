---
title: Retrieve by appData hash
---

As with most things in the Order Book API, we can also view the app data that we have uploaded. This is done via the `getAppData` method on the `OrderBookApi` class.

Let's consider that we are browsing [CoW Explorer](https://explorer.cow.fi) and have come across an [order on *Gnosis Chain*](https://explorer.cow.fi/gc/orders/0x87ab37ea7d198aca414a0c1446aeba41e97be6c0c814ebe2b7005926dce09d26c40b42e0b02191b4ca09d6ed846abe578159fe5f6597f5b2):

```json
/// file: order.json
{
    "orderuId": "0x87ab37ea7d198aca414a0c1446aeba41e97be6c0c814ebe2b7005926dce09d26c40b42e0b02191b4ca09d6ed846abe578159fe5f6597f5b2",
}
```

Even though the CoW Explorer shows the extended app data document, for the sake of the tutorial let's assume that we do not have access to this document. Instead, we can use the `getAppData` method to retrieve the app data document from the Order Book API.

## Instantiate the SDK

We will start from a basic setup with the `OrderBookApi` class already instantiated. This has been populated in the code editor for you.

### Retrieving the app data

When looking at the order on CoW Explorer, we can see that the `appData` **hash** is `0x462ed5aa08a031342e30dcd1bc374da7ca9be2800ca7a87e43590880aa034554`.

We assign this to a variable and use it to query the Order Book API for the app data document.

```typescript
/// file: run.ts
import type { Web3Provider } from '@ethersproject/providers';
import { OrderBookApi, SupportedChainId } from '@cowprotocol/cow-sdk'

export async function run(provider: Web3Provider): Promise<unknown> {
    // ...
    +++const appDataHash = '0x462ed5aa08a031342e30dcd1bc374da7ca9be2800ca7a87e43590880aa034554';+++

    +++const appDataDoc = await orderBookApi.getAppData(appDataHash);+++
}
```

### Prettifying the output

The `appDataDoc` is a JSON object, that contains the `fullAppData` field, which in itself is simply the `appDataDoc` stringified. We can now interpret this using `JSON.parse` and `JSON.stringify` to prettify the output.

```typescript
/// file: run.ts
import type { Web3Provider } from '@ethersproject/providers';
import { OrderBookApi, SupportedChainId } from '@cowprotocol/cow-sdk'

export async function run(provider: Web3Provider): Promise<unknown> {
    // ...

    +++const fullAppData = JSON.parse(appDataDoc.fullAppData);+++

    return fullAppData;
}
```

## Run the code

To run the code, we can press the "Run" button in the bottom right panel (the web container).

1. Press the "Run" button
2. Observe the respective data returned to the output panel

An example output should look like:

```json
/// file: output.json
{
    "appCode": "CoW Swap-SafeApp",
    "environment": "production",
    "metadata": {
        "orderClass": {
            "orderClass": "twap"
        },
        "quote": {
            "slippageBips": "7500"
        }
    },
    "version": "0.11.0"
}
```