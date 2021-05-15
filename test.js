const web3 = require('web3')
const sha3 = web3.utils.soliditySha3

class MerkleTree {
  constructor() {
    this.root = []
    this.merkelRoot = null
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
      console.log(this.root[this.root.length - 1])
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

  verify(keys, totalKeys, proof) {
    let layerLength = totalKeys
    let calc = []
    let totalLength = 0
    let proof_length = proof.length
    while (layerLength > 1) {
      calc = []
      totalLength = keys.length
      if (layerLength % 2){
        calc.push(keys[totalLength - 1])
        totalLength = totalLength - 1
      }
      if (totalLength % 2) {
        keys.unshift(proof[proof_length - 1])
        totalLength += 1
        proof_length -= 1
      }
      while (totalLength > 0) {
        calc.unshift(sha3(keys[totalLength - 2] + keys[totalLength - 1]))
        totalLength = totalLength - 2
      }
      layerLength = (layerLength + 1)/2 | 0
      keys = calc
    }
  }
}

let a = [1,2,3,4,5,6,7]
let totalKeys = 7
let index = 4

let tree = new MerkleTree()
tree.createTree(a)
let proof = tree.getVerificationParams(index)
let keys = a.map(x=>sha3(x)).slice(index)

tree.verify(keys, totalKeys, proof)