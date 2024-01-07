---
title: Viewing status
---

One of the more difficult things to do with `Eth-flow` orders is to determine their status, as to do so we need to know the [`orderUid`](https://beta.docs.cow.fi/cow-protocol/reference/contracts/core/settlement#orderuid) of the order.

In this tutorial, we will learn how to determine the `orderUid` of an `Eth-flow` order, and how to use it to determine the order's status.

## Determining the `orderUid`

Upon consulting the documentation's Technical reference on [`orderUid`](https://beta.docs.cow.fi/cow-protocol/reference/contracts/core/settlement#orderuid), we can see that the `orderUid` is composed of the following fields:

- `digest`: The EIP-712 digest of the `GPv2Order.Data` struct
- `owner`: The address of the order's owner
- `expiry`: The order's expiry timestamp

For the case of **all** Eth-flow orders, it is immediately apparent that:

- The `owner` is the address of the Eth-flow contract (they are just simple `ERC-1271` orders signed by the Eth-flow contract)
- The `expiry` is the maximum possible value for a `uint32`, ie. `2^32 - 1`

Therefore, we can create a function that takes an ABI-encoded `GPv2Order.Data` struct, and returns the corresponding Eth-flow `orderUid`:

```typescript
/// file: run.ts
import type { Web3Provider } from '@ethersproject/providers'
import { utils } from "ethers";
import { SupportedChainId } from '@cowprotocol/cow-sdk'
+++import { onchainOrderToHash } from "/src/lib/gpv2Order";+++
import abi from './ethFlow.abi.json'

export async function run(provider: Web3Provider): Promise<unknown> {
    // ...

    const ethFlowOrderUid = (onchainOrder: any) => {
        const hash = onchainOrderToHash(onchainOrder, chainId);
        return hash + ethFlowAddress.slice(2) + 'ffffffff';
    }

    // ...
}
```

> Unfortunately there are no functions exported (yet) from the `cow-sdk` that allow for computing the `EIP-712` digest of an **ABI-encoded** `GPv2Order.Data` struct. The `onchainOrderToHash` function is defined in the `gpv2Order.ts` file and usable for this tutorial. 

> The `ethFlowOrderUid` above returns the concatenation of the `digest`, `owner` and `expiry` fields of the `orderUid`. The `owner` field is the address of the Eth-flow contract, and the `expiry` field is the maximum possible value for a `uint32`, ie. `2^32 - 1`.

## Contract (`CoWSwapEthFlow`) `OrderPlacement` events

For handling events from the smart contracts, the tutorials use [ethers.js](https://docs.ethers.io/v5/).

To handle events, we need to know:

- the ABI
- the contract address (optional, but recommended)

In the case of this tutorial, we already have the ABI from the previous tutorial, and we can use the `ethFlowAddress` constant from the previous tutorial.

### Get transaction receipt

The `CoWSwapEthFlow` contract emits an `OrderPlacement` event whenever an order is created. This event log contains an `order` field, which is the `GPv2Order.Data` struct that we need to determine the `orderUid`.

Let's use a known transaction hash to extract the `GPv2Order.Data` struct from the `OrderPlacement` event:

```typescript
/// file: run.ts
import type { Web3Provider } from '@ethersproject/providers'
import { utils } from "ethers";
import { SupportedChainId } from '@cowprotocol/cow-sdk'
import abi from './ethFlow.abi.json'

export async function run(provider: Web3Provider): Promise<unknown> {
    // ...

    const txHash = '0x04d05fc2c953cc63608c19a79869301d62b1f077e0f795f716619b21f693f00c';
    const receipt = await provider.getTransactionReceipt(txHash);
}
```

### Process event logs

Now that we have the transaction receipt, we can extract the `OrderPlacement` event logs from it:

```typescript
/// file: run.ts
// ...

export async function run(provider: Web3Provider): Promise<unknown> {
    // ...

    const ethFlowOrderUids: string[] = receipt.logs
        .map((log) => {
            if (log.address !== ethFlowAddress) {
                return;
            }

            const parsedLog = iface.parseLog(log);
            if (parsedLog.name === 'OrderPlacement') {
                const [, order, ,] = parsedLog.args;

                return ethFlowOrderUid(order);
            }
        })
        .filter((uid) => uid !== undefined);

    return {
        ethFlowOrderUids,
    }
}
```

Above we:

- Filter out all logs that are not from the `ethFlowAddress` (i.e. this way we force that we don't accidentally look at logs from the other environment's `CoWSwapEthFlow` contract)
- Parse the log using the ABI
- Extract the `GPv2Order.Data` struct from the `data` field of the `OrderPlacement` event
- Compute the `orderUid` from the `GPv2Order.Data` struct using the `ethFlowOrderUid` function defined above
- Filter out any `undefined` values (i.e. logs that were not `OrderPlacement` events and/or were not from the `ethFlowAddress`)

## Run the code

To run the code, we can press the "Run" button in the bottom right panel (the web container).

When running the script, we may be asked to connect a wallet. We can use Rabby for this.

1. Accept the connection request in Rabby
2. Press the "Run" button again
3. Observe the calculated `orderUid` in the output panel

Now that we have determined the `orderUid` of an Eth-flow order, we can simply look up the order's status using [CoW Explorer](https://explorer.cow.fi).
