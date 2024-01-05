import type { Web3Provider } from '@ethersproject/providers';
import { SupportedChainId } from '@cowprotocol/cow-sdk';
import { Contract } from 'ethers';

export async function run(provider: Web3Provider): Promise<unknown> {
    const chainId = +(await provider.send('eth_chainId', []));
    if (chainId !== SupportedChainId.GNOSIS_CHAIN) {
        throw new Error(`Please connect to the Gnosis chain. ChainId: ${chainId}`);
    }

    const settlementAddress = '0x9008D19f58AAbD9eD0D60971565AA8510560ab41';
    const orderUid = '0x8464affce2df48b60f6976e51414dbc079e9c30ef64f4c1f78c7abe2c7f96a0c29104bb91ada737a89393c78335e48ff4708727e659523a1';

    // Compacted ABI for the `invalidateOrder` function
    const invalidateOrderAbi = [
        {
            "inputs": [
                { "internalType": "bytes", "name": "orderUid", "type": "bytes" }
            ],
            "name": "invalidateOrder",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        }
    ]

    const signer = provider.getSigner();
    const settlement = new Contract(settlementAddress, invalidateOrderAbi, signer);

    const tx = await settlement.invalidateOrder(orderUid);
    console.log('tx', tx);
    const receipt = await tx.wait();

    return receipt;
}
