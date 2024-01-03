---
title: Cancelling on-chain
---

The preferred way to cancel an order is off-chain, notably because it is free. However, this places trust in the API to cancel the order. If you want to enforce the cancellation of an order, you can do so on-chain. This will cost gas, but will ensure that the order is cancelled.

To cancel, we will send an `invalidateOrder` transaction to the [`GPv2Settlement`](https://beta.docs.cow.fi/cow-protocol/reference/contracts/core/settlement) contract.

> A list of the core deployed contracts can be found [here](https://beta.docs.cow.fi/cow-protocol/reference/contracts/core).

## Contract (`GPv2Settlement`) interaction

For interacting with contracts, the tutorials use [ethers.js](https://docs.ethers.io/v5/).

To interact with a contract, we need to know:

- the contract address
- the ABI

Additionally, if we want to **make a transaction**, we must have a _signer_ (e.g. a wallet).

### Contract address and `orderUid`

The contract to be interacted with is the [`GPv2Settlement`](https://beta.docs.cow.fi/cow-protocol/reference/contracts/core/settlement) contract. We assign it's address `0x9008D19f58AAbD9eD0D60971565AA8510560ab41` to a `const`.

At the same time, we assign the `orderUid` of the order we want to cancel to a `const`.

```typescript
/// file: run.ts
import type { Web3Provider } from '@ethersproject/providers';
import { SupportedChainId } from '@cowprotocol/cow-sdk';

export async function run(provider: Web3Provider): Promise<unknown> {
  // ...
  const settlementAddress = '0x9008D19f58AAbD9eD0D60971565AA8510560ab41';
  const orderUid = '0x8464affce2df48b60f6976e51414dbc079e9c30ef64f4c1f78c7abe2c7f96a0c29104bb91ada737a89393c78335e48ff4708727e659523a1';
  // ...
}
```

### `invalidateOrder` ABI

The contract's `invalidateOrder` function is used to cancel an order. We can retrieve the ABI for this function from the contract's verified code on [Gnosisscan](https://gnosisscan.io/address/0x9008D19f58AAbD9eD0D60971565AA8510560ab41#code). We can set this function's ABI as a `const`:

```typescript
/// file: run.ts
import type { Web3Provider } from '@ethersproject/providers';
import { SupportedChainId } from '@cowprotocol/cow-sdk';

export async function run(provider: Web3Provider): Promise<unknown> {
    // ...

    const invalidateOrderAbi = [
        {
            "inputs": [
                { "internalType": "bytes", "name": "orderUid", "type": "bytes" }
            ],
            "name": "invalidateOrder",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        }
    ];

    // ...
}
```

### Signer

To make a transaction, we need a signer. In this tutorial, we use an injected Web3Provider, such as [Rabby](https://rabby.io). We can get the signer from the provider:

```typescript
/// file: run.ts
import type { Web3Provider } from '@ethersproject/providers';
import { SupportedChainId } from '@cowprotocol/cow-sdk';

export async function run(provider: Web3Provider): Promise<unknown> {
  // ...

  const signer = provider.getSigner();

  // ...
}
```

### Connect to the contract

To interact with the contract, we need to connect to it. We can do this by using the `Contract` class from ethers.js:

```typescript
/// file: run.ts
import type { Web3Provider } from '@ethersproject/providers';
import { SupportedChainId } from '@cowprotocol/cow-sdk';
+++import { Contract } from '@ethersproject/contracts';+++

export async function run(provider: Web3Provider): Promise<unknown> {
  // ...

  const settlement = new Contract(settlementAddress, invalidateOrderAbi, signer);

  // ...
}
```

### Execute the `invalidateOrder`

Now we have everything we need to execute the `invalidateOrder` function. In order to do this, we pass the `orderUid` to the function:

```typescript
/// file: run.ts
import type { Web3Provider } from '@ethersproject/providers';
import { SupportedChainId } from '@cowprotocol/cow-sdk';
import { Contract } from '@ethersproject/contracts';

export async function run(provider: Web3Provider): Promise<unknown> {
    // ...

    const tx = await settlement.invalidateOrder(orderUid);
    console.log('tx', tx);
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
