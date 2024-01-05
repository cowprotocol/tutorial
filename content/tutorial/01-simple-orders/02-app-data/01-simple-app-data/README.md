---
title: Simple app data
---

So, we have created a simple order in the previous section, but what if you're a wallet provider, and you want to add some extra data to the order? For example, you may want to associate the order with your app in order to brag about how many orders on CoW Protocol are created by your app.

## `app-data` SDK

The `app-data` is documented in [JSON Schema](https://beta.docs.cow.fi/cow-protocol/reference/core/intents/app-data#schema). Writing to a schema is not very convenient, so we have a special SDK for that. It's called the `app-data` SDK.

To install it, run: `npm install @cowprotocol/app-data`

> It is highly suggested to use the `app-data` SDK to generate the `app-data` document. There are many subtle nuances to the `app-data` document, making it easy to get wrong.

### Instantiate the SDK

To instantiate the SDK, we simply call it's constructor:

```typescript
/// file: run.ts
import type { Web3Provider } from '@ethersproject/providers';
+++import { MetadataApi } from '@cowprotocol/app-data';+++

export async function run(provider: Web3Provider): Promise<unknown> {
    // ...
    const metadataApi = new MetadataApi();
    // ...
}
```

### App data parameters

As an example, if we were developing a wallet, we may want to add some metadata to the order. In doing so, we will provide:

- `appCode` - the name of our app
- `environment` - the environment we're running on (e.g. `prod`, `staging`)
- `referrer` - the ethereum address for the referrer of the order
- `quote` - the quote parameters, nominally the slippage applied to the order
- `orderClass` - the order class, eg. `market`, `limit`, `twap` etc.

```typescript
/// file: run.ts
import type { Web3Provider } from '@ethersproject/providers';
+++import { MetadataApi, latest } from '@cowprotocol/app-data';+++

export async function run(provider: Web3Provider): Promise<unknown> {
    // ...

    const appCode = 'Decentralized CoW';
    const environment = 'prod';
    const referrer = { address: '0xcA771eda0c70aA7d053aB1B25004559B918FE662' };

    const quoteAppDoc: latest.Quote = { slippageBips: '50' };
    const orderClass: latest.OrderClass = { orderClass: 'market' };

    // ...
}
```

> We use the `latest` namespace to get the latest types. The schema is versioned, so you may alternatively use the version namespace.

### App data document

Now that we have the parameters, we can create the app data document:

```typescript
/// file: run.ts
import type { Web3Provider } from '@ethersproject/providers';
import { MetadataApi, latest } from '@cowprotocol/app-data';

export async function run(provider: Web3Provider): Promise<unknown> {
    // ...

    const appDataDoc = await metadataApi.generateAppDataDoc({
        appCode,
        environment,
        metadata: {
            referrer,
            quote: quoteAppDoc,
            orderClass,
        },
    });

    // ...
}
```

### Processing the document

Now that we have the document, we can process it. In doing this, we will:

- determine the CID of the document
- determine the appDataContent, which is passed in the order's `appData` field when sent to the API
- determine the appDataHex, which is passed in the order's `appDataHash` field when sent to the API

```typescript
/// file: run.ts
import type { Web3Provider } from '@ethersproject/providers';
import { MetadataApi, latest } from '@cowprotocol/app-data';

export async function run(provider: Web3Provider): Promise<unknown> {
    // ...

    const { appDataHex, appDataContent } = await metadataApi.appDataToCid(appDataDoc);

    return {
        appDataDoc,
        appDataHex,
        appDataContent,
    };
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
    "appDataDoc": {
        "appCode": "Decentralized CoW",
        "metadata": {
            "referrer": {
                "address": "0xcA771eda0c70aA7d053aB1B25004559B918FE662"
            },
            "quote": {
                "slippageBips": "50"
            },
            "orderClass": {
                "orderClass": "market"
            }
        },
        "version": "0.11.0",
        "environment": "prod"
    },
    "cid": "f01551b20b4b4561d26cfe084594ddbb4cf6af5397c1bf1cb31997ae4d2a82325eeda8f6d",
    "appDataHex": "0xb4b4561d26cfe084594ddbb4cf6af5397c1bf1cb31997ae4d2a82325eeda8f6d",
    "appDataContent": "{\"appCode\":\"Decentralized CoW\",\"environment\":\"prod\",\"metadata\":{\"orderClass\":{\"orderClass\":\"market\"},\"quote\":{\"slippageBips\":\"50\"},\"referrer\":{\"address\":\"0xcA771eda0c70aA7d053aB1B25004559B918FE662\"}},\"version\":\"0.11.0\"}"
}
```