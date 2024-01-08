import type { Web3Provider } from '@ethersproject/providers'
import { Contract, utils } from "ethers";
import { SupportedChainId, UnsignedOrder } from '@cowprotocol/cow-sdk'
import { onchainOrderToHash } from '/src/lib/gpv2Order';
import abi from './ethFlow.abi.json'

type EthFlowOrder = Omit<UnsignedOrder, 'sellToken' | 'sellTokenBalance' | 'buyTokenBalance' | 'kind' | 'signingScheme'> & {
    quoteId: number;
}

export async function run(provider: Web3Provider): Promise<unknown> {
    const chainId = +(await provider.send('eth_chainId', []));
    if (chainId !== SupportedChainId.GNOSIS_CHAIN) {
        await provider.send('wallet_switchEthereumChain', [{ chainId: 100 }]);
    }

    const signer = provider.getSigner();

    const ethFlowAddress = '0x40A50cf069e992AA4536211B23F286eF88752187';
    const ethFlowContract = new Contract(ethFlowAddress, abi, signer);

    const iface = new utils.Interface(abi);

    const ethFlowOrderUid = (onchainOrder: any) => {
        const hash = onchainOrderToHash(onchainOrder, chainId);
        return hash + ethFlowAddress.slice(2) + 'ffffffff';
    }

    // TODO: Implement
}
