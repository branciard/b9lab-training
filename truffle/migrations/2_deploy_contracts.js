//var ConvertLib = artifacts.require("./ConvertLib.sol");
//var MetaCoin = artifacts.require("./MetaCoin.sol");
var Splitter = artifacts.require("./Splitter");

module.exports = function(deployer) {
//  deployer.deploy(ConvertLib);
//  deployer.link(ConvertLib, MetaCoin);
//  deployer.deploy(MetaCoin);
  deployer.deploy(Splitter,web3.eth.accounts[1],web3.eth.accounts[2]);
};
