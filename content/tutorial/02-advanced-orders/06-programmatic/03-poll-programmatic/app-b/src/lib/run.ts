import type { Web3Provider } from '@ethersproject/providers'
import abi from './composableCow.abi.json';
import { ethers } from "ethers";
import { Order, domain, hashOrder } from '@cowprotocol/contracts';
import { OrderBookApi, SupportedChainId, SigningScheme, SellTokenSource, BuyTokenDestination } from '@cowprotocol/cow-sdk'
import { onchainOrderToOrder } from '/src/lib/gpv2Order';

export async function run(provider: Web3Provider): Promise<unknown> {
    const chainId = +(await provider.send('eth_chainId', []));
    if (chainId !== SupportedChainId.MAINNET) {
        await provider.send('wallet_switchEthereumChain', [{ chainId: 1 }]);
    }

    const orderBookApi = new OrderBookApi({ chainId: SupportedChainId.MAINNET });

    // https://etherscan.io/tx/0x69d87f8fda0c5915d9b90f6b9b22709bb19b903f543fa5964ed2fb541345292b#eventlog

    const composableCowAddress = '0xfdaFc9d1902f4e0b84f65F49f244b32b31013b74';
    const contract = new ethers.Contract(composableCowAddress, abi, provider);
	
    const txHash = '0x69d87f8fda0c5915d9b90f6b9b22709bb19b903f543fa5964ed2fb541345292b';
    const receipt = await provider.getTransactionReceipt(txHash);

    const iface = new ethers.utils.Interface(abi);

    for (const log of receipt.logs) {
        try {
            const parsedLog = iface.parseLog(log);
            if (parsedLog.name === 'ConditionalOrderCreated') {
                const [owner, params] = parsedLog.args;
                const [handler, salt, staticInput] = params;

                // return { handler, salt, staticInput };
                
                const [polledOrder, signature] = await contract.getTradeableOrderWithSignature(
                    owner,
                    params,
                    '0x',
                    []
                )

                const order: Order = onchainOrderToOrder(polledOrder);

                // Calculate the order hash
                const hash = hashOrder(domain(SupportedChainId.MAINNET, '0x9008D19f58AAbD9eD0D60971565AA8510560ab41'), order);

                // Now we have everything to check with the `isValidSignature` function. If this passes, we should be able to submit the order to the OrderBook
                const isValidSignatureAbi = [
                    {
                        "constant": true,
                        "inputs": [
                            { "name": "_hash", "type": "bytes32" },
                            { "name": "_signature", "type": "bytes" }
                        ],
                        "name": "isValidSignature",
                        "outputs": [ { "name": "", "type": "bytes4" } ],
                        "payable": false,
                        "stateMutability": "view",
                        "type": "function"
                    }
                ]
                
                const ownerContract = new ethers.Contract(owner, isValidSignatureAbi, provider);

                const isValidSignature = await ownerContract.isValidSignature(hash, signature);

                if (isValidSignature === '0x1626ba7e') {
                    try {
                        const result = await orderBookApi.sendOrder({
                            ...order,
                            sellAmount: order.sellAmount.toString(),
                            buyAmount: order.buyAmount.toString(),
                            feeAmount: order.feeAmount.toString(),
                            validTo: order.validTo.valueOf(),
                            appData: order.appData.toString(),
                            sellTokenBalance: SellTokenSource.ERC20,
                            buyTokenBalance: BuyTokenDestination.ERC20,
                            signature,
                            signingScheme: SigningScheme.EIP1271,
                            from: owner,
                        });
    
                        return {
                            owner,
                            params,
                            order,
                            hash,
                            signature,
                            isValidSignature,
                            result,
                        }
                    } catch (e) {
                        return e;
                    }
                }
            }
        } catch (error) {
            // Ignore (maybe it's not a ConditionalOrderCreated event)
        }
    }
}
