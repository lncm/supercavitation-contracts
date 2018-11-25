// var RegistryStub = artifacts.require("RegistryStub");
var SwapOffering = artifacts.require("SwapOffering");

 module.exports = function(deployer) {
  // deployer.deploy(RegistryStub)
  deployer.deploy(SwapOffering, 'https://lndtest.lncm.io/api', '0x0f18cd0F5B7CcE9d6DCC246F80B0fCdd7a2AF150');
 };
