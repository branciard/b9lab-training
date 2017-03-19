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
                .then(() => {
                  return web3.eth.getBalancePromise(receiver1)
                })
                // give some ether to receiver1. Needed for Irregular test
                .then(balance => {
                  //check if has 1 ether. if not sent 1 to him
                    if(balance.lessThan(web3.toWei(web3.toBigNumber(1), "ether"))){
                        return web3.eth.sendTransactionPromise({
                            from: owner,
                            to: receiver1,
                            value: web3.toWei(web3.toBigNumber(1), "ether")
                        });
                    }
               })
               .then( txSent =>  {
                  // if sendTransactionPromise has been call. sent wait for mining
                  if(txSent){
                  return web3.eth.getTransactionReceiptMined(txSent);
                 }
                }).then(txMined=> {
                  // check that receiver1 balance is now OK
                  return web3.eth.getBalancePromise(receiver1)
                })
                .then(balance => assert.isTrue(
                        web3.toWei(web3.toBigNumber(0.99), "ether").lessThan(balance),
                        "receiver1 should have at least 1 ether, not " + web3.fromWei(balance, "ether")));
    });

  describe("Regular actions", function() {

    var splitterInstance;
    var receiver1InitialBalance;
    var receiver2InitialBalance;
    var blocknumber;

    beforeEach("should collect user 1 and user 2 intial balance and Retrieve the deployed Splitter instance", function() {
        return web3.eth.getBalancePromise(receiver1)
        .then(balance => {
             receiver1InitialBalance =balance;
             return web3.eth.getBalancePromise(receiver2);
          })
        .then(balance => {
          receiver2InitialBalance=balance;
          //new Splitter instance created each time. because some test should kill it sometimes ...
          return Splitter.new(receiver1,receiver2);
          })
        .then(instance => {splitterInstance = instance;} );
    });

    it("contract should have 0 balance at start", function() {
         return web3.eth.getBalancePromise(splitterInstance.address)
         .then( balance  => assert.strictEqual(balance.toString(10), '0', "contract should have 0 balance at start"));
    });

    it("it should split the 4 wei into 2 wei for each receiver receiver1 and receiver2", function() {
        return splitterInstance.split.call({from:owner,value:4})
        .then(successful => {
          assert.isTrue(successful, "should be possible to call split");
          //needed for split event filter
          blocknumber = web3.eth.blocknumber +1;
          return splitterInstance.split({from:owner,value:4, gas: 3000000});
        })
        .then(txSent => {
          return Promise.all([
             Extensions.getEventsPromise(splitterInstance.LogSplit({},{fromBlock:blocknumber,toBlock:"latest"})),
             web3.eth.getTransactionReceiptMined(txSent.tx),
            ]);
        })
       .then(txMinedAndEventFiltered => {
          eventFiltered =txMinedAndEventFiltered[0];
          txMined= txMinedAndEventFiltered[1];
          assert.isBelow(txMined.gasUsed, 3000000, "should not use all gas");
          //check LogSplit event
          assert.strictEqual(eventFiltered[0].args.amountReceive.valueOf(),'2', "check amountReceivelog log event. must be 2");
          assert.strictEqual(eventFiltered[0].args.sender,owner, "check sender log event. must be the owner");
          assert.strictEqual(eventFiltered[0].args.receiver1,receiver1, "check receiver1 log event");
          assert.strictEqual(eventFiltered[0].args.receiver2,receiver2, "check receiver2 log event");
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
      return web3.eth.getBalancePromise(receiver1)
      .then(balance => {
           receiver1InitialBalance =balance;
           return web3.eth.getBalancePromise(receiver2);
        })
      .then(balance => {
        receiver2InitialBalance=balance;
        //new Splitter instance created each time. because some test should kill it sometimes ...
        return Splitter.new(receiver1,receiver2);
        })
      .then(instance => {splitterInstance = instance;} );
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
          .then(txSent => {
            return web3.eth.getTransactionReceiptMined(txSent.tx);
          })
          .then(txMined => {
             assert.isBelow(txMined.gasUsed, 3000000, "should not use all gas");
             return splitterInstance.split({from:owner,value:4, gas: 3000000});
          })
          .then(txSent => {
            return web3.eth.getTransactionReceiptMined(txSent.tx);
          })
          .then(txMined => {
               //Why assert below is true ??? i expected all gaz was used in the split call of a dead conctract
               assert.isBelow(txMined.gasUsed, 3000000, "should not use all gas");
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
