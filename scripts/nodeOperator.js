const { calculateMerkelRoot, verifyMerkelRoot, getVerificationParams } = require('./merkel')
const { getNodeOperatorDetails, updateNodeOperatorDetails } = require('./contract')
const { getFromIPFS, addToIPFS, getKeyStoreIPFS } = require('./ipfs')

const DEPOSIT_DATA_PATH = '../deposit_data-1621224704.json'
const depositData = require(DEPOSIT_DATA_PATH)

const MAX_BLOCK_SIZE = 100
const PUBKEY_LENGTH = 48
const SIGNATURE_LENGTH = 48


//[Node Operator]: Main Function----------------------------------------------------------------------------------------
module.exports = async function main(callback) {
  try {
    await printKeyStore()

    let keyList = getRandomKeys(200)
    // let keyList = getGeneratedKeys()
    await addKeys(keyList)

    callback(0);
  } catch (error) {
    console.error(error);
    callback(1);
  }
}


//[Node Operator]: Utility Functions------------------------------------------------------------------------------------
async function addKeys(keyList) {

  console.log("Adding new keys!: ", JSON.stringify(keyList))
  const newKeysCount = keyList.length

  let { ipfsHash, merkelRoot } = await getNodeOperatorDetails()
  console.log('Current IPFS Hash: ', ipfsHash.toString())
  console.log('Current Merkle Root: ', merkelRoot.toString())

  let keyStore;
  if (ipfsHash === '') {
    console.log('No keystore initialized for the operator!  Using empty keystore')
    keyStore = []
  } else {
    keyStore = await getKeyStoreIPFS(ipfsHash.toString())
  }

  let prevKeys;
  if (keyStore.length > 0) {
    let obj = keyStore[keyStore.length - 1]
    prevKeys = obj.startIndex + obj.totalKeys - 1
  }

  let blocks = getBlocks(keyList,  prevKeys)
  keyStore = keyStore.concat(blocks)

  let newMerkelRoot = calculateMerkelRoot(keyStore)
  let { path } = await addToIPFS(JSON.stringify(keyStore))
  console.log("New IPFS Path:", path)

  await updateNodeOperatorDetails(path, newMerkelRoot, newKeysCount)
  console.log('Task Complete')
}

function getBlocks(keyList, previousIndex) {

  let blocks = []

  let currentBlock = {
    startIndex: previousIndex + 1,
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

async function printKeyStore() {

  let { ipfsHash, merkelRoot } = await getNodeOperatorDetails()
  console.log('Current IPFS Hash: ', ipfsHash.toString())
  console.log('Current Merkle Root: ', merkelRoot.toString())

  let keyStore = []

  if (ipfsHash === '') {
    console.log('empty')
  } else {
    keyStore = await getKeyStoreIPFS(ipfsHash.toString())
  }
  console.log('Key Store: ', keyStore, merkelRoot)

}


function getRandomKeys(total) {
  let keyList = []
  for (let i=0; i<total; i++) {
    keyList.push({
      pubKey: crypto.randomBytes(PUBKEY_LENGTH).toString('hex'),
      signature: crypto.randomBytes(SIGNATURE_LENGTH).toString('hex')
    })
  }
  return keyList
}


function getGeneratedKeys() {
  let keyList = []
  for (let i=0; i<depositData.length; i++) {
    keyList.push({
      pubKey: depositData[i].pubkey,
      signature: depositData[i].signature
    })
  }
  return keyList
}