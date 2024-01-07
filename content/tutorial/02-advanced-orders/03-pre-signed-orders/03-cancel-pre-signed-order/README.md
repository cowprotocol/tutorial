---
title: Cancelling order
---

In the previous tutorials we have create a pre-signed order and showed how to view it. Let's say for some reason we want to cancel the order (like instead of buying 1 xDAI worth of COW, you now want to buy 200 xDAI worth of COW)! In this tutorial we will show how to cancel an order.

In order to cancel an order, we can either:

- Set `signed` to `false` using `setPreSignature`
- Invalidate the order using `invalidateOrder`

We will use the first method in this tutorial (as it results in a cheaper transaction fee).

## Contract `GPv2Settlement` interaction

In order to revoke the signature of a pre-signed order, we need to call the `setPreSignature` with:

- `orderUid` - the same `orderUid` that was pre-signed
- `signed` - `false`

We will start at the same point as the previous tutorial, where we have created a pre-signed order and signed the transaction with a `Safe`.

### Define the `orderUid`

Instead of using the API to generate the `orderUid` when sending an order, we will simply use the `orderUid` that was previously generated and define that as a constant:

```typescript
/// file: run.ts
// ...

export async function run(provider: Web3Provider): Promise<unknown> {
  // ...
  const orderUid = '0x83b53f9252440ca4b5e78dbbff309c90149cd4789efcef5128685c8ac35d3f8d075e706842751c28aafcc326c8e7a26777fe3cc2659ae2e7';
  // ...
}
```

> Replace the `orderUid` with the one that was generated in the previous tutorial

### Set `signed` to `false`

Now that we have the `orderUid`, we can call `setPreSignature` with the `orderUid` and `signed` set to `false`:

```typescript
/// file: run.ts
// ...

export async function run(provider: Web3Provider): Promise<unknown> {
  // ...
  const presignCallData = settlementContract.interface.encodeFunctionData('setPreSignature', [
    orderUid,
    false,
  ])
  // ...
}
```

This should be all the changes required in order to revoke the pre-signed order with your `Safe`.

> As the `orderUid` is now statically defined, a lot of code can be removed from the previous tutorial. You can check the optimum solution by clicking 'Solve'.

## Run the code

To run the code, we can press the "Run" button in the bottom right panel (the web container).

When running the script, we may be asked to connect a wallet. We can use Rabby for this.

1. Accept the connection request in Rabby
2. Press the "Run" button again
3. Observe the `orderUid`, `safeTxHash`, and `senderSignature` in the output panel
4. Browse to your `Safe` wallet and confirm the transaction
5. On successful confirmation of the transaction, the order's signature should be revoked.

> When checking the `orderUid` status in [CoW Explorer](https://explorer.cow.fi), the order should now be marked as 'Signing' instead of 'Open'. The means that the order is no longer valid and can't be filled. Once the expiry time has passed, the order will be marked as 'Expired'.
