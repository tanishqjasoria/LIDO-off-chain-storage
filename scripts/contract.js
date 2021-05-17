const contract = artifacts.require("NodeOperatorsRegistry")


async function getNodeOperatorDetails() {

  const NodeOperatorsRegistry = await contract.deployed()
  const details = await NodeOperatorsRegistry.getOperatorDetails()
  const ret = {
    ipfsHash: details['0'],
    merkelRoot: details['1'],
    usedKeys: details['2']
  }
  return ret
}


async function updateNodeOperatorDetails(ipfsHash, merkelRoot, newKeysCount) {

  const NodeOperatorsRegistry = await contract.deployed()
  const accounts = await web3.eth.getAccounts()
  try {
    let result = await NodeOperatorsRegistry.updateOperatorDetails(
      ipfsHash, merkelRoot, newKeysCount, {from: accounts[0]})
    console.log(result)
  } catch (error) {
    console.log('Contract call failed', error)
  }
}


module.exports = { getNodeOperatorDetails, updateNodeOperatorDetails }