import type { Web3Provider } from '@ethersproject/providers'
import { Contract, ethers } from "ethers";

export async function run(provider: Web3Provider): Promise<unknown> {
  const relayerAddress = '0xC92E8bdf79f0507f65a392b0ab4667716BFE0110';
  const tokenAddress = '0xe91d153e0b41518a2ce8dd3d7944fa863463a97d';

  // Compacted ABI for the approve function
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

  const signer = provider.getSigner();
  const wxDai = new Contract(tokenAddress, approveAbi, signer);

  const tx = await wxDai.approve(relayerAddress, ethers.constants.MaxUint256);
  console.log('tx', tx);
  const receipt = await tx.wait();

  return receipt;
}
