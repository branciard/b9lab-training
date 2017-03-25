var RemittanceService = artifacts.require("./RemittanceService.sol");
//extensions.js : credit to : https://github.com/coldice/dbh-b9lab-hackathon/blob/development/truffle/utils/extensions.js
const Extensions = require("../utils/extensions.js");
var BigNumber = require("../utils/bignumber.min.js");
Extensions.init(web3, assert);

contract('RemittanceService', function(accounts) {

  var owner, giver, receiver;
  var oneWeek=1*60*60*24*7;

    before("should prepare accounts", function() {
        assert.isAtLeast(accounts.length, 3, "should have at least 3 accounts");
        owner = accounts[0];
        giver = accounts[1];
        receiver = accounts[2];
        return Extensions.makeSureAreUnlocked(
                [ owner,giver,receiver ])
                .then(() => web3.eth.getBalancePromise(owner))
                .then(balance => assert.isTrue(
                          web3.toWei(web3.toBigNumber(40), "ether").lessThan(balance),
                          "owner should have at least 40 ether, not " + web3.fromWei(balance, "ether"))
                )
                .then(() => Extensions.refillAccount(owner,giver,10))
                .then(() => Extensions.refillAccount(owner,receiver,10));
    });

  describe("Test Inital state", function() {

    var remittanceInstance;
    var giverInitialBalance;
    var receiverInitialBalance;

    beforeEach("should collect giver and receiver intial balance and create a new instance", function() {
      return Promise.all([
        web3.eth.getBalancePromise(giver),
        web3.eth.getBalancePromise(receiver),
        RemittanceService.new(oneWeek)
      ])
      .then(result => {
        giverInitialBalance=result[0];
        receiverInitialBalance=result[1];
        remittanceInstance =result[2];
      });
    });


    it("contract should have 0 balance at start", function() {
         return web3.eth.getBalancePromise(remittanceInstance.address)
         .then( balance  => assert.strictEqual(balance.toString(10), '0', "contract should have 0 balance at start"));
    });

    it("At this noGiverChallenge state,contract should have an owner", function() {
         return remittanceInstance.owner.call()
         .then( ownerCall  => {
           assert.strictEqual(ownerCall, owner, "owner assigned");
         });
    });

    it("At start state, nobody can call claimBackChallenge (owner test)", function() {
       return Extensions.expectedExceptionPromise(function () {
         return remittanceInstance.claimBackChallenge({from:owner, gas: 3000000});
        },
        3000000);
    });


    it("At start state, nobody can call claimBackChallenge (giver test)", function() {
     return Extensions.expectedExceptionPromise(function () {
       return remittanceInstance.claimBackChallenge({from:giver, gas: 3000000});
      },
      3000000);
    });

    it("At start state, nobody can call claimBackChallenge (receiver test)", function() {
       return Extensions.expectedExceptionPromise(function () {
         return remittanceInstance.claimBackChallenge({from:receiver, gas: 3000000});
        },
        3000000);
    });

    it("At start state, nobody can call resolvedchallenge (owner test)", function() {
    return Extensions.expectedExceptionPromise(function () {
      return remittanceInstance.resolvedchallenge(
        "No problem can be solved ",
        "from the same level of consciousness that created it.",
        giver,
        {from:owner, gas: 3000000});
      },
      3000000);
    });

    it("At start state, nobody can call resolvedchallenge (receiver test)", function() {
    return Extensions.expectedExceptionPromise(function () {
      return remittanceInstance.resolvedchallenge(
        "No problem can be solved ",
        "from the same level of consciousness that created it.",
        giver,
        {from:receiver, gas: 3000000});
      },
      3000000);
    });

    it("At start state, nobody can call resolvedchallenge (giver test)", function() {
    return Extensions.expectedExceptionPromise(function () {
      return remittanceInstance.resolvedchallenge(
        "No problem can be solved ",
        "from the same level of consciousness that created it.",
        giver,
        {from:giver, gas: 3000000});
      },
      3000000);
    });


    it("At start state, every body can call launchChallenge a 1 day challenge like this", function() {
      return remittanceInstance.launchChallenge(
        web3.sha3("No problem can be solved from the same level of consciousness that created it."),
        86400,//86400 sec = 1 day
        {from:giver,value:4, gas: 3000000})
      .then(txMined => {
          assert.isBelow(txMined.receipt.gasUsed, 3000000, "should not use all gas");
          return web3.eth.getBalancePromise(remittanceInstance.address);
      })
      .then(balance => {
          assert.strictEqual(balance.toString(10),"4","chalange accepted and amout load in  the contract");
      });
    });


    it("At start state, every body can call launchChallenge a 1 day challenge like this", function() {
      return remittanceInstance.launchChallenge(
        web3.sha3("No problem can be solved from the same level of consciousness that created it."),
        86400,//86400 sec = 1 day
        {from:giver,value:4, gas: 3000000})
      .then(txMined => {
          assert.isBelow(txMined.receipt.gasUsed, 3000000, "should not use all gas");
          return web3.eth.getBalancePromise(remittanceInstance.address);
      })
      .then(balance => {
          assert.strictEqual(balance.toString(10),"4","chalange accepted and amout load in  the contract");
      });
    });

    it("At start state, someone can't launch 2 chalenges in the same time", function() {
      return remittanceInstance.launchChallenge(
        web3.sha3("No problem can be solved from the same level of consciousness that created it."),
        86400,//86400 sec = 1 day
        {from:giver,value:4, gas: 3000000})
      .then(txMined => {
          assert.isBelow(txMined.receipt.gasUsed, 3000000, "should not use all gas");
          return web3.eth.getBalancePromise(remittanceInstance.address);
      })
      .then(balance => {
          assert.strictEqual(balance.toString(10),"4","chalange accepted and amout load in  the contract");
          return  Extensions.expectedExceptionPromise(function () {
            return remittanceInstance.launchChallenge(
              web3.sha3("No problem can be solved from the same level of consciousness that created it."),
                86400,//86400 sec = 1 day
              {from:giver,value:4, gas: 3000000});
            },
            3000000);
      });
    });

    it("At start state, 2 differents address can launch 2 chalenges in the same time", function() {
      return remittanceInstance.launchChallenge(
        web3.sha3("No problem can be solved from the same level of consciousness that created it."),
        86400,//86400 sec = 1 day
        {from:giver,value:4, gas: 3000000})
      .then(txMined => {
          assert.isBelow(txMined.receipt.gasUsed, 3000000, "should not use all gas");
          return web3.eth.getBalancePromise(remittanceInstance.address);
      })
      .then(balance => {
          assert.strictEqual(balance.toString(10),"4","chalange accepted and amout load in  the contract");
          return remittanceInstance.launchChallenge(
              web3.sha3("No problem can be solved from the same level of consciousness that created it."),
                86400,//86400 sec = 1 day
              {from:owner,value:4, gas: 3000000});
      })
      .then(txMined => {
          assert.isBelow(txMined.receipt.gasUsed, 3000000, "should not use all gas");
          return web3.eth.getBalancePromise(remittanceInstance.address);
      })
      .then(balance =>  assert.strictEqual(balance.toString(10),"8","chalange accepted and amout  4 + 4 load in the contract"));
    });


    it("A challenge can' be > 1 week", function() {
          return Extensions.expectedExceptionPromise(function () {
            return remittanceInstance.launchChallenge(
              web3.sha3("No problem can be solved from the same level of consciousness that created it."),
              864000  ,//864000 sec = 10 days
              {from:giver,value:4, gas: 3000000});
            },
            3000000);
    });

    it("Giver cannot make a chalenge with zero value sent", function() {
          return Extensions.expectedExceptionPromise(function () {
            return remittanceInstance.launchChallenge(
              web3.sha3("No problem can be solved from the same level of consciousness that created it."),
              86400  ,//86400 sec = 1 days
              {from:giver,gas: 3000000});
            },
            3000000);
    });

    it("Giver cannot make a chalenge with empty message challenge", function() {
          return Extensions.expectedExceptionPromise(function () {
            return remittanceInstance.launchChallenge(
              web3.sha3(""),
              86400  ,//86400 sec = 1 days
              {from:giver,value:4,gas: 3000000});
            },
            3000000);
    });


    it("Giver cannot make a chalenge  = 0 sec", function() {
          return Extensions.expectedExceptionPromise(function () {
            return remittanceInstance.launchChallenge(
              web3.sha3("No problem can be solved from the same level of consciousness that created it."),
              0  ,//0 ses must throw
              {from:giver,value:4, gas: 3000000});
            },
            3000000);
    });


    it("it should not failed to call kill function with owner ", function() {
              return remittanceInstance.kill({from:owner, gas: 3000000 })
              .then(txMined => {
                  assert.isBelow(txMined.receipt.gasUsed, 3000000, "should not use all gas");
              });
    });

    it("it should failed to call kill function by a others than owner (receiver test) ", function() {
          return Extensions.expectedExceptionPromise(function () {
            return remittanceInstance.kill({from:receiver, gas: 3000000 });
            },
            3000000);
    });

    it("it should failed to call kill function by a others than owner (giver test) ", function() {
          return Extensions.expectedExceptionPromise(function () {
            return remittanceInstance.kill({from:giver, gas: 3000000 });
            },
            3000000);
    });

  });



  describe("Test challengeProcessing state", function() {

    var remittanceInstance;
    var giverInitialBalance;
    var receiverInitialBalance;


    beforeEach("should collect giver and receiver intial balance and create a new instance", function() {
      return RemittanceService.new(oneWeek)
        .then(result => remittanceInstance =result)
        .then(()=>remittanceInstance.launchChallenge(
          web3.sha3("No problem can be solved from the same level of consciousness that created it."),
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


    it("contract should have 4 balance in this state", function() {
         return web3.eth.getBalancePromise(remittanceInstance.address)
         .then( balance  => assert.strictEqual(balance.toString(10), '4', "contract should have 4 balance in this state"));
    });


    it("At this state,contract should have an owner assigned", function() {
         return remittanceInstance.owner.call()
         .then( ownerCall  => {
           assert.strictEqual(ownerCall, owner, "owner assigned");
         });
    });

    it("Giver cannot call launchChallenge twice (giver test) ", function() {
      return Extensions.expectedExceptionPromise(function () {
        return remittanceInstance.launchChallenge(
          web3.sha3("No problem can be solved from the same level of consciousness that created it."),
          86400  ,//86400 sec = 1 day
          {from:giver,value:4, gas: 3000000});
        },
        3000000);
    });

    it("At this state, a receiver can call resolvedchallenge like this with right answer", function() {
        return remittanceInstance.resolvedchallenge(
          "No problem can be solved ",
          "from the same level of consciousness that created it.",
          giver,
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
        );
    });


    it("At this state, a receiver can't call twice the resolvedchallenge with right answer (one challenge processing contract)", function() {
        return remittanceInstance.resolvedchallenge(
          "No problem can be solved ",
          "from the same level of consciousness that created it.",
          giver,
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
             return Extensions.expectedExceptionPromise(function () {
               return remittanceInstance.resolvedchallenge(
                 "No problem can be solved ",
                 "from the same level of consciousness that created it.",
                 giver,
                 {from:receiver, gas: 3000000});
               },
               3000000);
          }
        );
    });



        it("At this state, a receiver can't call twice the resolvedchallenge with right answer (two challenge processing in contract)", function() {
            return remittanceInstance.resolvedchallenge(
              "No problem can be solved ",
              "from the same level of consciousness that created it.",
              giver,
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
                 return remittanceInstance.launchChallenge(
                     web3.sha3("No problem can be solved from the same level of consciousness that created it."),
                       86400,//86400 sec = 1 day
                     {from:owner,value:4, gas: 3000000});
              }
            )
            .then(txMined => {
                assert.isBelow(txMined.receipt.gasUsed, 3000000, "should not use all gas");
                return web3.eth.getBalancePromise(remittanceInstance.address);
            })
            .then(balance =>  {
              assert.strictEqual(balance.toString(10),"4","chalange accepted and amout  4 load in the contract");
              //should failed on the first challenge allready resolved
              return Extensions.expectedExceptionPromise(function () {
                return remittanceInstance.resolvedchallenge(
                  "No problem can be solved ",
                  "from the same level of consciousness that created it.",
                  giver,
                  {from:receiver, gas: 3000000});
                },
                3000000);
            });
        });



    it("At this giverChallengeProcessing state, giver can't call resolvedchallenge ", function() {
        return Extensions.expectedExceptionPromise(function () {
          return remittanceInstance.resolvedchallenge(
                      "No problem can be solved ",
                      "from the same level of consciousness that created it.",
                      giver,
                      {from:giver, gas: 3000000});
          },
          3000000);
    });


   it("receiver do not give the right msg to the resolvedchallenge ", function() {
       return remittanceInstance.resolvedchallenge(
                   "No problem can be solved ",
                   "At all !", //wrong msg
                   giver,
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
       });
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
                   giver,
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
         });
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
        });
   });

   it("At this giverChallengeProcessing state, giver can't call twice claimBackChallenge after the challenge timeout( one challenge processing)", function() {
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
          return Extensions.expectedExceptionPromise(function () {
            return remittanceInstance.claimBackChallenge({from:giver, gas: 3000000});
           },
           3000000);
       });
  });


  it("At this giverChallengeProcessing state, giver can't call twice claimBackChallenge after the challenge timeout( two challenges processing)", function() {
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
         return remittanceInstance.launchChallenge(
             web3.sha3("No problem can be solved from the same level of consciousness that created it."),
               86400,//86400 sec = 1 day
             {from:owner,value:4, gas: 3000000});
      })
      .then(txMined => {
          assert.isBelow(txMined.receipt.gasUsed, 3000000, "should not use all gas");
          return web3.eth.getBalancePromise(remittanceInstance.address);
      })
      .then(balance =>  {
        assert.strictEqual(balance.toString(10),"4","chalange accepted and amout 4 load in the contract");
        return Extensions.expectedExceptionPromise(function () {
          return remittanceInstance.claimBackChallenge({from:giver, gas: 3000000});
         },
         3000000);
       });
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
      });
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
    });



      describe("Test with long timeout", function() {

        var remittanceInstance;
        var giverInitialBalance;
        var receiverInitialBalance;


        beforeEach("should collect giver and receiver intial balance and create a new instance", function() {
          return RemittanceService.new(oneWeek)
            .then(result => remittanceInstance =result)
            .then(()=>remittanceInstance.launchChallenge(
              web3.sha3("No problem can be solved from the same level of consciousness that created it."),
              500  ,//500 seconds
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


           it("At this giverChallengeProcessing state, giver can't call immediatly claimBackChallenge for a timeout challenge set to 5 seconds", function() {
             return Extensions.expectedExceptionPromise(function () {
               return remittanceInstance.claimBackChallenge({from:giver, gas: 3000000});
              },
              3000000);
            });
        });

});
