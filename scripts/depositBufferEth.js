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

  let proof = getVerificationParams(keyStore, 1)
  let to_ret = ''
  for (let i = 0; i < proof.length; i++) {
    to_ret = to_ret + proof[i]
  }
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