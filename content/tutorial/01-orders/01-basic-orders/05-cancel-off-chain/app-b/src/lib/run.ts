import type { Web3Provider } from '@ethersproject/providers'
import { SupportedChainId, OrderBookApi, OrderSigningUtils } from '@cowprotocol/cow-sdk'

export async function run(provider: Web3Provider): Promise<unknown> {
    const chainId = +(await provider.send('eth_chainId', []));
    if (chainId !== SupportedChainId.GNOSIS_CHAIN) {
        throw new Error(`Please connect to the Gnosis chain. ChainId: ${chainId}`);
    }

    const orderBookApi = new OrderBookApi({ chainId: SupportedChainId.GNOSIS_CHAIN });
    const signer = provider.getSigner();

    const orderUid = '0x8464affce2df48b60f6976e51414dbc079e9c30ef64f4c1f78c7abe2c7f96a0c29104bb91ada737a89393c78335e48ff4708727e659523a1';

    const orderCancellationsSigningResult = await OrderSigningUtils.signOrderCancellations(
        [orderUid],
        chainId,
        signer
    );

    try {
        const cancellationsResult = await orderBookApi.sendSignedOrderCancellations({
            ...orderCancellationsSigningResult,
            orderUids: [orderUid],
        })
    
        return { cancellationsResult }
    } catch (e) {
        return e
    }

}
