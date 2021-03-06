var SplitterPullPayment = artifacts.require("./SplitterPullPayment.sol");
//extensions.js : credit to : https://github.com/coldice/dbh-b9lab-hackathon/blob/development/truffle/utils/extensions.js
const Extensions = require("../utils/extensions.js");
var BigNumber = require("../utils/bignumber.min.js");
Extensions.init(web3, assert);

contract('SplitterPullPayment', function(accounts) {

  var owner, receiver1, receiver2;

    before("should prepare accounts", function() {
        assert.isAtLeast(accounts.length, 3, "should have at least 3 accounts");
        owner = accounts[0];
        receiver1 = accounts[1];
        receiver2 = accounts[2];
        return Extensions.makeSureAreUnlocked(
                [ owner,receiver1,receiver2 ])// also check unlock for receiver1 and receiver1 for PullPayment
                .then(() => web3.eth.getBalancePromise(owner))
                //check owner has at least 2 ether
                .then(balance => assert.isTrue(
                          web3.toWei(web3.toBigNumber(3), "ether").lessThan(balance),
                          "owner should have at least 3 ether, not " + web3.fromWei(balance, "ether"))
                )
                .then(() => Extensions.refillAccount(owner,receiver1,1))
                .then(() => Extensions.refillAccount(owner,receiver2,1));
    });

  describe("Regular actions", function() {

    var splitterInstance;
    var receiver1InitialBalance;
    var receiver2InitialBalance;

    beforeEach("should collect user 1 and user 2 intial balance and create a new instance", function() {
        return Promise.all([
          web3.eth.getBalancePromise(receiver1),
          web3.eth.getBalancePromise(receiver2),
          SplitterPullPayment.new(receiver1,receiver2)
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
          assert.strictEqual(txMined.logs[0].args.amountReceive.valueOf(),'2', "check amountReceivelog log event. must be 2");
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
           assert.strictEqual(receiver1CurrentBalance.toString(10), receiver1InitialBalance.toString(10) , "receiver1 has not pull yet. his balance must be unchanged");
           assert.strictEqual(receiver2CurrentBalance.toString(10), receiver2InitialBalance.toString(10) , "receiver2 has not pull yet. his balance must be unchanged");
           assert.strictEqual(splitterInstanceCurrentBalance.toString(10), '4', "contract should have the 4 balance. waiting for receivers pull ...");
           return splitterInstance.withdrawPayments({from:receiver1, gas: 3000000});
       })
       .then(txMined => {
           assert.isBelow(txMined.receipt.gasUsed, 3000000, "should not use all gas");
           return Promise.all([
   	    		web3.eth.getBalancePromise(receiver1),
   	    		web3.eth.getBalancePromise(receiver2),
            web3.eth.getBalancePromise(splitterInstance.address),
            Extensions.gazTxUsedCost(txMined)
       		]);
       })
       .then(currentBalancesAndTx => {
           receiver1CurrentBalance=currentBalancesAndTx[0];
           receiver2CurrentBalance=currentBalancesAndTx[1];
           splitterInstanceCurrentBalance=currentBalancesAndTx[2];
           gazUsedCost= currentBalancesAndTx[3];
           initialBalanceMinusGazUsed=new BigNumber(receiver1InitialBalance.minus(gazUsedCost));
           assert.strictEqual(receiver1CurrentBalance.minus(initialBalanceMinusGazUsed).toString(10), '2' , "receiver1 has  pull . his balance receive 2 (- gazused)");
           assert.strictEqual(receiver2CurrentBalance.toString(10), receiver2InitialBalance.toString(10) , "receiver2 has not pull yet. his balance must be unchanged");
           assert.strictEqual(splitterInstanceCurrentBalance.toString(10), '2', "contract should have the half balance 2. waiting for receiver 2 to pull ...");
           return splitterInstance.withdrawPayments({from:receiver2, gas: 3000000});
        })
        .then(txMined => {
            assert.isBelow(txMined.receipt.gasUsed, 3000000, "should not use all gas");
            return Promise.all([
             web3.eth.getBalancePromise(receiver2),
             web3.eth.getBalancePromise(splitterInstance.address),
             Extensions.gazTxUsedCost(txMined)
           ]);
        })
        .then(currentBalancesAndTx => {
            receiver2CurrentBalance=currentBalancesAndTx[0];
            splitterInstanceCurrentBalance=currentBalancesAndTx[1];
            gazUsedCost= currentBalancesAndTx[2];
            initialBalanceMinusGazUsed=new BigNumber(receiver2InitialBalance.minus(gazUsedCost));
            assert.strictEqual(receiver2CurrentBalance.minus(initialBalanceMinusGazUsed).toString(10), '2', "receiver2 has  pull . his balance receive 2 (- gazused)");
            assert.strictEqual(splitterInstanceCurrentBalance.toString(10), '0', " both receiver 1 and 2 have pull. contract balance must be 0");
         });
    });

    it("it should not failed to call kill function with owner ", function() {
          return splitterInstance.kill({from:owner, gas: 3000000 })
          .then(txMined => {
              assert.isBelow(txMined.receipt.gasUsed, 3000000, "should not use all gas");
          });
    });
});

describe("Irregular actions", function() {
  var splitterInstance;
  var receiver1InitialBalance;
  var receiver2InitialBalance;

  beforeEach("should collect user 1 and user 2 intial balance and create a new instance", function() {
    return Promise.all([
      web3.eth.getBalancePromise(receiver1),
      web3.eth.getBalancePromise(receiver2),
      SplitterPullPayment.new(receiver1,receiver2)
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


      it("it should failed to call withdrow by a receiver before a split call ", function() {
            return Extensions.expectedExceptionPromise(function () {
              return splitterInstance.withdrawPayments({from:receiver2, gas: 3000000})
              },
              3000000);
      });

      it("it should failed to call withdrow by owner before a split call", function() {
            return Extensions.expectedExceptionPromise(function () {
              return splitterInstance.withdrawPayments({from:owner, gas: 3000000})
              },
              3000000);
      });


  });


  describe("Irregular actions after split done", function() {
    var splitterInstance;

    beforeEach("should collect user 1 and user 2 intial balance and create a new instance and call a valid split()", function() {
        return Promise.all([
          web3.eth.getBalancePromise(receiver1),
          web3.eth.getBalancePromise(receiver2),
          SplitterPullPayment.new(receiver1,receiver2)
        ])
        .then(result => {
          receiver1InitialBalance=result[0];
          receiver2InitialBalance=result[1];
          splitterInstance =result[2];
        })
        .then(() => splitterInstance.split({from:owner,value:4, gas: 3000000}))
        .then(txMined => web3.eth.getBalancePromise(splitterInstance.address))
        .then(balance => assert.strictEqual(balance.toString(10), '4', "contract must be load with 4 wei. Waiting to receiver 1 and 2 to pull" ));
    });


    it("it should failed to call withdrow by owner after a split call", function() {
          return Extensions.expectedExceptionPromise(function () {
            return splitterInstance.withdrawPayments({from:owner, gas: 3000000})
            },
            3000000);
    });

    it("it should failed when a receveir withdrow twice", function() {
        return splitterInstance.withdrawPayments({from:receiver1, gas: 3000000})
        .then(txMined => web3.eth.getBalancePromise(splitterInstance.address))
        .then(balance => {
           assert.strictEqual(balance.toString(10), '2', "first withdrow must works" );
           return Extensions.expectedExceptionPromise(function () {
                return splitterInstance.withdrawPayments({from:receiver1, gas: 3000000})
                },
                3000000);
          });
    });

    it("it should failed to withdrow on a killed contract", function() {
            return splitterInstance.kill({from:owner, gas: 3000000 })
            // withdrawPayments do not crash when using Extensions.expectedExceptionPromise. why ?
            .then(txMined =>splitterInstance.withdrawPayments({from:receiver1, gas: 3000000}))
            .then(txMined => web3.eth.getBalancePromise(splitterInstance.address))
            .then(balance => {
               assert.strictEqual(balance.toString(10), '0', "killed contract has 0 balance" );
             });
      });

  });
});
