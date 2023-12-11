<script lang="ts">
    import { Buffer } from 'buffer'
    window.Buffer = Buffer // Yep, this is a hack
    import { OrderBookApi, OrderCreation, OrderKind, SigningScheme, UnsignedOrder } from '@cowprotocol/cow-sdk'
    import { Web3Provider } from '@ethersproject/providers'
    import { Contract } from '@ethersproject/contracts'
    import Safe, { EthersAdapter } from '@safe-global/protocol-kit'
    import { ethers } from 'ethers'
    import SafeApiKit from '@safe-global/api-kit'

    import {
        APP_DATA,
        APP_DATA_HASH,
        CHAIN_ID,
        SAFE_SERVICE_URL,
        SETTLEMENT_CONTRACT_ABI,
        SETTLEMENT_CONTRACT_ADDRESS
    } from './const.svelte'

    const orderBookApi = new OrderBookApi()
    const settlementContract = new Contract(SETTLEMENT_CONTRACT_ADDRESS, SETTLEMENT_CONTRACT_ABI)
    const provider = new Web3Provider(window.ethereum)

    // Connect to injected wallet
    ;(window.ethereum as { enable(): void })?.enable()

    // Set chainId
    orderBookApi.context.chainId = CHAIN_ID

    let safeAddress = '';

    async function createOrder() {
        if (!safeAddress) {
            alert('Please enter a safe address');
            return;
        }

        const defaultOrder: UnsignedOrder = {
            receiver: safeAddress,
            buyAmount: '650942340000000000000',
            buyToken: '0x91056D4A53E1faa1A84306D4deAEc71085394bC8',
            sellAmount: '100000000000000000',
            sellToken: '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6',
            validTo: Math.round((Date.now() + 900_000) / 1000),
            appData: '0x',
            feeAmount: '0',
            kind: OrderKind.SELL,
            partiallyFillable: true,
            signingScheme: SigningScheme.PRESIGN,
        }

        const {safeApiKit, safeSdk} = await getSafeSdkAndKit()

        const account = (await provider.listAccounts())[0]

        try {
            const orderCreation: OrderCreation = {
                ...defaultOrder,
                from: safeAddress,
                signingScheme: SigningScheme.PRESIGN,
                signature: safeAddress,
                appData: APP_DATA,
                appDataHash: APP_DATA_HASH,
            }

            // Send order to CoW Protocol order-book
            const orderId = await orderBookApi.sendOrder(orderCreation)

            const presignCallData = settlementContract.interface.encodeFunctionData('setPreSignature', [
                orderId,
                true,
            ])

            const presignRawTx = {
                to: settlementContract.address,
                data: presignCallData,
                value: '0',
            }

            // Sending pre-signature transaction to settlement contract
            // In this example we are using the Safe SDK, but you can use any other smart-contract wallet
            const safeTx = await safeSdk.createTransaction({safeTransactionData: presignRawTx})
            const signedSafeTx = await safeSdk.signTransaction(safeTx)
            const safeTxHash = await safeSdk.getTransactionHash(signedSafeTx)
            const senderSignature = signedSafeTx.signatures.get(account.toLowerCase())?.data || ''

            await safeApiKit.proposeTransaction({
                safeAddress,
                safeTransactionData: signedSafeTx.data,
                safeTxHash,
                senderAddress: account,
                senderSignature,
            })

            console.log('Result:', {orderId, safeTxHash, senderSignature})
        } catch (e: any) {
            console.error('Error: ', e)
        }
    }

    async function getSafeSdkAndKit() {
        if (!safeAddress) return

        const ethAdapter = new EthersAdapter({
            ethers,
            signerOrProvider: provider.getSigner(0),
        })

        const safeApiKit = new SafeApiKit({
            txServiceUrl: SAFE_SERVICE_URL,
            ethAdapter
        })

        return Safe.create({ethAdapter, safeAddress}).then(safeSdk => {
            return {
                safeApiKit,
                safeSdk
            }
        })
    }
</script>

<div>
    <h4>Safe address:</h4>
    <input bind:value={safeAddress} placeholder="enter your safe address"/>

    <br/>

    <button on:click={createOrder}>Create order</button>
</div>