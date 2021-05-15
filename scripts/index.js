// const web3 = require("web3");
const { calculateMerkelRoot, verifyMerkelRoot } = require('./merkel')
const contract = artifacts.require("NodeOperatorsRegistry")
const { getFromIPFS, addToIPFS } = require('./ipfs')


module.exports = async function main(callback) {
  try {
    await getKeyStore()
    await addKeys([{pubkey:'this', signature:'not'}])
    await getKeyStore()
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


async function addKeys(key_objects) {

  // console log
  console.log("Adding new keys!: ", JSON.stringify(key_objects))
  const newKeysCount = key_objects.length

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

  // let is_untampered = verifyMerkelRoot(keyStore, merkelRoot)
  // console.log('Verified : ', is_untampered)
  //
  // if (is_untampered === false) {
  //   console.log('Merkel Root Verification FAILED')
  //   console.log('EXITING!')
  //   return
  // }

  // Update key-store with new keys
  for (let i=0; i < key_objects.length; i++) {
    keyStore.push(key_objects[i])
  }
  console.log('New Key Store: ', keyStore)

  // calculate merkel root for new key-store
  let newMerkelRoot = calculateMerkelRoot(keyStore)

  // Add new key-store to IPFS
  let { path } = await addToIPFS(JSON.stringify(keyStore))
  console.log("New IPFS Path:", path)

  // update contract with new IPFS hash and merkel root
  await updateNodeOperatorDetails(path, newMerkelRoot, newKeysCount)

  console.log('Add Complete')
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