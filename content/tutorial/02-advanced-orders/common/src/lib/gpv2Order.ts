import { Order, hashOrder, domain, OrderKind, OrderBalance } from "@cowprotocol/contracts";
import { SupportedChainId, OrderParameters, SellTokenSource, BuyTokenDestination, COW_PROTOCOL_SETTLEMENT_CONTRACT_ADDRESS } from "@cowprotocol/cow-sdk";
import { utils } from "ethers";

export const orderParametersToOrder = (order: OrderParameters): Order => {
    return {
        sellToken: order.sellToken,
        buyToken: order.buyToken,
        receiver: order.receiver,
        sellAmount: order.sellAmount,
        buyAmount: order.buyAmount,
        validTo: order.validTo,
        appData: order.appDataHash,
        feeAmount: order.feeAmount,
        kind: order.kind,
        partiallyFillable: order.partiallyFillable,
        sellTokenBalance: sellTokenBalanceToBalance(order.sellTokenBalance),
        buyTokenBalance: buyTokenBalanceToBalance(order.buyTokenBalance),
    
    }
}

export const onchainOrderToOrder = (onchainOrder: any): Order => {
    return {
        sellToken: onchainOrder[0],
        buyToken: onchainOrder[1],
        receiver: onchainOrder[2],
        sellAmount: onchainOrder[3],
        buyAmount: onchainOrder[4],
        validTo: onchainOrder[5],
        appData: onchainOrder[6],
        feeAmount: onchainOrder[7],
        kind: getKind(onchainOrder[8]),
        partiallyFillable: onchainOrder[9],
        sellTokenBalance: getBalance(onchainOrder[10], true),
        buyTokenBalance: getBalance(onchainOrder[11], false),
    }
}
export const onchainOrderToHash = (onchainOrder: any, chain: SupportedChainId) => hashOrder(
    domain(chain, COW_PROTOCOL_SETTLEMENT_CONTRACT_ADDRESS[chain]),
    onchainOrderToOrder(onchainOrder)
);

const sellTokenBalanceToBalance = (sellTokenBalance: SellTokenSource) => {
    switch (sellTokenBalance) {
        case SellTokenSource.ERC20:
            return OrderBalance.ERC20;
        case SellTokenSource.INTERNAL:
            return OrderBalance.INTERNAL;
        case SellTokenSource.EXTERNAL:
            return OrderBalance.EXTERNAL;
        default:
            throw new Error(`Unknown sell token balance: ${sellTokenBalance}`);
    }
}

const buyTokenBalanceToBalance = (buyTokenBalance: BuyTokenDestination) => {
    switch (buyTokenBalance) {
        case BuyTokenDestination.ERC20:
            return OrderBalance.ERC20;
        case BuyTokenDestination.INTERNAL:
            return OrderBalance.INTERNAL;
        default:
            throw new Error(`Unknown buy token balance: ${buyTokenBalance}`);
    }
}

const getBalance = (balance: string, isSell: boolean) => {
    switch (balance) {
        // buy and sell
        case utils.keccak256(utils.toUtf8Bytes('erc20')):
            return OrderBalance.ERC20;
        // buy and sell
        case utils.keccak256(utils.toUtf8Bytes('internal')):
            return OrderBalance.INTERNAL;
        // sell only
        case utils.keccak256(utils.toUtf8Bytes('external')):
            if (!isSell) {
                throw new Error('Invalid balance');
            }
            return OrderBalance.EXTERNAL;
        default:
            throw new Error(`Unknown balance: ${balance}`);
    }
}

const getKind = (kind: string) => {
    switch (kind) {
        case utils.keccak256(utils.toUtf8Bytes('sell')):
            return OrderKind.SELL;
        case utils.keccak256(utils.toUtf8Bytes('buy')):
            return OrderKind.BUY;
        default:
            throw new Error(`Unknown kind: ${kind}`);
    }

}