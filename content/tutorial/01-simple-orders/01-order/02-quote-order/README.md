---
title: Quoting
---

OK, so you're wanting to trade some tokens on CoW Protocol. Great! But before we do that, let's get a quote first so we know what we're getting into. We get quotes using the [Order book API](https://beta.docs.cow.fi/cow-protocol/tutorials/arbitrate/orderbook).

## API

The CoW Protocol API is [documented in swagger](https://beta.docs.cow.fi/cow-protocol/reference/apis/orderbook). Using API endpoints can be a bit tricky, so we've exposed all the settings that you need (including things like rate limiters so you don't get blocked) in a simple to use library: `@cowprotocol/cow-sdk`.

To install it, run: `npm install @cowprotocol/cow-sdk`

## Quote

As an example, let's get a quote for trading 1 `wxDAI` for `COW` on [Gnosis chain](https://gnosis.io/). This is a simple swap (market order).

### Which environment?

CoW Protocol supports multiple environments (e.g. mainnet, gnosis chain, sepolia, etc). We need to know which environment we want to trade on. For this tutorial, we'll use the Gnosis chain. Let's get the `chainId` for the connected wallet and compare it to the `SupportedChainId` enum from the `@cowprotocol/cow-sdk` library:

```typescript
/// file: run.ts
import type { Web3Provider } from '@ethersproject/providers';
+++import { SupportedChainId } from '@cowprotocol/cow-sdk';+++

export async function run(provider: Web3 Provider): Promise<unknown> {
    const chainId = +(await provider.send('eth_chainId', []));
    if (chainId !== SupportedChainId.GNOSIS_CHAIN) {
        throw new Error(`Please connect to the Gnosis chain. ChainId: ${chainId}`);
    }
}
```

### Instantiate the SDK

Next, we need to instantiate the `OrderBookApi` from the `@cowprotocol/cow-sdk` library. We can do this by passing the `chainId` to the constructor:

```typescript
/// file: run.ts
import type { Web3Provider } from '@ethersproject/providers';
+++import { SupportedChainId, OrderBookApi } from '@cowprotocol/cow-sdk';+++

export async function run(provider: Web3Provider): Promise<unknown> {
    // ...
    const orderBookApi = new OrderBookApi({ chainId: SupportedChainId.GNOSIS_CHAIN });
    // ...
}
```

We now have an instantiated `OrderBookApi` that we can use to interact with the Order Book API, and make sure that we don't bust any rate limits.

### Order parameters

Now that we have an instantiated `OrderBookApi`, we can get a quote. To do this, we need to know:

- the token we want to sell (the `sellToken`), in this case [`wxDAI`](https://gnosisscan.io/token/0xe91d153e0b41518a2ce8dd3d7944fa863463a97d)
- the token we want to buy (the `buyToken`), in this case [`COW`](https://gnosisscan.io/token/0x177127622c4A00F3d409B75571e12cB3c8973d3c)
- the amount of tokens we want to sell (the `sellAmount`), in this case `1 wxDAI` in atomic units (i.e. wei), which is `1000000000000000000`

```typescript
/// file: run.ts
import type { Web3Provider } from '@ethersproject/providers';
import { SupportedChainId, OrderBookApi } from '@cowprotocol/cow-sdk';

export async function run(provider: Web3Provider): Promise<unknown> {
    // ...
    const signer = provider.getSigner();
    const ownerAddress = await signer.getAddress();

    const sellToken = '0xe91d153e0b41518a2ce8dd3d7944fa863463a97d'; // wxDAI
    const buyToken = '0x177127622c4A00F3d409B75571e12cB3c8973d3c'; // COW
    const sellAmount = '1000000000000000000'; // 1 wxDAI
    // ...
}
```

### Order request object

Now that we have all the parameters, we can create an `OrderQuoteRequest` object. Fortunately for us, all the typings are already defined in the `@cowprotocol/cow-sdk` library, so we can just use those:

```typescript
/// file: run.ts
import type { Web3Provider } from '@ethersproject/providers';
+++import { SupportedChainId, OrderBookApi, OrderQuoteRequest, OrderQuoteSideKindSell } from '@cowprotocol/cow-sdk';+++

export async function run(provider: Web3Provider): Promise<unknown> {
    // ...
    const quoteRequest: OrderQuoteRequest = {
        sellToken,
        buyToken,
        from: ownerAddress,
        receiver: ownerAddress,
        sellAmountBeforeFee: sellAmount,
        +++kind: OrderQuoteSideKindSell.SELL,+++
    };
    // ...
}
```

We can see that there are some special types, that are designed to reduce the potential for human error. These types are automatically generated from the swagger documentation, and compliance with them will ensure that your code is compatible with the API. Examples above include `OrderQuoteRequest` and `OrderQuoteSideKindSell`.

### Get the quote

Now that we have the `OrderQuoteRequest`, we can get the quote:

```typescript
/// file: run.ts
import type { Web3Provider } from '@ethersproject/providers';
import { SupportedChainId, OrderBookApi, OrderQuoteRequest, OrderQuoteSideKindSell } from '@cowprotocol/cow-sdk';

export async function run(provider: Web3Provider): Promise<unknown> {
    // ...
    const { quote } = await orderBookApi.getQuote(quoteRequest);

    return quote;
}
```

## Run the code

To run the code, we can press the "Run" button in the bottom right panel (the web container).

When running the script, we may be asked to connect a wallet. We can use Rabby for this.

1. Accept the connection request in Rabby
2. Press the "Run" button again
3. Observe the `OrderQuoteResponse` object returned to the output panel

An example quote should look like:

```json
/// file: output.json
{
    "sellToken": "0xe91d153e0b41518a2ce8dd3d7944fa863463a97d",
    "buyToken": "0x177127622c4a00f3d409b75571e12cb3c8973d3c",
    "receiver": "0x29104bb91ADA737a89393c78335e48fF4708727E",
    "sellAmount": "998118187948506302",
    "buyAmount": "4000045686115459544",
    "validTo": 1704267037,
    "appData": "0x0000000000000000000000000000000000000000000000000000000000000000",
    "feeAmount": "1881812051493698",
    "kind": "sell",
    "partiallyFillable": false,
    "sellTokenBalance": "erc20",
    "buyTokenBalance": "erc20",
    "signingScheme": "eip712"
}
```

In the above case, we can see that:

- the `sellToken` is `0xe91d153e0b41518a2ce8dd3d7944fa863463a97d` (which is `wxDAI`)
- the `buyToken` is `0x177127622c4a00f3d409b75571e12cb3c8973d3c` (which is `COW`)
- the `sellAmount` is `998118187948506302` atomic units of `wxDAI` (which is `0.998118187948506302` `wxDAI`)
- the `buyAmount` is `4000045686115459544` atomic units of `COW` (which is `4.000045686115459544` `COW`)
- the `validTo` is `1704267037` (which is Jan 03 2024 07:30:37 GMT+0000)
- the `feeAmount` is `1881812051493698` atomic units of `wxDAI` (which is `0.001881812051493698` `wxDAI`)
- the `kind` is `sell`

The above `OrderQuoteResponse` object actually maps to the [`GPv2Order.Data`](https://beta.docs.cow.fi/cow-protocol/reference/contracts/core/settlement#gpv2orderdata-struct) struct for the smart contract, so this is what we will sign in the [next tutorial](/tutorial/sign-order) for our swap.