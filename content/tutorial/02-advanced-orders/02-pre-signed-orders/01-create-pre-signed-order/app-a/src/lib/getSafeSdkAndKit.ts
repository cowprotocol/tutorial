import Safe, { EthersAdapter } from '@safe-global/protocol-kit'
import { ethers } from 'ethers'
import SafeApiKit from '@safe-global/api-kit'
import type { Web3Provider } from '@ethersproject/providers'
import {SAFE_TRANSACTION_SERVICE_URL} from './const'

interface SafeSdkAndKit {
  safeApiKit: SafeApiKit,
  safeSdk: Safe
}

export async function getSafeSdkAndKit(chainId: number, provider: Web3Provider, safeAddress: string): Promise<SafeSdkAndKit> {
  const ethAdapter = new EthersAdapter({
    ethers,
    signerOrProvider: provider.getSigner(0),
  })
  const safeApiKit = new SafeApiKit({
    txServiceUrl: SAFE_TRANSACTION_SERVICE_URL[chainId],
    ethAdapter
  })

  return Safe.create({ethAdapter, safeAddress}).then(safeSdk => {
    return {
      safeApiKit,
      safeSdk
    }
  })
}
