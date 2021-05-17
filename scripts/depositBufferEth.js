const { calculateMerkelRoot, verifyMerkelRoot, getVerificationParams }= require('./merkel')
const { getFromIPFS, addToIPFS, getKeyStoreIPFS } = require('./ipfs')
const { getNodeOperatorDetails, updateNodeOperatorDetails } = require('./contract')


//[Deposit Buffer ETH]: Main Function ----------------------------------------------------------------------------------
module.exports = async function main(callback) {
  try {

    let proof = await assignNextKeys()
    callback(0);

  } catch (error) {
    console.error(error);
    callback(1);
  }
}


//[Deposit Buffer ETH]: Utility Functions ------------------------------------------------------------------------------
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
  console.log(await NodeOperatorsRegistry.verify(proof, block.pubKeysHex , block.signatureHex ))
  console.log(proof)
  return proof
}
