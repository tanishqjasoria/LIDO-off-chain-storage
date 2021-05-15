const NodeOperatorsRegistry = artifacts.require("NodeOperatorsRegistry")


module.exports = async function (deployer) {
  const accounts = await web3.eth.getAccounts()
  await deployer.deploy(NodeOperatorsRegistry, accounts[0], accounts[1])
}