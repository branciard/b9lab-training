var Splitter = artifacts.require("./Splitter.sol");
//extensions.js : credit to : https://github.com/coldice/dbh-b9lab-hackathon/blob/development/truffle/utils/extensions.js
const Extensions = require("../utils/extensions.js");
Extensions.init(web3, assert);

contract('Splitter', function(accounts) {

  var owner, receiver1, receiver2;

    before("should prepare accounts", function() {
        assert.isAtLeast(accounts.length, 3, "should have at least 3 accounts");
        owner = accounts[0];
        receiver1 = accounts[1];
        receiver2 = accounts[2];
        return Extensions.makeSureAreUnlocked(
                [ owner ])
                .then(() => web3.eth.getBalancePromise(owner))
                          .then(balance => assert.isTrue(
                          web3.toWei(web3.toBigNumber(1), "ether").lessThan(balance),
                          "should have at least 1 ether, not " + web3.fromWei(balance, "ether")));

    });

 it("contract should have 0 balance at start", function() {
    return Splitter.deployed()
    .then( instance => instance.address )
    .then( address  => web3.eth.getBalancePromise(address))
    .then( balance  => assert.strictEqual(balance.toString(16), '0', "contract should have 0 balance at start"));
 });

  describe("Regular actions", function() {

    var splitterInstance;
    var receiver1InitialBalance;
    var receiver2InitialBalance;

    beforeEach("should collect user 1 and user 2 intial balance and instanciate the splitter", function() {
        return web3.eth.getBalancePromise(receiver1)
        .then(balance => {
             receiver1InitialBalance =balance;
             return web3.eth.getBalancePromise(receiver2);
          })
        .then(balance => {
          receiver2InitialBalance=balance;
          return Splitter.deployed();
          })
        .then(instance => {splitterInstance = instance;} );
    });

  it("it should split the 4 wei into 2 wei for each receiver receiver1 and receiver2", function() {
      return splitterInstance.split.call({from:owner,value:4})
     .then(successful => {
        assert.isTrue(successful, "should be possible to call split");
        return splitterInstance.split({from:owner,value:4, gas: 3000000});
      })
     .then(txObject => {
        assert.isBelow(txObject.receipt.gasUsed, 3000000, "should not use all gas");
        return web3.eth.getBalancePromise(receiver1);
      })
     .then( receiver1CurrentBalance => {
         assert.strictEqual(receiver1CurrentBalance.minus(2).toString(16), receiver1InitialBalance.toString(16) , "receiver1 must receive 2 wei");
         return web3.eth.getBalancePromise(receiver2);
     })
     .then( receiver2CurrentBalance => {
       assert.strictEqual(receiver2CurrentBalance.minus(2).toString(16), receiver2InitialBalance.toString(16) , "receiver2 must receive 2 wei");
       return web3.eth.getBalancePromise(splitterInstance.address);
     })
     .then( splitterInstanceCurrentBalance => {
       assert.strictEqual(splitterInstanceCurrentBalance.toString(16), '0', "contract should have 0 balance at the end");
     });
  });
});

describe("Irregular actions", function() {
    var splitterInstance;

  beforeEach("should instanciate the Splitter", function() {
      return Splitter.deployed().then(instance => {splitterInstance = instance;} );
  });

  it("it should failed to split 0000000000000000003 wei into 2 parts. ", function() {
      return Extensions.expectedExceptionPromise(function () {
  			return splitterInstance.split({from:owner,value:3, gas: 3000000 });
  	    },
  	    3000000);
  });

  it("it should failed to call split function if not owner ", function() {
      return Extensions.expectedExceptionPromise(function () {
        return splitterInstance.split({from:receiver1,value:4, gas: 3000000 });
        },
        3000000);
  });

    it("it should failed to call kill function if not owner ", function() {
        return Extensions.expectedExceptionPromise(function () {
          return splitterInstance.kill({from:receiver1, gas: 3000000 });
          },
          3000000);
    });
  });
});
