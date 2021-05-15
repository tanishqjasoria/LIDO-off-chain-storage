// const web3 = require("web3");
const { calculateMerkelRoot, verifyMerkelRoot, getVerificationParams } = require('./merkel')
const contract = artifacts.require("NodeOperatorsRegistry")
const { getFromIPFS, addToIPFS } = require('./ipfs')
const crypto = require("crypto");

const MAX_BLOCK_SIZE = 100
const PUBKEY_LENGTH = 48
const SIGNATURE_LENGTH = 48

module.exports = async function main(callback) {
  try {
    let TOTAL = 200
    await getKeyStore()
    let keys = []
    for (let i=0; i<=TOTAL; i++){
      keys.push({
        pubKey: crypto.randomBytes(PUBKEY_LENGTH).toString('hex'),
        signature: crypto.randomBytes(SIGNATURE_LENGTH).toString('hex')
      })
    }
    await addKeys(keys)
    // await getKeyStore()
    callback(0);
  } catch (error) {
    console.error(error);
    callback(1);
  }
}


// let key_object = {
//   pubkey: pubkey,
//   signature: signature
// }


async function addKeys(keyList) {

  // console log
  console.log("Adding new keys!: ", JSON.stringify(keyList))
  const newKeysCount = keyList.length

  // fetch required fields from the contract
  let ret_obj = await getNodeOperatorDetails()
  let ipfsHash = ret_obj['0']
  let merkelRoot = ret_obj['1']

  console.log('Current IPFS Hash: ', ipfsHash.toString())
  console.log('Current Merkle Root: ', merkelRoot.toString())


  // fetch keystore from IPFS
  let keyStore = []
  if (ipfsHash === '') {
    console.log('empty')
  } else {
    keyStore = await getKeyStoreIPFS(ipfsHash.toString())
  }
  console.log('Current Key Store: ', keyStore)

  let prevKeys = 0
  if (keyStore) {
    let obj = keyStore[keyStore.length - 1]
    prevKeys = obj.startIndex + obj.totalKeys - 1
  }
  let blocks = getBlocks(keyList,  prevKeys)
  // console.log(blocks)
  keyStore = keyStore.concat(blocks)

  // console.log('New Key Store: ', keyStore)

  // calculate merkel root for new key-store
  let newMerkelRoot = calculateMerkelRoot(keyStore)

  // Add new key-store to IPFS
  let { path } = await addToIPFS(JSON.stringify(keyStore))
  console.log("New IPFS Path:", path)

  // update contract with new IPFS hash and merkel root
  await updateNodeOperatorDetails(path, newMerkelRoot, newKeysCount)

  console.log('Add Complete')
}

function getBlocks(keyList, previousIndex) {

  let blocks = []


  let currentBlock = {
    startIndex:previousIndex + 1,
    totalKeys:0,
    keyList: [],
    pubKeysHex:'',
    signatureHex:''
  }

  for (let i=0; i < keyList.length; i++ ) {
    if (currentBlock.keyList.length >= MAX_BLOCK_SIZE){
      blocks.push(currentBlock)
      currentBlock = {startIndex:previousIndex + 1 + i, totalKeys:0, keyList: [], pubKeysHex:'', signatureHex:''}
    }
    currentBlock.totalKeys += 1
    currentBlock.keyList.push(keyList[i])
    currentBlock.pubKeysHex += keyList[i].pubKey
    currentBlock.signatureHex += keyList[i].signature
  }

  blocks.push(currentBlock)
  console.log("Blocks Created: ", blocks.length)
  return blocks
}

async function getKeyStore() {

  const contract = artifacts.require("NodeOperatorsRegistry")
  const NodeOperatorsRegistry = await contract.deployed()

  // fetch required fields from the contract
  let ret_obj = await getNodeOperatorDetails()
  let ipfsHash = ret_obj['0']
  let merkelRoot = ret_obj['1']
  console.log('IPFS Path: ', ipfsHash.toString())

  let keyStore = []

  if (ipfsHash === '') {
    console.log('empty')
  } else {
    keyStore = await getKeyStoreIPFS(ipfsHash.toString())
  }
  console.log('Key Store: ', keyStore, merkelRoot)

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