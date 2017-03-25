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
                [ owner,receiver1 ])// also check unlock for receiver1 : needed for Irregular test
                .then(() => web3.eth.getBalancePromise(owner))
                //check owner has at least 2 ether
                .then(balance => assert.isTrue(
                          web3.toWei(web3.toBigNumber(2), "ether").lessThan(balance),
                          "owner should have at least 2 ether, not " + web3.fromWei(balance, "ether"))
                )
                .then(() => Extensions.refillAccount(owner,receiver1,1))
                .then(() => Extensions.refillAccount(owner,receiver2,1));
    });

  describe("Regular actions", function() {

    var splitterInstance;
    var receiver1InitialBalance;
    var receiver2InitialBalance;

    beforeEach("should collect user 1 and user 2 intial balance and Retrieve the deployed Splitter instance", function() {
      return Promise.all([
        web3.eth.getBalancePromise(receiver1),
        web3.eth.getBalancePromise(receiver2),
        Splitter.new(receiver1,receiver2)
      ])
      .then(result => {
        receiver1InitialBalance=result[0];
        receiver2InitialBalance=result[1];
        splitterInstance =result[2];
      });
    });

    it("contract should have 0 balance at start", function() {
         return web3.eth.getBalancePromise(splitterInstance.address)
         .then( balance  => assert.strictEqual(balance.toString(10), '0', "contract should have 0 balance at start"));
    });

    it("it should split the 4 wei into 2 wei for each receiver receiver1 and receiver2", function() {
        return splitterInstance.split.call({from:owner,value:4})
        .then(successful => {
          assert.isTrue(successful, "should be possible to call split");
          return splitterInstance.split({from:owner,value:4, gas: 3000000});
        })
        .then(txMined => {
          assert.isBelow(txMined.receipt.gasUsed, 3000000, "should not use all gas");
          //check LogSplit event
          assert.strictEqual(txMined.logs[0].args.amountReceive.toNumber(),2, "check amountReceivelog log event. must be 2");
          assert.strictEqual(txMined.logs[0].args.sender,owner, "check sender log event. must be the owner");
          assert.strictEqual(txMined.logs[0].args.receiver1,receiver1, "check receiver1 log event");
          assert.strictEqual(txMined.logs[0].args.receiver2,receiver2, "check receiver2 log event");
          return Promise.all([
  	    		web3.eth.getBalancePromise(receiver1),
  	    		web3.eth.getBalancePromise(receiver2),
            web3.eth.getBalancePromise(splitterInstance.address)
      		]);
        })
       .then( currentBalance => {
           receiver1CurrentBalance=currentBalance[0];
           receiver2CurrentBalance=currentBalance[1];
           splitterInstanceCurrentBalance=currentBalance[2];
           assert.strictEqual(receiver1CurrentBalance.minus(2).toString(10), receiver1InitialBalance.toString(10) , "receiver1 must receive 2 wei");
           assert.strictEqual(receiver2CurrentBalance.minus(2).toString(10), receiver2InitialBalance.toString(10) , "receiver2 must receive 2 wei");
           assert.strictEqual(splitterInstanceCurrentBalance.toString(10), '0', "contract should have 0 balance at the end");
       });
    });

    it("it should not failed to call kill function with owner ", function() {
          return splitterInstance.kill({from:owner, gas: 3000000 })
          .then(txObject => {
              assert.isBelow(txObject.receipt.gasUsed, 3000000, "should not use all gas");
          });
    });
});

describe("Irregular actions", function() {
  var splitterInstance;
  var receiver1InitialBalance;
  var receiver2InitialBalance;

  beforeEach("should collect user 1 and user 2 intial balance and Retrieve the deployed Splitter instance", function() {
    return Promise.all([
      web3.eth.getBalancePromise(receiver1),
      web3.eth.getBalancePromise(receiver2),
      Splitter.new(receiver1,receiver2)
    ])
    .then(result => {
      receiver1InitialBalance=result[0];
      receiver2InitialBalance=result[1];
      splitterInstance =result[2];
    });
  });

  it("it should failed to split 3 wei into 2 parts. ", function() {
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

  it("it should failed to call split after the owner have kill the contract", function() {

          return splitterInstance.kill({from:owner, gas: 3000000 })
          .then(txMined => {
             assert.isBelow(txMined.receipt.gasUsed, 3000000, "should not use all gas");
             return splitterInstance.split({from:owner,value:4, gas: 3000000});
          })
          .then(txMined => {
               //Why assert below is true ??? i expected all gaz was used in the split call of a dead conctract
               assert.isBelow(txMined.receipt.gasUsed, 3000000, "should not use all gas");
               return Promise.all([
                 web3.eth.getBalancePromise(receiver1),
                 web3.eth.getBalancePromise(receiver2)
               ]);
          })
          .then(currentBalance => {
              receiver1CurrentBalance=currentBalance[0];
              receiver2CurrentBalance=currentBalance[1];
              // Phew! : split must not work properly because the contract is killed. expected balance the same as before the split call
              assert.strictEqual(receiver1CurrentBalance.toString(10), receiver1InitialBalance.toString(10) , "receiver1 must not receive 2 wei");
              assert.strictEqual(receiver2CurrentBalance.toString(10), receiver2InitialBalance.toString(10) , "receiver2 must not receive 2 wei");
          });
    });
  });
});
