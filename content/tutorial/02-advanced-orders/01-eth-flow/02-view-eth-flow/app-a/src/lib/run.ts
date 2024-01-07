import type { Web3Provider } from '@ethersproject/providers'
import { utils } from "ethers";
import { SupportedChainId } from '@cowprotocol/cow-sdk'
import abi from './ethFlow.abi.json'

export async function run(provider: Web3Provider): Promise<unknown> {
    const chainId = +(await provider.send('eth_chainId', []));
    if (chainId !== SupportedChainId.GNOSIS_CHAIN) {
        await provider.send('wallet_switchEthereumChain', [{ chainId: 100 }]);
    }

    const ethFlowAddress = '0x40A50cf069e992AA4536211B23F286eF88752187';
    const iface = new utils.Interface(abi);

    // TODO: Implement
}
