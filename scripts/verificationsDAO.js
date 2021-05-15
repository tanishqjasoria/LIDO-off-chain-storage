const { calculateMerkelRoot, verifyMerkelRoot, getVerificationParams } = require('./merkel')
const contract = artifacts.require("NodeOperatorsRegistry")
const { getFromIPFS, addToIPFS } = require('./ipfs')

module.exports = async function main(callback) {
  try {

    await verifyKeyStore()
    callback(0);

  } catch (error) {
    console.error(error);
    callback(1);
  }
}


async function verifyKeyStore() {
  let ret_obj = await getNodeOperatorDetails()
  let ipfsHash = ret_obj['0']
  let merkelRoot = ret_obj['1']
  let usedKeys = ret_obj['2']

  let keyStore = await getKeyStoreIPFS(ipfsHash.toString())

  // console.log(keyStore)
  // Verify the merkle root
  if (verifyMerkelRoot(keyStore, merkelRoot)) {
    console.log("Merkel Verification Passed")
  } else {
    throw new Error('Merkle Verification Failed')
  }

  // check of duplicates
  if (checkDuplicates(keyStore)) {
    console.log("No Duplicates Found")
  } else {
    throw new Error('Duplicate Keys Found')
  }

  // TODO: check for correct credentials

}

function checkDuplicates(keyStore) {

  let keySet = new Set()
  for (let i=0; i < keyStore.length; i++) {
    let block = keyStore[i]
    console.log(block)
    for (let j=0; j < block.keyList.length; j++) {
      console.log(block.keyList[j].pubKey)
      if ( keySet.has(block.keyList[j].pubKey) ) {
        return false
      } else {
        keySet.add(block.keyList[j].pubKey)
      }
    }
  }
  return true
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