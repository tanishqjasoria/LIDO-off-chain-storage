const { calculateMerkelRoot, verifyMerkelRoot, getVerificationParams }= require('./merkel')
const contract = artifacts.require("NodeOperatorsRegistry")
const { getFromIPFS, addToIPFS } = require('./ipfs')

module.exports = async function main(callback) {
  try {

    let proof = await assignNextKeys()
    callback(0);

  } catch (error) {
    console.error(error);
    callback(1);
  }
}


async function assignNextKeys() {

  let ret_obj = await getNodeOperatorDetails()
  let ipfsHash = ret_obj['0']
  let merkelRoot = ret_obj['1']
  let usedKeys = ret_obj['2']

  let keyStore = await getKeyStoreIPFS(ipfsHash.toString())

  let block;
  for (let i=0; i <= keyStore.length; i++){
    if (keyStore[i].startIndex >= 200 + 1) {
      block = keyStore[i]
      break
    }
  }

  let proof = getVerificationParams(keyStore, block)

  const NodeOperatorsRegistry = await contract.deployed()
  console.log(await NodeOperatorsRegistry.a_verify(merkelRoot, proof, block.pubKeysHex, block.signatureHex ))
  console.log(proof)
  return proof
}


async function getKeyStoreIPFS(ipfsHash) {
  const content = await getFromIPFS(ipfsHash)
  return JSON.parse(content.toString())
}

async function getNodeOperatorDetails() {
  const NodeOperatorsRegistry = await contract.deployed()

  return await NodeOperatorsRegistry.getOperatorDetails()
}

async function updateNodeOperatorDetails(ipfsHash, merkelRoot, newKeysCount) {
  // TODO: update this function to connect metamask on frontend and use that to submit transaction to ethereum
  const NodeOperatorsRegistry = await contract.deployed()
  const accounts = await web3.eth.getAccounts()
  try {
    let result = await NodeOperatorsRegistry.updateOperatorDetails(
      ipfsHash, merkelRoot, newKeysCount, {from: accounts[0]})
  } catch (error) {
    console.log('Contract call failed', error)
  }
}