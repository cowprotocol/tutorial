import type { Web3Provider } from '@ethersproject/providers'

export async function run(provider: Web3Provider): Promise<unknown> {
  console.log('Hello world!');
  return {
    message: "Hello world!"
  };
}