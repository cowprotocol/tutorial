import express from 'express'
import { StandardMerkleTree } from '@openzeppelin/merkle-tree'

const app = express()
const port = 3117

app.get('/', (_, res) => {
  res.send('Server Hello World!')
})

app.get('/merkle-tree', (_, res) => {
  const values = [
    ['0x1111111111111111111111111111111111111111', '5000000000000000000'],
    ['0x2222222222222222222222222222222222222222', '2500000000000000000']
  ];

  const tree = StandardMerkleTree.of(values, ['address', 'uint256']);

  res.json(tree)
})

app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})
