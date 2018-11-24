const HDWalletProvider = require("truffle-hdwallet-provider");

const ethDerivation = "m/44'/60'/0'/0/";
const rskDerivation = "m/44'/137'/0'/0/";
const rskTestnetDerivation = "m/44'/37310'/0'/0/";

module.exports = {
  networks: {
    rsktestnet: {
      provider: function() {
        return new HDWalletProvider(process.env.MNEMONIC.trim(), process.env.RSK_NODE, 0, 1, false, rskTestnetDerivation)
      },
      gasPrice: 1,
      network_id: '31'
    }
  }
};
