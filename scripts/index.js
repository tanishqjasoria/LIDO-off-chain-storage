const ipfsAPI = require('ipfs-http-client');
const { globSource, create } = ipfsAPI
const ipfs = create({host: 'ipfs.infura.io', port: '5001', protocol: 'https' })
const BufferList = require('bufferlist').BufferList;

module.exports = async function main(callback) {
  try {
    await getKey()
    await addKey('this', 'not')
    await getKey()
    callback(0);
  } catch (error) {
    console.error(error);
    callback(1);
  }
}

async function addKey(pubkey, signature) {

  console.log("Adding new keys!")
  const contract = artifacts.require("NodeOperatorsRegistry")
  const NodeOperatorsRegistry = await contract.deployed()

  let ipfsHash = await NodeOperatorsRegistry.getIPFSHash()
  console.log('Current IPFS Hash: ', ipfsHash.toString())

  let keyStore = { pubKey:[], signature:[] }

  if (ipfsHash === '') {
    console.log('empty')
  } else {
    keyStore = await getKeyStoreIPFS(ipfsHash.toString())
  }
  console.log('Current Key Store: ', keyStore)

  keyStore.pubKey.push(pubkey)
  keyStore.signature.push(signature)
  console.log('New Key Store: ', keyStore)

  let { path } = await addToIPFS(JSON.stringify(keyStore))
  console.log("New IPFS Path:", path)
  const accounts = await web3.eth.getAccounts()
  console.log(accounts)
  try {
    let result = await NodeOperatorsRegistry.addIPFSHash(path, {from: accounts[1]})
  } catch (error) {
    console.log('Contract call failed')
    return
  }
  console.log('Add Complete')
}

async function getKey() {

  const contract = artifacts.require("NodeOperatorsRegistry")
  const NodeOperatorsRegistry = await contract.deployed()

  let ipfsHash = await NodeOperatorsRegistry.getIPFSHash()
  console.log('IPFS Path: ', ipfsHash.toString())

  let keyStore = { pubKey:[], signature:[] }

  if (ipfsHash === '') {
    console.log('empty')
  } else {
    keyStore = await getKeyStoreIPFS(ipfsHash.toString())
  }
  console.log('Key Store: ', keyStore)

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
