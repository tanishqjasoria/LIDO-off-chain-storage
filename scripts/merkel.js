const { MerkleTree } = require('merkletreejs')
const SHA256 = require('crypto-js/sha256')

const leaves = ['a', 'b', 'c'].map(x => SHA256(x))
const tree = new MerkleTree(leaves, SHA256)
const root = tree.getRoot().toString('hex')
const leaf = SHA256('a')
const proof = tree.getProof(leaf)
console.log(tree.verify(proof, leaf, root)) // true

function calculateMerkelRoot(key_list) {
  const leaves = key_list.map(x => SHA256(x))
  const tree = new MerkleTree(leaves, SHA256)
  const root = tree.getRoot().toString('hex')

  return root
}

function verifyMerkelRoot(key_list, root) {
  const leaves = key_list.map(x => SHA256(x))
  const tree = new MerkleTree(leaves, SHA256)
  const new_root = tree.getRoot().toString('hex')
  if (new_root === root){
    return true
  } else {
    return false
  }

}

module.exports = { calculateMerkelRoot, verifyMerkelRoot }