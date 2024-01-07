---
title: Creating order
---

[Eth-flow](https://beta.docs.cow.fi/cow-protocol/reference/contracts/periphery/eth-flow) allows users to create orders selling `ETH` without wrapping it to `WETH` first.

To create an `Eth-flow` order we will need to interact with the `Eth-Flow` contract.

## Contract (`CoWSwapEthFlow`) interaction

For interacting with contracts, the tutorials use [ethers.js](https://docs.ethers.io/v5/).

To interact with a contract, we need to know:

- the contract address
- the ABI

Additionally, as we want to **make a transaction**, we must have a _signer_ (e.g. a wallet).

### Contract address

`EthFlow` is a periphery contract, and it's deployed on each supported network. As `EthFlow` orders are natively indexed by the [autopilot](https://beta.docs.cow.fi/cow-protocol/tutorials/arbitrate/autopilot), there also exists a `production` and `staging` version of the contract on each network.

For this tutorial, we will use the [`production` version of the contract](https://gnosisscan.io/address/0x40A50cf069e992AA4536211B23F286eF88752187) on Gnosis chain. Let's assign it's address to a constant:

```typescript
/// file: run.ts
import type { Web3Provider } from '@ethersproject/providers';
import { SupportedChainId } from '@cowprotocol/cow-sdk';
import { MetadataApi, latest } from '@cowprotocol/app-data';

export async function run(provider: Web3Provider): Promise<unknown> {
  // ...
  const ethFlowAddress = '0x40A50cf069e992AA4536211B23F286eF88752187';
  // ...
}
```

### Eth-flow ABI

We can retrieve the ABI for the `Eth-flow` contract from the contract's verified code on [Gnosisscan](https://gnosisscan.io/address/0x40A50cf069e992AA4536211B23F286eF88752187#code). As we're going to be using other functions from the `Eth-flow` contract, we will just copy the whole ABI to an `ethFlow.abi.json` file.

To do so:

1. Copy the ABI from [Gnosisscan](https://gnosisscan.io/address/0x40A50cf069e992AA4536211B23F286eF88752187#code)
2. Create a new file `ethFlow.abi.json` in the `src` folder
3. Paste the ABI into the file

Now that we have the ABI, we can import it into our `run.ts` file:

```typescript
/// file: run.ts
import type { Web3Provider } from '@ethersproject/providers';
import { SupportedChainId } from '@cowprotocol/cow-sdk';
import { MetadataApi, latest } from '@cowprotocol/app-data';
+++import abi from './ethFlow.abi.json';+++

export async function run(provider: Web3Provider): Promise<unknown> {
  // ...
}
```

### Connect to the contract

Now that we have the contract address and the ABI, we can connect to the contract:

```typescript
/// file: run.ts
import type { Web3Provider } from '@ethersproject/providers';
+++import { Contract } from 'ethers';+++
import { SupportedChainId } from '@cowprotocol/cow-sdk';
import { MetadataApi, latest } from '@cowprotocol/app-data';
import abi from './ethFlow.abi.json';

export async function run(provider: Web3Provider): Promise<unknown> {
  // ...
  const ethFlowContract = new ethers.Contract(ethFlowAddress, abi, signer);
  // ...
}
```

> Ensure that you connect using the `signer` as we will be making a transaction.

### Get a quote

It's recommended to get a quote before creating an order (though it's not required). We've done this in a [previous tutorial](/tutorial/quote-order), and we will use this as a starting point.

In this tutorial we are aiming to swap 1 `xDAI` for `COW` on Gnosis Chain. When getting a quote for Eth Flow orders, the `sellToken` should **always** be the wrapped native token (e.g. `WETH` on Ethereum, `WXDAI` on Gnosis Chain, etc.). Here we can get the wrapped native token address using the `wrappedNativeToken` function on the `EthFlow` contract.

```typescript
/// file: run.ts
import type { Web3Provider } from '@ethersproject/providers';
+++import {+++
+++  SupportedChainId,+++
+++  OrderBookApi,+++
+++  UnsignedOrder,+++
+++  SigningScheme,+++
+++  OrderQuoteRequest,+++
+++  OrderQuoteSideKindSell,+++
+++} from '@cowprotocol/cow-sdk';+++
import { MetadataApi, latest } from '@cowprotocol/app-data';
import abi from './ethFlow.abi.json';

export async function run(provider: Web3Provider): Promise<unknown> {
  // ...
  +++const orderBookApi = new OrderBookApi({ chainId: SupportedChainID.GNOSIS_CHAIN });+++
  const metadataApi = new MetadataApi();
  // ...

  +++const sellToken = await ethFlowContract.wrappedNativeToken();+++
  const buyToken = '0x177127622c4A00F3d409B75571e12cB3c8973d3c';
  const sellAmount = '1000000000000000000';

  const quoteRequest: OrderQuoteRequest = {
    sellToken,
    buyToken,
    sellAmountBeforeFee: sellAmount,
    kind: OrderQuoteSideKindSell.SELL,
    receiver: ownerAddress,
    +++from: ownerAddress,+++
    appData: appDataContent,
    appDataHash: appDataHex,
    +++signingScheme: SigningScheme.EIP1271,+++
    +++onchainOrder: true,+++
  }

  +++const { quote, id: quoteId } = await orderBookApi.getQuote(quoteRequest);+++
}
```

In addition to the `OrderQuoteRequest` fields we've used in the previous tutorial, we've added:

- `from`: the address of the order's owner (this is required for `EIP1271` orders)
- `signingScheme`: as Eth-flow orders are signed using the `EIP1271` scheme, we need to specify such a scheme
- `onchainOrder`: the order is going to be created on-chain, so we need to specify this

### `EthFlowOrder.Data` struct

Now that we have a quote, we can go about creating an `EthFlow` order. Unfortunately no `EthFlowOrder` type exists in the SDK, so we will need to create one ourselves. Simply we create a type that extends the `UnsignedOrder` type (removing the fields that are not required for [`EthFlow` orders](https://beta.docs.cow.fi/cow-protocol/reference/contracts/periphery/eth-flow#ethfloworderdata)) and add a `quoteId` field:

```typescript
/// file: run.ts
// ...

+++type EthFlowOrder = Omit<UnsignedOrder, 'sellToken' | 'sellTokenBalance' | 'buyTokenBalance' | 'kind' | 'signingScheme'> & {+++
+++  quoteId: number;+++
+++}+++

export async function run(provider: Web3Provider): Promise<unknown> {
  // ...
}
```

Now that we have the `EthFlowOrder` type, and we have a quote, we can create an order:

```typescript
/// file: run.ts
import type { Web3Provider } from '@ethersproject/providers';
+++import { BigNumber, Contract } from 'ethers';+++
// ...
export async function run(provider: Web3Provider): Promise<unknown> {
  // ...
    const order: EthFlowOrder = {
    ...quote,
    +++buyAmount: BigNumber.from(quote.buyAmount).mul(9950).div(10000).toString(),+++
    receiver: ownerAddress,
    appData: appDataHex,
    quoteId,
  }
}
```

> The `buyAmount` has a slippage of 0.5% applied to it. This is to ensure that it is filled if trading very low amounts of `xDAI` for this tutorial. The slippage amount is arbitrary and can be changed.

> The `quoteId` is the `id` of the quote we received from the `OrderBookApi`, however this is **not required** for creating an `EthFlow` order and may be populated with any value.

### Execute the `createOrder`

Now we have everything for creating an order, we can execute the `createOrder`. Before we do however, unlike the previous tutorials, we will need to send some `ETH` for this transaction. We can do this by adding a `value` field to the `createOrder` call. The value should be **`sellAmount`** that was originally defined for the quote request.

```typescript
/// file: run.ts
// ...
export async function run(provider: Web3Provider): Promise<unknown> {
  // ...

  +++const tx = await ethFlowContract.createOrder(order, { value: sellAmount });+++
  console.log('Transaction Hash:', tx.hash);
  const receipt = await tx.wait();

  return receipt;
}
```

## Run the code

To run the code, we can press the "Run" button in the bottom right panel (the web container).

When running the script, we may be asked to connect a wallet. We can use Rabby for this.

1. Accept the connection request in Rabby
2. Press the "Run" button again
3. Observe the `tx` object in the browser's console
4. On successful confirmation of the transaction, the `receipt` object will be returned to the output panel
