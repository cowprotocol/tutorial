---
title: Cancelling order
---

In the previous tutorials we have created an Eth-flow order and showed how to view it. Let's say for some reason we want to cancel the order (like instead of buying 1 xDAI worth of COW, you now want to buy 200 xDAI worth of COW)! In this tutorial we will show how to cancel an order.

In order to cancel an Eth-flow order, we need to pass to `invalidateOrder` the original parameter that was passed to `createOrder`. There are a couple of ways to do this:

- Lookup the `calldata` of the transaction that created the order, and replace the function selector with the `invalidateOrder` function selector
- Lookup the logs of the transaction that created the order and reconstruct the `EthFlowOrder.Data` struct from the `OrderPlacement` event log

We will use the second method in this tutorial.

## Reconstructing the `EthFlowOrder.Data` struct

From the [`EthFlowOrder.Data` struct](https://beta.docs.cow.fi/cow-protocol/reference/contracts/periphery/eth-flow#ethfloworderdata) technical reference, we can see that the struct's fields are a subset of the [`GPv2Order.Data` struct](https://beta.docs.cow.fi/cow-protocol/reference/contracts/core/settlement#gpv2orderdata-struct) and an additional `int64` field called `quoteId`.

Fortunately, in the `OrderPlacement` event log, we can see that the `order` field is the `GPv2Order.Data` struct, and the `data` field is a solidity-packed tuple containing the `quoteId` field and the `validTo` field. This means that we can reconstruct the `EthFlowOrder.Data` struct from the `OrderPlacement` event log!

### Extract `quoteId` from `data` field

First let's write a helper function to extract the `quoteId` from the solidity packed `data` log field:

```typescript
/// file: run.ts
import type { Web3Provider } from '@ethersproject/providers'
+++import { BigNumber, Contract, utils } from "ethers";+++
import { SupportedChainId, UnsignedOrder } from '@cowprotocol/cow-sdk'
import { onchainOrderToHash } from '/src/lib/gpv2Order';
import abi from './ethFlow.abi.json'

// ...

export async function run(provider: Web3Provider): Promise<unknown> {
    // ...

    const decodePackedData = (data: string) => {
        // Ensure data is of correct length (8 bytes for int64 + 4 bytes for uint32)
        if (data.length !== 2 * (8 + 4) + 2) { // +2 for '0x'
            throw new Error('Invalid data length');
        }

        // Extract quoteId (int64) and validTo (uint32) from the data
        const quoteIdBytes = data.slice(2, 2 + 16); // 8 bytes for int64
        const validToBytes = data.slice(2 + 16); // 4 bytes for uint32

        // Convert hex strings to BigNumber
        const quoteId = BigNumber.from('0x' + quoteIdBytes).toNumber();
        const validTo = BigNumber.from('0x' + validToBytes).toNumber();

        return { quoteId, validTo };
    }

    // ...
```

As the `data` field is a solidity-packed tuple, the field lengths are fixed. Therefore we can extract the `quoteId` and `validTo` fields by slicing the `data` field into the correct lengths, and converting the hex strings to `BigNumber`s.

### Reconstruct `EthFlowOrder.Data` struct

Now that we have a way to extract the `quoteId` from the `data` field, we can define a function to reconstruct the `EthFlowOrder.Data` struct from the `OrderPlacement` event log:

```typescript
/// file: run.ts
import type { Web3Provider } from '@ethersproject/providers'
import { BigNumber, Contract, utils } from "ethers";
import { SupportedChainId, UnsignedOrder } from '@cowprotocol/cow-sdk'
+++import { onchainOrderToOrder, onchainOrderToHash } from '/src/lib/gpv2Order';+++
import abi from './ethFlow.abi.json'

// ...

export async function run(provider: Web3Provider): Promise<unknown> {
    // ...

    const onchainEthFlowOrder = (onchainOrder: any, data: any): EthFlowOrder => {
        const order = onchainOrderToOrder(onchainOrder);
        const { quoteId } = decodePackedData(data);

        return {
            buyToken: order.buyToken,
            sellAmount: order.sellAmount.toString(),
            buyAmount: order.buyAmount.toString(),
            receiver: order.receiver, 
            appData: order.appData.toString(),
            feeAmount: order.feeAmount.toString(),
            partiallyFillable: order.partiallyFillable,
            validTo: order.validTo.valueOf(),
            quoteId,
        }
    }

    // ...
}
```

### Get transaction receipt

Let's use a known transaction hash to extract the `OrderPlacement` event log:

```typescript
/// file: run.ts
// ...
export async function run(provider: Web3Provider): Promise<unknown> {
    // ...

    const txHash = '0x04d05fc2c953cc63608c19a79869301d62b1f077e0f795f716619b21f693f00c';
    const receipt = await provider.getTransactionReceipt(txHash);

    // ...
}
```

> The transaction hash above is from the gnosis chain network. Attempting to cancel this order will result in a revert, as the order has already been cancelled. If you want to try this tutorial, [create an Eth-flow order](/tutorial/create-eth-flow) first.

### Process event logs

Now that we have the transaction receipt, we can extract the `OrderPlacement` event logs from it, reconstructing the `EthFlowOrder.Data` struct and cancelling the orders:

```typescript
/// file: run.ts
// ...
export async function run(provider: Web3Provider): Promise<unknown> {
    // ...

    let cancelledOrders = [];

    for (const log of receipt.logs) {
        if (log.address !== ethFlowAddress) {
            continue;
        }

        const parsedLog = iface.parseLog(log);
        if (parsedLog.name === 'OrderPlacement') {
            const [, onchainOrder, , data] = parsedLog.args;
            const ethFlowOrder = onchainEthFlowOrder(onchainOrder, data);

            try {
                const tx = await ethFlowContract.invalidateOrder(ethFlowOrder);
                const receipt = await tx.wait();
                cancelledOrders.push({
                    ethFlowOrderUid: ethFlowOrderUid(onchainOrder),
                    receipt,
                });
            } catch (err) {
                throw new Error(err);
            }
        }
    }

    return {
        cancelledOrders,
    }
}
```

Above we:

- Filter out all logs that are not from the `ethFlowAddress` (i.e. this way we force that we don't accidentally look at logs from the other environment's `CoWSwapEthFlow` contract)
- Parse the log using the ABI
- Extract the `GPv2Order.Data` struct and `data` field from the `OrderPlacement` event
- Reconstruct the `EthFlowOrder.Data` struct from the `OrderPlacement` event log
- Cancel the order using the `ethFlowContract.invalidateOrder` function
- Wait for the transaction to be confirmed
- Push the cancelled order to the `cancelledOrders` array

## Run the code

To run the code, we can press the "Run" button in the bottom right panel (the web container).

When running the script, we may be asked to connect a wallet. We can use Rabby for this.

1. Accept the connection request in Rabby
2. Press the "Run" button again
3. Confirm transactions in Rabby
4. Observe all orders being cancelled in the output panel

### Errors

You may receive some errors associated with reverts with `eth_estimateGas` calls. This is likely because the order has already been cancelled (such as the orders in the example above).