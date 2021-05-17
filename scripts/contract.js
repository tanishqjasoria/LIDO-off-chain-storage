const Web3 = require('web3')
let web3 = new Web3("ws://localhost:8545")

async function getNodeOperatorDetails(contract) {

  const NodeOperatorsRegistry = await contract.deployed()
  const details = await NodeOperatorsRegistry.getOperatorDetails()

  const ret = {
    ipfsHash: details['0'],
    merkelRoot: details['1'],
    usedKeys: parseInt(details['2'].toString())
  }
  return ret
}


async function updateNodeOperatorDetails(contract, ipfsHash, merkelRoot, newKeysCount) {

  const NodeOperatorsRegistry = await contract.deployed()
  const accounts = await web3.eth.getAccounts()
  try {
    let result = await NodeOperatorsRegistry.updateOperatorDetails(
      ipfsHash, merkelRoot, newKeysCount, {from: accounts[0]})
  } catch (error) {
    console.log('Contract call failed', error)
  }
}


async function approveKeys(contract, approvedIpfsHash, approvedMerkleRoot, approvedKeys) {

  const NodeOperatorsRegistry = await contract.deployed()
  const accounts = await web3.eth.getAccounts()

  try {
    let result = await NodeOperatorsRegistry.approveKeys(approvedIpfsHash, approvedMerkleRoot, approvedKeys, {from: accounts[1]})
    // console.log(result)
  } catch (error) {
    console.log('Contract call failed', error)
  }
}


async function depositBufferEther(contract, proof, pubKeys, signature, keyCount) {
  const NodeOperatorsRegistry = await contract.deployed()
  const accounts = await web3.eth.getAccounts()

  try {
    let result = await NodeOperatorsRegistry.depositBufferedEther(proof, pubKeys, signature, keyCount, {from: accounts[1]})
    // console.log(result)
  } catch (error) {
    console.log('Contract call failed', error)
  }
}

module.exports = { getNodeOperatorDetails, updateNodeOperatorDetails, approveKeys, depositBufferEther }