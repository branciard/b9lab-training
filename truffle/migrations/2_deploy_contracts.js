var Splitter = artifacts.require("./Splitter");

module.exports = function(deployer) {
deployer.deploy(Splitter,web3.eth.accounts[1],web3.eth.accounts[2]);

/*deployer.then(function() {
  return web3.eth.getAccounts;
}).then(function (accounts) {
  account1=accounts[1];
  account2=accounts[2];
  deployer.deploy(Splitter,account1,account2);
});

it gives error :

Saving successful migration to network...
(node:22868) UnhandledPromiseRejectionWarning: Unhandled promise
rejection (rejection id: 1): TypeError: Cannot convert undefined or null to object
Saving artifacts...

*/

};
