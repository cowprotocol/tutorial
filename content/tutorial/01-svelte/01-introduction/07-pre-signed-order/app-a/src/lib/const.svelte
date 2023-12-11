<script context="module" lang="ts">
  import { SupportedChainId } from '@cowprotocol/cow-sdk'

  export const CHAIN_ID = SupportedChainId.GOERLI
  export const SAFE_SERVICE_URL = 'https://safe-transaction-goerli.safe.global'
  export const SETTLEMENT_CONTRACT_ADDRESS = '0x9008D19f58AAbD9eD0D60971565AA8510560ab41'
  export const SETTLEMENT_CONTRACT_ABI = [
      {
          "inputs": [
              {
                  "internalType": "bytes",
                  "name": "orderUid",
                  "type": "bytes"
              },
              {
                  "internalType": "bool",
                  "name": "signed",
                  "type": "bool"
              }
          ],
          "name": "setPreSignature",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
      }
  ]

  export const APP_DATA = '{"appCode":"CoW Swap-SafeApp","environment":"local","metadata":{"orderClass":{"orderClass":"limit"},"quote":{"slippageBips":"0"}},"version":"0.11.0"}'
  export const APP_DATA_HASH = '0x6bb009e9730f09d18011327b6a1e4b9df70a3eb4d49e7cb622f79caadac5751a'
</script>
