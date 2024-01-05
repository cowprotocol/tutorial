---
title: Upload to the API
---

In the last tutorial we showed how to create an order with app data. There are however times when you may want to create an order but you do not have access at that time to the extended app data document, i.e. you only have the **hash** of the `appData`.

A concrete example of this is if you are using a programmatic order, where the `appData` hash is stored in the contract and/or passed back to a watch-tower for execution. In this case, the watch-tower may not have access to the extended app data document, but it does have access to the hash. To allow for this case, we can upload the app data to the Order Book API before the watch-tower relays the order to the Order Book API.

## Instantiate the SDK

We will start from the basic setup from the [quote order](/tutorial/quote-order) tutorial and the [simple app data](/tutorial/simple-app-data) tutorial. This has been populated in the code editor for you. 

### Uploading the app data

To upload the app data using the Order Book API, we simply use the handy `OrderBookApi` class. This class has a `uploadAppData` method which takes the `appData` hash and returns the `appData` document.

```typescript
/// file: run.ts
import type { Web3Provider } from '@ethersproject/providers';
import { MetadataApi, latest } from '@cowprotocol/app-data';
import { OrderBookApi, SupportedChainId } from '@cowprotocol/cow-sdk'

export async function run(provider: Web3Provider): Promise<unknown> {
    // ...
    const { appDataHex, appDataContent } = await metadataApi.appDataToCid(appDataDoc);

    +++const fullAppData = await orderBookApi.uploadAppData(appDataHex, appDataContent);+++

    return { fullAppData }
}
```

> Despite the name, `fullAppData` is actually just the **appData hash** that is returned from the API.

## Run the code

To run the code, we can press the "Run" button in the bottom right panel (the web container).

1. Press the "Run" button
2. Observe the respective data returned to the output panel

An example output should look like:

```json
/// file: output.json
{
    "fullAppData": "0xe63428d06deb873ea243dc8fee366c3ef51933770e6c5e121669ed78deaf6a5e"
}
```

Therefore, if we were to sign manually (or via a contract), for the `appData` field we could use `0xe63428d06deb873ea243dc8fee366c3ef51933770e6c5e121669ed78deaf6a5e`.
