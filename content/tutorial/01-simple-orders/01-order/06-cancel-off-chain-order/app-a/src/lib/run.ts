import type { Web3Provider } from '@ethersproject/providers';
import { SupportedChainId, OrderBookApi } from '@cowprotocol/cow-sdk';

export async function run(provider: Web3Provider): Promise<unknown> {
    const chainId = +(await provider.send('eth_chainId', []));
    if (chainId !== SupportedChainId.GNOSIS_CHAIN) {
        throw new Error(`Please connect to the Gnosis chain. ChainId: ${chainId}`);
    }

    const orderBookApi = new OrderBookApi({ chainId: SupportedChainId.GNOSIS_CHAIN });
    const signer = provider.getSigner();

}
