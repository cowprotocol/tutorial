import type { Web3Provider } from '@ethersproject/providers'
import { BigNumber, Contract, utils } from "ethers";
import { SupportedChainId, UnsignedOrder } from '@cowprotocol/cow-sdk'
import { onchainOrderToOrder, onchainOrderToHash } from '/src/lib/gpv2Order';
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

    const decodePackedData = (data: string) => {
        // Ensure data is of correct length (8 bytes for int64 + 4 bytes for uint32)
        if (data.length !== 2 * (8 + 4) + 2) { // +2 for '0x'
            throw new Error('Invalid data length');
        }

        // Extract quoteId (int64) and validTo (uint32) from the data
        const quoteIdBytes = data.slice(2, 2 + 16); // 8 bytes for int64
        const validToBytes = data.slice(2 + 16); // 4 bytes for uint32

        // Convert hex strings to BigNumber
        const quoteId = BigNumber.from('0x' + quoteIdBytes).toNumber();
        const validTo = BigNumber.from('0x' + validToBytes).toNumber();

        return { quoteId, validTo };
    }

    const onchainEthFlowOrder = (onchainOrder: any, data: any): EthFlowOrder => {
        const order = onchainOrderToOrder(onchainOrder);
        const { quoteId } = decodePackedData(data);

        return {
            buyToken: order.buyToken,
            sellAmount: order.sellAmount.toString(),
            buyAmount: order.buyAmount.toString(),
            receiver: order.receiver, 
            appData: order.appData.toString(),
            feeAmount: order.feeAmount.toString(),
            partiallyFillable: order.partiallyFillable,
            validTo: order.validTo.valueOf(),
            quoteId,
        }
    }

    const txHash = '0x04d05fc2c953cc63608c19a79869301d62b1f077e0f795f716619b21f693f00c';
    const receipt = await provider.getTransactionReceipt(txHash);

    let cancelledOrders = [];

    for (const log of receipt.logs) {
        if (log.address !== ethFlowAddress) {
            continue;
        }

        const parsedLog = iface.parseLog(log);
        if (parsedLog.name === 'OrderPlacement') {
            const [, onchainOrder, , data] = parsedLog.args;
            const ethFlowOrder = onchainEthFlowOrder(onchainOrder, data);

            try {
                const tx = await ethFlowContract.invalidateOrder(ethFlowOrder);
                const receipt = await tx.wait();
                cancelledOrders.push({
                    ethFlowOrderUid: ethFlowOrderUid(onchainOrder),
                    receipt,
                });
            } catch (err) {
                throw new Error(err);
            }
        }
    }

    return {
        cancelledOrders,
    }
}
