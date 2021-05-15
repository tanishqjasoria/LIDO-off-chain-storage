const ipfsAPI = require('ipfs-http-client');
const { globSource, create } = ipfsAPI
const ipfs = create({host: 'ipfs.infura.io', port: '5001', protocol: 'https' })
const BufferList = require('bufferlist').BufferList;
const { calculateMerkelRoot, verifyMerkelRoot } = require('./merkel')
const contract = artifacts.require("NodeOperatorsRegistry")

const LIMIT_KEY_IN_ONE_CONTRACT_CALL = 20

module.exports = async function main(callback) {
  try {
    await getKeyStore()
    await addKey('this', 'not')
    await getKeyStore()
    callback(0);
  } catch (error) {
    console.error(error);
    callback(1);
  }
}

async function addKeys(key_objects) {

  // let key_object = {
  //   pubkey: pubkey,
  //   signature: signature
  // }
  console.log("Adding new keys!: ", JSON.stringify(key_object))

  const NodeOperatorsRegistry = await contract.deployed()

  let ret_obj = await NodeOperatorsRegistry.getIPFSHashMerkelRoot()
  let ipfsHash = ret_obj['0']
  let merkelRoot = ret_obj['1']
  console.log('Current IPFS Hash: ', ipfsHash.toString())

  let keyStore = []

  if (ipfsHash === '') {
    console.log('empty')
  } else {
    keyStore = await getKeyStoreIPFS(ipfsHash.toString())
  }
  console.log('Current Key Store: ', keyStore)

  let is_untampered = verifyMerkelRoot(keyStore, merkelRoot)
  console.log('Verified : ', is_untampered)

  if (is_untampered === false) {
    console.log('Merkel Root Verification FAILED')
    console.log('EXITING!')
    return
  }

  let unused_keys = [[]]
  let j = 0
  for (let i=0; i < key_objects.length; i++) {
    keyStore.push(key_objects[i])
    if (unused_keys[j].length < LIMIT_KEY_IN_ONE_CONTRACT_CALL) {
      unused_keys[j].push(key_objects[i])
    }
  }
  console.log('New Key Store: ', keyStore)
  let newMerkelRoot = calculateMerkelRoot(keyStore)

  let { path } = await addToIPFS(JSON.stringify(keyStore))
  console.log("New IPFS Path:", path)
  const accounts = await web3.eth.getAccounts()
  console.log(accounts)
  try {
    let result = await NodeOperatorsRegistry.addIPFSHashMerkelRoot(path, newMerkelRoot, {from: accounts[0]})
  } catch (error) {
    console.log('Contract call failed')
    return
  }
  console.log('Add Complete')
}

async function getKeyStore() {

  const contract = artifacts.require("NodeOperatorsRegistry")
  const NodeOperatorsRegistry = await contract.deployed()

  let ret_obj = await NodeOperatorsRegistry.getIPFSHashMerkelRoot()
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

const getFromIPFS = async hashToGet => {
  for await (const file of ipfs.get(hashToGet)) {
    if (!file.content) continue;
    const content = new BufferList()
    for await (const chunk of file.content) {
      content.push(chunk)
    }
    return content
  }
}

const addToIPFS = async keyStore => {
  let path = await ipfs.add(keyStore)
  return path
}

// const ipfsAPI = require('ipfs-http-client');
// const { globSource, create } = ipfsAPI
// const ipfs = create({host: 'ipfs.infura.io', port: '5001', protocol: 'https' })
