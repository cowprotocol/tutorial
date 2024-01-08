import type { Web3Provider } from '@ethersproject/providers'
import { utils } from "ethers";
import { SupportedChainId } from '@cowprotocol/cow-sdk'
import { onchainOrderToHash } from "/src/lib/gpv2Order";
import abi from './ethFlow.abi.json'

export async function run(provider: Web3Provider): Promise<unknown> {
    const chainId = +(await provider.send('eth_chainId', []));
    if (chainId !== SupportedChainId.GNOSIS_CHAIN) {
        await provider.send('wallet_switchEthereumChain', [{ chainId: 100 }]);
    }

    const ethFlowAddress = '0x40A50cf069e992AA4536211B23F286eF88752187';
    const iface = new utils.Interface(abi);

    const ethFlowOrderUid = (onchainOrder: any) => {
        const hash = onchainOrderToHash(onchainOrder, chainId);
        return hash + ethFlowAddress.slice(2) + 'ffffffff';
    }

    const txHash = '0x1a1eb56678cf1936711df3de6e9ff02accef52808ecbd704a8547c62dcfb42f5';
    const receipt = await provider.getTransactionReceipt(txHash);

    const ethFlowOrderUids: string[] = receipt.logs
        .map((log) => {
            if (log.address !== ethFlowAddress) {
                return;
            }

            const parsedLog = iface.parseLog(log);
            if (parsedLog.name === 'OrderPlacement') {
                const [, order, ,] = parsedLog.args;

                return ethFlowOrderUid(order);
            }
        })
        .filter((uid) => uid !== undefined);

    return {
        ethFlowOrderUids,
    }
}
