var SwapOffering = artifacts.require("SwapOffering");

const url = 'https://bob.lncm.io';
const owner = '0x0f18cd0f5b7cce9d6dcc246f80b0fcdd7a2af150';
// const satoshis = 100;

 module.exports = async function(deployer) {;
  await deployer.deploy(SwapOffering, url, owner);
  // TODO fix this... ?
  // console.log(`Funding contract with ${satoshis} satoshis of RBTC...`);
  // await (await SwapOffering.deployed()).fundContract({ value: satoshis * 1e10, from: owner, gasPrice: 1, gas: 6000000 });
};
