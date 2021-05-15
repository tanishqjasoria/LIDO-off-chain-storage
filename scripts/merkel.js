const web3 = require('web3')
const sha3 = web3.utils.soliditySha3

class MerkleTree {
  constructor() {
    this.root = []
    this.merkelRoot = None
  }

  createTree(key_list) {
    this.root.push(key_list.map(x => sha3(x)))

    while (this.root[this.root.length - 1].length > 1) {
      let temp = [];

      for (let index = 0; index < this.root[this.root.length - 1].length; index += 2) {
        if (index < this.root[this.root.length - 1].length - 1 && index % 2 === 0)
          temp.push(sha3(this.root[this.root.length - 1][index] + this.root[this.root.length - 1][index + 1]));
        else temp.push(this.root[this.root.length - 1][index]);
      }
      this.root.push(temp);
    }
    this.merkelRoot = this.root[this.root.length - 1][0]
  }

  getVerificationParams(index) {
    let proof = []
    for (let i = 0; i < this.root.length; i++) {
      const layer = this.root[i]
      const isRightNode = index % 2
      const pairIndex = (isRightNode ? index - 1: index + 1)

      if (pairIndex < layer.length && isRightNode) {
        proof.push(layer[pairIndex])
      }
      index = (index / 2) | 0
    }

    return proof
  }
}

function calculateMerkelRoot(key_list) {
  const tree = new MerkleTree()
  key_list = formatKeyList(key_list)
  tree.createTree(key_list)
  return tree.merkelRoot
}

function verifyMerkelRoot(key_list, root) {
  const tree = new MerkleTree()
  key_list = formatKeyList(key_list)
  tree.createTree(key_list)
  const new_root = tree.merkelRoot
  if (new_root === root){
    return true
  } else {
    return false
  }
}

function formatKeyList(key_list) {
  let format = []

  for (let i = 0; i < key_list.length; i++) {
    let obj = key_list[i]
    format.push(obj.pubkey + obj.signature)
  }

  return format
}


module.exports = { calculateMerkelRoot, verifyMerkelRoot }