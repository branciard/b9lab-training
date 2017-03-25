var Remittance = artifacts.require("./Remittance.sol");
//extensions.js : credit to : https://github.com/coldice/dbh-b9lab-hackathon/blob/development/truffle/utils/extensions.js
const Extensions = require("../utils/extensions.js");
var BigNumber = require("../utils/bignumber.min.js");
Extensions.init(web3, assert);

contract('Remittance', function(accounts) {

  var owner, giver, receiver, othersAccounts;
  var oneWeek=1*60*60*24*7;

    before("should prepare accounts", function() {
        assert.isAtLeast(accounts.length, 3, "should have at least 3 accounts");
        owner = accounts[0];
        giver = accounts[1];
        receiver = accounts[2];
        othersAccounts = accounts[3];
        return Extensions.makeSureAreUnlocked(
                [ owner,giver,receiver ])
                .then(() => web3.eth.getBalancePromise(owner))
                .then(balance => assert.isTrue(
                          web3.toWei(web3.toBigNumber(40), "ether").lessThan(balance),
                          "owner should have at least 40 ether, not " + web3.fromWei(balance, "ether"))
                )
                .then(() => Extensions.refillAccount(owner,giver,10))
                .then(() => Extensions.refillAccount(owner,receiver,10))
                .then(() => Extensions.refillAccount(owner,othersAccounts,10));
    });

  describe("Test Inital noGiverChallenge state", function() {

    var remittanceInstance;
    var giverInitialBalance;
    var receiverInitialBalance;

    beforeEach("should collect giver and receiver intial balance and create a new instance", function() {
      return Promise.all([
        web3.eth.getBalancePromise(giver),
        web3.eth.getBalancePromise(receiver),
        Remittance.new(giver,oneWeek)
      ])
      .then(result => {
        giverInitialBalance=result[0];
        receiverInitialBalance=result[1];
        remittanceInstance =result[2];
      });
    });

    it("contract should have intial state equal to noGiverChallenge", function() {
         return remittanceInstance.currentRemittanceState.call()
         .then(currentRemittanceStateCall => assert.strictEqual(currentRemittanceStateCall.toString(10),"0","should be in noGiverChallenge state (enum RemittanceState noGiverChallenge = 0)"));
    });

    it("At this noGiverChallenge state,contract should have 0 balance at start", function() {
         return web3.eth.getBalancePromise(remittanceInstance.address)
         .then( balance  => assert.strictEqual(balance.toString(10), '0', "contract should have 0 balance at start"));
    });

    it("At this noGiverChallenge state,contract should have an owner and a giver after creation and no a receiver yet", function() {
         return remittanceInstance.owner.call()
         .then( ownerCall  => {
           assert.strictEqual(ownerCall, owner, "owner assigned");
           return remittanceInstance.giver.call();
         })
         .then( giverCall  => {
              assert.strictEqual(giverCall, giver, "giver assigned");
              return remittanceInstance.receiver.call();
         })
         .then(receiverCall => {
           var receiverCallNumber = web3.toBigNumber(receiverCall, 16);
           assert.isTrue(receiverCallNumber.equals(0) ,"receiver not yet assigned");
         });
    });

    it("At this noGiverChallenge state, nobody can call claimBackChallenge (owner test)", function() {
       return Extensions.expectedExceptionPromise(function () {
         return remittanceInstance.claimBackChallenge({from:owner, gas: 3000000});
        },
        3000000);
    });


    it("At this noGiverChallenge state, nobody can call claimBackChallenge (giver test)", function() {
     return Extensions.expectedExceptionPromise(function () {
       return remittanceInstance.claimBackChallenge({from:giver, gas: 3000000});
      },
      3000000);
    });

    it("At this noGiverChallenge state, nobody can call claimBackChallenge (receiver test)", function() {
       return Extensions.expectedExceptionPromise(function () {
         return remittanceInstance.claimBackChallenge({from:receiver, gas: 3000000});
        },
        3000000);
    });

    it("At this noGiverChallenge state, nobody can  call claimBackChallenge (othersAccounts test)", function() {
           return Extensions.expectedExceptionPromise(function () {
             return remittanceInstance.claimBackChallenge({from:othersAccounts, gas: 3000000});
            },
            3000000);
    });

    it("At this noGiverChallenge state, nobody can call resolvedchallenge (owner test)", function() {
    return Extensions.expectedExceptionPromise(function () {
      return remittanceInstance.resolvedchallenge(
        "No problem can be solved ",
        "from the same level of consciousness that created it.",
        {from:owner, gas: 3000000});
      },
      3000000);
    });

    it("At this noGiverChallenge state, nobody can call resolvedchallenge (receiver test)", function() {
    return Extensions.expectedExceptionPromise(function () {
      return remittanceInstance.resolvedchallenge(
        "No problem can be solved ",
        "from the same level of consciousness that created it.",
        {from:receiver, gas: 3000000});
      },
      3000000);
    });

    it("At this noGiverChallenge state, nobody can call resolvedchallenge (giver test)", function() {
    return Extensions.expectedExceptionPromise(function () {
      return remittanceInstance.resolvedchallenge(
        "No problem can be solved ",
        "from the same level of consciousness that created it.",
        {from:giver, gas: 3000000});
      },
      3000000);
    });

    it("At this noGiverChallenge state, nobody can call resolvedchallenge (othersAccounts test)", function() {
    return Extensions.expectedExceptionPromise(function () {
      return remittanceInstance.resolvedchallenge(
        "No problem can be solved ",
        "from the same level of consciousness that created it.",
        {from:othersAccounts, gas: 3000000});
      },
      3000000);
    });

    it("At this noGiverChallenge state, only giver can call launchChallenge a 1 day challenge like this", function() {
      return remittanceInstance.launchChallenge(
        web3.sha3("No problem can be solved from the same level of consciousness that created it."),
        receiver,
        86400  ,//86400 sec = 1 day
        {from:giver,value:4, gas: 3000000})
      .then(txMined => {
          assert.isBelow(txMined.receipt.gasUsed, 3000000, "should not use all gas");
          return remittanceInstance.currentRemittanceState.call();
      })
      .then(currentRemittanceStateCall => {
          assert.strictEqual(currentRemittanceStateCall.toString(10),"1","should be in giverChallengeProcessing state (enum RemittanceState giverChallengeProcessing = 1)");
      });
    });

    it("At this noGiverChallenge state, owner can't call launchChallenge", function() {
      return Extensions.expectedExceptionPromise(function () {
  			return remittanceInstance.launchChallenge(
          web3.sha3("Plus froidement vous calculerez, plus avant vous irez."),
          receiver,
          86400  ,//86400 sec = 1 day
          {from:owner,value:4, gas: 3000000});
  	    },
  	    3000000);
    });

    it("At this noGiverChallenge state, receiver can't call launchChallenge", function() {
      return Extensions.expectedExceptionPromise(function () {
        return remittanceInstance.launchChallenge(
          web3.sha3("No problem can be solved from the same level of consciousness that created it."),
          receiver,
          86400  ,//86400 sec = 1 day
          {from:receiver,value:4, gas: 3000000});
        },
        3000000);
    });

    it("At this noGiverChallenge state, othersAccounts can't call launchChallenge", function() {
      return Extensions.expectedExceptionPromise(function () {
        return remittanceInstance.launchChallenge(
          web3.sha3("No problem can be solved from the same level of consciousness that created it."),
          receiver,
          86400  ,//86400 sec = 1 day
          {from:othersAccounts,value:4, gas: 3000000});
        },
        3000000);
    });

    it("At this noGiverChallenge state, giver can't set the giver as a receiver ", function() {
      return Extensions.expectedExceptionPromise(function () {
        return remittanceInstance.launchChallenge(
          web3.sha3("No problem can be solved from the same level of consciousness that created it."),
          giver,
          86400  ,//86400 sec = 1 day
          {from:giver,value:4, gas: 3000000});
        },
        3000000);
    });


    it("At this noGiverChallenge state, giver can't set the owner as a receiver ", function() {
        return Extensions.expectedExceptionPromise(function () {
          return remittanceInstance.launchChallenge(
            web3.sha3("No problem can be solved from the same level of consciousness that created it."),
            owner,
            86400  ,//86400 sec = 1 day
            {from:giver,value:4, gas: 3000000});
          },
          3000000);
    });


    it("At this noGiverChallenge state, giver cannot make a chalenge > 1 week ", function() {
          return Extensions.expectedExceptionPromise(function () {
            return remittanceInstance.launchChallenge(
              web3.sha3("No problem can be solved from the same level of consciousness that created it."),
              receiver,
              864000  ,//864000 sec = 10 days
              {from:giver,value:4, gas: 3000000});
            },
            3000000);
    });

    it("At this noGiverChallenge state, giver cannot make a chalenge with zero value sent", function() {
          return Extensions.expectedExceptionPromise(function () {
            return remittanceInstance.launchChallenge(
              web3.sha3("No problem can be solved from the same level of consciousness that created it."),
              receiver,
              86400  ,//86400 sec = 1 days
              {from:giver,gas: 3000000});
            },
            3000000);
    });

    it("At this noGiverChallenge state, giver cannot make a chalenge with empty message challenge", function() {
          return Extensions.expectedExceptionPromise(function () {
            return remittanceInstance.launchChallenge(
              web3.sha3(""),
              receiver,
              86400  ,//86400 sec = 1 days
              {from:giver,value:4,gas: 3000000});
            },
            3000000);
    });

    it("At this noGiverChallenge state, giver cannot make a chalenge with empty receiver address", function() {
          return Extensions.expectedExceptionPromise(function () {
            return remittanceInstance.launchChallenge(
              web3.sha3("No problem can be solved from the same level of consciousness that created it."),
              0,
              86400  ,//86400 sec = 1 days
              {from:giver,value:4,gas: 3000000});
            },
            3000000);
    });

    it("At this noGiverChallenge state, giver cannot make a chalenge  = 0 sec", function() {
          return Extensions.expectedExceptionPromise(function () {
            return remittanceInstance.launchChallenge(
              web3.sha3("No problem can be solved from the same level of consciousness that created it."),
              receiver,
              0  ,//0 ses must throw
              {from:giver,value:4, gas: 3000000});
            },
            3000000);
    });


    it("At this noGiverChallenge state,it should not failed to call kill function with owner ", function() {
              return remittanceInstance.kill({from:owner, gas: 3000000 })
              .then(txMined => {
                  assert.isBelow(txMined.receipt.gasUsed, 3000000, "should not use all gas");
              });
    });

    it("At this noGiverChallenge state,it should failed to call kill function by receiver ", function() {
          return Extensions.expectedExceptionPromise(function () {
            return remittanceInstance.kill({from:receiver, gas: 3000000 });
            },
            3000000);
    });

    it("At this noGiverChallenge state,it should failed to call kill function by giver ", function() {
          return Extensions.expectedExceptionPromise(function () {
            return remittanceInstance.kill({from:giver, gas: 3000000 });
            },
            3000000);
    });

    it("At this noGiverChallenge state,it should failed to call kill function by othersAccounts ", function() {
          return Extensions.expectedExceptionPromise(function () {
            return remittanceInstance.kill({from:othersAccounts, gas: 3000000 });
            },
            3000000);
    });

  });



  describe("Test giverChallengeProcessing state", function() {

    var remittanceInstance;
    var giverInitialBalance;
    var receiverInitialBalance;


    beforeEach("should collect giver and receiver intial balance and create a new instance", function() {
      return Remittance.new(giver,oneWeek)
        .then(result => remittanceInstance =result)
        .then(()=>remittanceInstance.launchChallenge(
          web3.sha3("No problem can be solved from the same level of consciousness that created it."),
          receiver,
          5  ,//5 seconds
          {from:giver,value:4, gas: 3000000})
        )
        .then(txMined => assert.isBelow(txMined.receipt.gasUsed, 3000000, "should not use all gas"))
        .then(()=> Promise.all([
           web3.eth.getBalancePromise(giver),
           web3.eth.getBalancePromise(receiver),
         ]))
        .then(balance => {
          giverInitialBalance=balance[0];
          receiverInitialBalance=balance[1];
        });
    });


    it("contract should state equal to giverChallengeProcessing", function() {
         return remittanceInstance.currentRemittanceState.call()
         .then(currentRemittanceStateCall => assert.strictEqual(currentRemittanceStateCall.toString(10),"1","should be in giverChallengeProcessing state (enum RemittanceState noGiverChallenge = 1)"));
    });

    it("At this giverChallengeProcessing state,contract should have 4 balance in this state", function() {
         return web3.eth.getBalancePromise(remittanceInstance.address)
         .then( balance  => assert.strictEqual(balance.toString(10), '4', "contract should have 4 balance in this state"));
    });


    it("At this giverChallengeProcessing state,contract should have an owner and a giver and a receiver assigned ", function() {
         return remittanceInstance.owner.call()
         .then( ownerCall  => {
           assert.strictEqual(ownerCall, owner, "owner assigned");
           return remittanceInstance.giver.call();
         })
         .then( giverCall  => {
              assert.strictEqual(giverCall, giver, "giver assigned");
              return remittanceInstance.receiver.call();
         })
         .then(receiverCall => {
             assert.strictEqual(receiverCall, receiver, "receiver assigned");
         });
    });

    it("At this giverChallengeProcessing state, nobody can call launchChallenge (owner test) ", function() {
      return Extensions.expectedExceptionPromise(function () {
        return remittanceInstance.launchChallenge(
          web3.sha3("No problem can be solved from the same level of consciousness that created it."),
          receiver,
          86400  ,//86400 sec = 1 day
          {from:owner,value:4, gas: 3000000});
        },
        3000000);
    });

    it("At this giverChallengeProcessing state, nobody can call launchChallenge (receiver test) ", function() {
      return Extensions.expectedExceptionPromise(function () {
        return remittanceInstance.launchChallenge(
          web3.sha3("No problem can be solved from the same level of consciousness that created it."),
          receiver,
          86400  ,//86400 sec = 1 day
          {from:receiver,value:4, gas: 3000000});
        },
        3000000);
    });

    it("At this giverChallengeProcessing state, nobody can call launchChallenge (giver test) ", function() {
      return Extensions.expectedExceptionPromise(function () {
        return remittanceInstance.launchChallenge(
          web3.sha3("No problem can be solved from the same level of consciousness that created it."),
          receiver,
          86400  ,//86400 sec = 1 day
          {from:giver,value:4, gas: 3000000});
        },
        3000000);
    });

    it("At this giverChallengeProcessing state, nobody can call launchChallenge (othersAccounts test) ", function() {
      return Extensions.expectedExceptionPromise(function () {
        return remittanceInstance.launchChallenge(
          web3.sha3("No problem can be solved from the same level of consciousness that created it."),
          receiver,
          86400  ,//86400 sec = 1 day
          {from:othersAccounts,value:4, gas: 3000000});
        },
        3000000);
    });


    it("At this giverChallengeProcessing state, only receiver can call resolvedchallenge like this with right answer", function() {
        return remittanceInstance.resolvedchallenge(
          "No problem can be solved ",
          "from the same level of consciousness that created it.",
          {from:receiver, gas: 3000000})
        .then(txMined => {
            assert.isBelow(txMined.receipt.gasUsed, 3000000, "should not use all gas");
            return Promise.all([
            web3.eth.getBalancePromise(receiver),
            web3.eth.getBalancePromise(remittanceInstance.address),
            Extensions.gazTxUsedCost(txMined)
            ]);
        })
        .then( currentBalancesAndTx  => {
             receiverCurrentBalance = currentBalancesAndTx[0];
             contractCurrentBalance = currentBalancesAndTx[1];
             gazUsedCost= currentBalancesAndTx[2];
             initialBalanceMinusGazUsed=new BigNumber(receiverInitialBalance.minus(gazUsedCost));
             assert.strictEqual(receiverCurrentBalance.minus(initialBalanceMinusGazUsed).toString(10), '4' , "receiver resolve challenge must receive 4");
             assert.strictEqual(contractCurrentBalance.toString(10), '0', "receiver solve the problem receive money so nothing left in the contract now");
           }
        )
        .then(() =>remittanceInstance.currentRemittanceState.call())
        .then(currentRemittanceStateCall => assert.strictEqual(currentRemittanceStateCall.toString(10),"0","should have go back in noGiverChallenge state (enum RemittanceState giverChallengeProcessing = 0)"));
    });

    it("At this giverChallengeProcessing state, giver can't call resolvedchallenge ", function() {
        return Extensions.expectedExceptionPromise(function () {
          return remittanceInstance.resolvedchallenge(
                      "No problem can be solved ",
                      "from the same level of consciousness that created it.",
                      {from:giver, gas: 3000000});
          },
          3000000);
    });

    it("At this giverChallengeProcessing state, owner can't call resolvedchallenge ", function() {
        return Extensions.expectedExceptionPromise(function () {
          return remittanceInstance.resolvedchallenge(
                      "No problem can be solved ",
                      "from the same level of consciousness that created it.",
                      {from:owner, gas: 3000000});
          },
          3000000);
    });

    it("At this giverChallengeProcessing state, othersAccounts can't call resolvedchallenge ", function() {
      return Extensions.expectedExceptionPromise(function () {
        return remittanceInstance.resolvedchallenge(
                    "No problem can be solved ",
                    "from the same level of consciousness that created it.",
                    {from:othersAccounts, gas: 3000000});
        },
        3000000);
   });

   it("At this giverChallengeProcessing state, receiver do not give the right msg to the resolvedchallenge ", function() {
       return remittanceInstance.resolvedchallenge(
                   "No problem can be solved ",
                   "At all !", //wrong msg
                   {from:receiver, gas: 3000000})
       .then(txMined => {
           assert.isBelow(txMined.receipt.gasUsed, 3000000, "should not use all gas");
           return Promise.all([
             web3.eth.getBalancePromise(receiver),
             web3.eth.getBalancePromise(remittanceInstance.address),
             Extensions.gazTxUsedCost(txMined)
             ]);
         })
         .then( currentBalancesAndTx  => {
              receiverCurrentBalance = currentBalancesAndTx[0];
              contractCurrentBalance = currentBalancesAndTx[1];
              gazUsedCost= currentBalancesAndTx[2];
              initialBalanceMinusGazUsed=new BigNumber(receiverInitialBalance.minus(gazUsedCost));
              assert.strictEqual(receiverCurrentBalance.minus(initialBalanceMinusGazUsed).toString(10), '0' , "receiver resolve challenge must receive nothing");
              assert.strictEqual(contractCurrentBalance.toString(10), '4', "challenge still open.there is still the 4 in the contract");
       })
       .then(()=> remittanceInstance.currentRemittanceState.call())
       .then(currentRemittanceStateCall =>assert.strictEqual(currentRemittanceStateCall.toString(10),"1","must be in the same  giverChallengeProcessing state (enum RemittanceState giverChallengeProcessing = 1)"));
    });

   it("At this giverChallengeProcessing state, receiver was too late resolve the challenge (5 seconds challenge)", function() {
         console.log("wait 10 seconds burning cpu")
         var d1 = new Date();
         var d2 = new Date();
         while (d2.valueOf() < d1.valueOf() + 10000) {
           d2 = new Date();
       }

       return remittanceInstance.resolvedchallenge(
                   "No problem can be solved ",
                   "from the same level of consciousness that created it.",
                   {from:receiver, gas: 3000000})
         .then(txMined => {
             assert.isBelow(txMined.receipt.gasUsed, 3000000, "should not use all gas");
             return Promise.all([
               web3.eth.getBalancePromise(receiver),
               web3.eth.getBalancePromise(remittanceInstance.address),
               Extensions.gazTxUsedCost(txMined)
               ]);
           })
           .then( currentBalancesAndTx  => {
                receiverCurrentBalance = currentBalancesAndTx[0];
                contractCurrentBalance = currentBalancesAndTx[1];
                gazUsedCost= currentBalancesAndTx[2];
                initialBalanceMinusGazUsed=new BigNumber(receiverInitialBalance.minus(gazUsedCost));
                assert.strictEqual(receiverCurrentBalance.minus(initialBalanceMinusGazUsed).toString(10), '0' , "receiver resolve challenge must receive nothing");
                assert.strictEqual(contractCurrentBalance.toString(10), '4', "challenge still open.there is still the 4 in the contract");
         })
         .then(() => remittanceInstance.currentRemittanceState.call())
         .then(currentRemittanceStateCall => assert.strictEqual(currentRemittanceStateCall.toString(10),"1","must be in the same  giverChallengeProcessing state (enum RemittanceState giverChallengeProcessing = 1)"));
     });


    it("At this giverChallengeProcessing state, giver can call claimBackChallenge after the challenge timeout", function() {
          console.log("wait 10 seconds burning cpu")
          var d1 = new Date();
          var d2 = new Date();
          while (d2.valueOf() < d1.valueOf() + 10000) {
            d2 = new Date();
          }

        return remittanceInstance.claimBackChallenge({from:giver, gas: 3000000})
        .then(txMined => {
            assert.isBelow(txMined.receipt.gasUsed, 3000000, "should not use all gas");
            return  Promise.all([
                  web3.eth.getBalancePromise(giver),
                  web3.eth.getBalancePromise(remittanceInstance.address),
                  Extensions.gazTxUsedCost(txMined)
              ]);;
        })
        .then( currentBalancesAndTx  => {
           giverCurrentBalance = currentBalancesAndTx[0];
           contractCurrentBalance = currentBalancesAndTx[1];
           gazUsedCost= currentBalancesAndTx[2];
           initialBalanceMinusGazUsed=new BigNumber(giverInitialBalance.minus(gazUsedCost));
           assert.strictEqual(giverCurrentBalance.minus(initialBalanceMinusGazUsed).toString(10), '4' , "giver should obtain 4 by claimBack");
           assert.strictEqual(contractCurrentBalance.toString(10), '0', "giver have withdrow the 4 by calling claimBackChallenge");
        })
        .then(() => remittanceInstance.currentRemittanceState.call())
        .then(currentRemittanceStateCall =>   assert.strictEqual(currentRemittanceStateCall.toString(10),"0","should have go back in noGiverChallenge state (enum RemittanceState giverChallengeProcessing = 0)"));
   });

   it("At this giverChallengeProcessing state, giver can't call immediatly claimBackChallenge for a timeout challenge set to 5 seconds", function() {
     return Extensions.expectedExceptionPromise(function () {
       return remittanceInstance.claimBackChallenge({from:giver, gas: 3000000});
      },
      3000000);
    });

   it("At this giverChallengeProcessing state, owner can't call claimBackChallenge after the challenge timeout", function() {
         console.log("wait 10 seconds burning cpu")
         var d1 = new Date();
         var d2 = new Date();
         while (d2.valueOf() < d1.valueOf() + 10000) {
           d2 = new Date();
         }

       return Extensions.expectedExceptionPromise(function () {
        return remittanceInstance.claimBackChallenge({from:owner, gas: 3000000});
        },
        3000000);
    });

    it("At this giverChallengeProcessing state, receiver can't call claimBackChallenge after the challenge timeout", function() {
            console.log("wait 10 seconds burning cpu")
            var d1 = new Date();
            var d2 = new Date();
            while (d2.valueOf() < d1.valueOf() + 10000) {
              d2 = new Date();
            }

          return Extensions.expectedExceptionPromise(function () {
           return remittanceInstance.claimBackChallenge({from:receiver, gas: 3000000});
           },
           3000000);
     });

     it("At this giverChallengeProcessing state, othersAccounts can't call claimBackChallenge after the challenge timeout", function() {
           console.log("wait 10 seconds burning cpu")
           var d1 = new Date();
           var d2 = new Date();
           while (d2.valueOf() < d1.valueOf() + 10000) {
             d2 = new Date();
           }

         return Extensions.expectedExceptionPromise(function () {
          return remittanceInstance.claimBackChallenge({from:othersAccounts, gas: 3000000});
          },
          3000000);
      });

    });

});
