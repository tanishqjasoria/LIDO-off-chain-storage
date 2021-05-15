const keccak256 = require('keccak256')

const { MerkleTree } = require('merkletreejs')



function calculateMerkelRoot(keyStore) {
  let keyBlocks = formatKeyList(keyStore)

  let leaves = keyBlocks.map(x => keccak256(x))
  const tree = new MerkleTree(leaves, keccak256, { sort: true })

  return tree.getHexRoot()

}

function verifyMerkelRoot(keyStore, root) {
  let keyBlocks = formatKeyList(keyStore)

  let leaves = keyBlocks.map(x => keccak256(x))
  const tree = new MerkleTree(leaves, keccak256, { sort: true })
  return tree.getHexRoot() === root;
}

function formatKeyList(keyStore) {
  let blockStrings = []

  for (let i = 0; i < keyStore.length; i++) {
    let block = keyStore[i]
    blockStrings.push(block.pubKeysHex + block.signatureHex)
  }

  return blockStrings
}

function getVerificationParams(keyStore, block) {

  let keyBlocks = formatKeyList(keyStore)

  let leaves = keyBlocks.map(x => keccak256(x))
  const tree = new MerkleTree(leaves, keccak256, { sort: true })

  return tree.getHexProof(keccak256(block.pubKeysHex + block.signatureHex))
}


module.exports = { calculateMerkelRoot, verifyMerkelRoot, getVerificationParams }