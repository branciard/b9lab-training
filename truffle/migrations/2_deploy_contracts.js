var Splitter = artifacts.require("./Splitter");

//https://gist.github.com/xavierlepretre/ed82f210df0f9300493d5ca79893806a#file-getaccountspromise-js
web3.eth.getAccountsPromise = function () {
    return new Promise(function (resolve, reject) {
        web3.eth.getAccounts(function (e, accounts) {
            if (e != null) {
                reject(e);
            } else {
                resolve(accounts);
            }
        });
    });
};

module.exports = function(deployer) {

deployer.then(() => web3.eth.getAccountsPromise())
        .then(accounts =>  deployer.deploy(Splitter,accounts[1],accounts[2]));

};
