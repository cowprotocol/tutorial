import type { Web3Provider } from '@ethersproject/providers'

export async function run(provider: Web3Provider): Promise<unknown> {
  console.log('Hello world!');

  const merkleTree = await fetch(`http://127.0.0.1:3117/merkle-tree`).then(res => res.json())

  return {
    message: "Hello world!",
    merkleTree
  };
}
