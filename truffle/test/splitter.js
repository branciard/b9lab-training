var Splitter = artifacts.require("./Splitter.sol");

// Found here https://gist.github.com/xavierlepretre/88682e871f4ad07be4534ae560692ee6
web3.eth.getTransactionReceiptMined = function (txnHash, interval) {
  var transactionReceiptAsync;
  interval = interval ? interval : 500;
  transactionReceiptAsync = function(txnHash, resolve, reject) {
    try {
      var receipt = web3.eth.getTransactionReceipt(txnHash);
      if (receipt == null) {
        setTimeout(function () {
          transactionReceiptAsync(txnHash, resolve, reject);
        }, interval);
      } else {
        resolve(receipt);
      }
    } catch(e) {
      reject(e);
    }
  };

  return new Promise(function (resolve, reject) {
      transactionReceiptAsync(txnHash, resolve, reject);
  });
};

// Found here https://gist.github.com/xavierlepretre/afab5a6ca65e0c52eaf902b50b807401
var getEventsPromise = function (myFilter, count) {
  return new Promise(function (resolve, reject) {
    count = count ? count : 1;
    var results = [];
    myFilter.watch(function (error, result) {
      if (error) {
        reject(error);
      } else {
        count--;
        results.push(result);
      }
      if (count <= 0) {
        resolve(results);
        myFilter.stopWatching();
      }
    });
  });
};

// Found here https://gist.github.com/xavierlepretre/d5583222fde52ddfbc58b7cfa0d2d0a9
var expectedExceptionPromise = function (action, gasToUse) {
  return new Promise(function (resolve, reject) {
      try {
        resolve(action());
      } catch(e) {
        reject(e);
      }
    })
    .then(function (txn) {
      return web3.eth.getTransactionReceiptMined(txn);
    })
    .then(function (receipt) {
      // We are in Geth
      assert.equal(receipt.gasUsed, gasToUse, "should have used all the gas");
    })
    .catch(function (e) {
      if ((e + "").indexOf("invalid JUMP") > -1) {
        // We are in TestRPC
      } else {
        throw e;
      }
    });
};

contract('Splitter', function(accounts) {
  it("contract should have 0 balance at start", function() {
    return Splitter.deployed().then(function(instance) {
      return instance.address;
    }).then(function(address) {
      assert.equal(web3.eth.getBalance(address), 0, "contract should have 0 balance at start");
    });
 });

  it("it should split the 4 ether into 2 ethers for each receiver accounts[1] and accounts[2]", function() {
    var accounts1BeforeSplit=web3.fromWei(web3.eth.getBalance(web3.eth.accounts[1]),'ether').toNumber();
    var accounts2BeforeSplit=web3.fromWei(web3.eth.getBalance(web3.eth.accounts[2]),'ether').toNumber();
    return Splitter.deployed().then(function(instance) {
      meta = instance;
      return meta.split({from:web3.eth.accounts[0],value:web3.toWei(4,'ether')});
    }).then(function(result) {
      var accounts1AfterSplit=web3.fromWei(web3.eth.getBalance(web3.eth.accounts[1]),'ether').toNumber();
      var accounts2AfterSplit=web3.fromWei(web3.eth.getBalance(web3.eth.accounts[2]),'ether').toNumber();
      assert.equal(accounts1BeforeSplit+2,accounts1AfterSplit,"accounts1 must have receive 2 ethers");
      assert.equal(accounts2BeforeSplit+2,accounts2AfterSplit,"accounts2 must have receive 2 ethers");
    });
  });

  it("it should be able to split 5 ether into 2.5 for each", function() {
    var accounts1BeforeSplit=web3.fromWei(web3.eth.getBalance(web3.eth.accounts[1]),'ether').toNumber();
    var accounts2BeforeSplit=web3.fromWei(web3.eth.getBalance(web3.eth.accounts[2]),'ether').toNumber();
    return Splitter.deployed().then(function(instance) {
      meta = instance;
      return meta.split({from:web3.eth.accounts[0],value:web3.toWei(5,'ether')});
    }).then(function(result) {
      var accounts1AfterSplit=web3.fromWei(web3.eth.getBalance(web3.eth.accounts[1]),'ether').toNumber();
      var accounts2AfterSplit=web3.fromWei(web3.eth.getBalance(web3.eth.accounts[2]),'ether').toNumber();
      assert.equal(accounts1BeforeSplit+2.5,accounts1AfterSplit,"accounts1 must have receive 2.5 ethers");
      assert.equal(accounts2BeforeSplit+2.5,accounts2AfterSplit,"accounts2 must have receive 2.5 ethers");
    });
  });

  it("it should be able to split 0000000000000000004 wei into 2 parts of 0000000000000000002 wei", function() {
    var accounts1BeforeSplit=web3.eth.getBalance(web3.eth.accounts[1]).toNumber();
    var accounts2BeforeSplit=web3.eth.getBalance(web3.eth.accounts[2]).toNumber();
    return Splitter.deployed().then(function(instance){
      meta = instance;
      return meta.split({from:web3.eth.accounts[0],value:0000000000000000004});
    }).then(function(result) {
      var accounts1AfterSplit=web3.eth.getBalance(web3.eth.accounts[1]).toNumber();
      var accounts2AfterSplit=web3.eth.getBalance(web3.eth.accounts[2]).toNumber();
      assert.equal(accounts1BeforeSplit+0000000000000000002,accounts1AfterSplit,"accounts1 must have receive 0000000000000000002 wei");
      assert.equal(accounts2BeforeSplit+0000000000000000002,accounts2AfterSplit,"accounts2 must have receive 0000000000000000002 wei");
    });
  });

  it("it should failed to split 0000000000000000003 wei into 2 parts. ", function() {
    var accounts1BeforeSplit=web3.eth.getBalance(web3.eth.accounts[1]).toNumber();
    var accounts2BeforeSplit=web3.eth.getBalance(web3.eth.accounts[2]).toNumber();
    return Splitter.deployed().then(function(instance){
      meta = instance;
      return expectedExceptionPromise(function () {
  			return meta.split({from:web3.eth.accounts[0],value:0000000000000000003, gas: 3000000 });
  	    },
  	    3000000);
    })
  });

  it("it should failed to call split function if not account[0] ( owner ) ", function() {
    var accounts1BeforeSplit=web3.eth.getBalance(web3.eth.accounts[1]).toNumber();
    var accounts2BeforeSplit=web3.eth.getBalance(web3.eth.accounts[2]).toNumber();
    return Splitter.deployed().then(function(instance){
      meta = instance;
      return expectedExceptionPromise(function () {
        return meta.split({from:web3.eth.accounts[1],value:0000000000000000004, gas: 3000000 });
        },
        3000000);
    })
  });

    it("it should failed to call kill function if not account[0] ( owner ) ", function() {
      var accounts1BeforeSplit=web3.eth.getBalance(web3.eth.accounts[1]).toNumber();
      var accounts2BeforeSplit=web3.eth.getBalance(web3.eth.accounts[2]).toNumber();
      return Splitter.deployed().then(function(instance){
        meta = instance;
        return expectedExceptionPromise(function () {
          return meta.kill({from:web3.eth.accounts[1], gas: 3000000 });
          },
          3000000);
      })
    });

});
