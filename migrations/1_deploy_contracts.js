var RegistryStub = artifacts.require("RegistryStub");
// var SwapOffering = artifacts.require("SwapOffering");

 module.exports = function(deployer) {
  deployer.deploy(RegistryStub)
  // deployer.deploy(SwapOffering, 'https://lndtest.lncm.io/api', '0xef899220a9f3ee569e5b629b655991f8bcebe184');
 };
