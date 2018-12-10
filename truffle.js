const HDWalletProvider = require("truffle-hdwallet-provider");

const evmNode = process.env.RSK_NODE || 'https://public-node.testnet.rsk.co';

module.exports = {
  networks: {
    rsktestnet: {
      provider: function() {
        if (!process.env.MNEMONIC) { throw "No mnemonic! Run `npm run creds`"; }
        return new HDWalletProvider(process.env.MNEMONIC, evmNode, 0, 1, false, "m/44'/37310'/0'/0/");
      },
      gasPrice: 1,
      network_id: '31'
    },
    ganache: {
      host: "127.0.0.1",
      port: 8545,
      network_id: '*',
    }
  }
};
