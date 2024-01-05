---
title: Approving sell token
---

For an order to be tradeable on CoW Protocol, the owner needs to approve the [GPv2VaultRelayer](https://beta.docs.cow.fi/cow-protocol/reference/contracts/core/vault-relayer) to spend the token they want to trade.

> A list of the core deployed contracts can be found [here](https://beta.docs.cow.fi/cow-protocol/reference/contracts/core).

## Contract (token) interaction

For interacting with contracts, the tutorials use [ethers.js](https://docs.ethers.io/v5/).

To interact with a contract, we need to know:

- the contract address
- the ABI

Additionally, if we want to **make a transaction**, we must have a _signer_ (e.g. a wallet).

### Contract address

The contract to be interacted with is the token we want to trade. In this tutorial, we use the [wxDAI](https://gnosisscan.io/token/0xe91d153e0b41518a2ce8dd3d7944fa863463a97d) token, and assign it's address `0xe91d153e0b41518a2ce8dd3d7944fa863463a97d` to a `const`.

At the same time, we assign the address of the [GPv2VaultRelayer](https://beta.docs.cow.fi/cow-protocol/reference/contracts/core/vault-relayer) to a `const`:

```typescript
/// file: run.ts
import type { Web3Provider } from '@ethersproject/providers';

export async function run(provider: Web3Provider): Promise<unknown> {
  const relayerAddress = '0xC92E8bdf79f0507f65a392b0ab4667716BFE0110';
  const tokenAddress = '0xe91d153e0b41518a2ce8dd3d7944fa863463a97d';

  // ...
}
```

### `approve` ABI

You may either set a limited approval (at least the amount of tokens you want to trade) or an unlimited approval. To do this, we use the [`approve`](https://eips.ethereum.org/EIPS/eip-20#approve) function of the [ERC-20](https://eips.ethereum.org/EIPS/eip-20) token standard.

We can set this function's ABI as a `const`:

```typescript
/// file: run.ts
import type { Web3Provider } from '@ethersproject/providers';

export async function run(provider: Web3Provider): Promise<unknown> {
  // ...

  const approveAbi = [
    {
      inputs: [
        { name: '_spender', type: 'address' },
        { name: '_value', type: 'uint256' },
      ],
      name: 'approve',
      outputs: [{ type: 'bool' }],
      stateMutability: 'nonpayable',
      type: 'function',
    },
  ];

  // ...
}
```

### Signer

To make a transaction, we need a signer. In this tutorial, we use an injected Web3Provider, such as [Rabby](https://rabby.io). We can get the signer from the provider:

```typescript
/// file: run.ts
import type { Web3Provider } from '@ethersproject/providers';

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
+++import { Contract } from '@ethersproject/contracts';+++

export async function run(provider: Web3Provider): Promise<unknown> {
  // ...

  const wxDai = new Contract(tokenAddress, approveAbi, signer);

  // ...
}
```

### Execute the `approve`

Now we have everything we need to execute the `approve` function. We will now give the `relayerAddress` unlimited approval to spend the `tokenAddress` token.

```typescript
/// file: run.ts
import type { Web3Provider } from '@ethersproject/providers';
+++import { Contract, ethers } from '@ethersproject/contracts';+++

export async function run(provider: Web3Provider): Promise<unknown> {
  // ...

  const wxDai = new Contract(tokenAddress, approveAbi, signer);

  const tx = await wxDai.approve(relayerAddress, ethers.constants.MaxUint256);
  console.log('tx', tx);
  const receipt = await tx.wait();

  return receipt;
}
```

## Run the code

To run the snippet, we simply press the "Run" button in the bottom right panel (the web container).

When running the script, we will be asked to connect a wallet. We can use Rabby for this.

1. Accept the connection request in Rabby
2. Click "Run"
3. Observe the `tx` object in the browser's console
4. On successful confirmation of the transaction, the `receipt` object will be returned to the output panel
