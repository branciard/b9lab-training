pragma solidity ^0.4.4;
import 'zeppelin/lifecycle/Killable.sol';
import './Mutex.sol';
contract RemittanceService is Killable, Mutex {

  uint private challengeMaxTimeout;
  uint private tmpToSent;

  struct Challenge {
    bytes32 resolvedMe;
    uint challengeTimeout;
    uint amount;
  }
  mapping(address => Challenge) private challenges;

  function RemittanceService (uint _challengeMaxTimeout) {
    if (_challengeMaxTimeout == 0){
      throw;
    }
    challengeMaxTimeout=_challengeMaxTimeout;
  }

  function launchChallenge(bytes32 sha3toDiscover, uint _timeForResolvingchallenge) payable noReentrancy {
     if (challenges[msg.sender].amount != 0){
        // a challenge is still processing for this sender
        throw;
      }
      if ( _timeForResolvingchallenge >= challengeMaxTimeout ) {
        throw;
      }
      if ( _timeForResolvingchallenge  == 0) {
        throw;
      }

      if ( sha3("") == sha3toDiscover) {
        throw;
      }

      if(msg.value > 0){
            challenges[msg.sender].resolvedMe=sha3toDiscover;
            challenges[msg.sender].challengeTimeout=now+_timeForResolvingchallenge;
            challenges[msg.sender].amount=msg.value;
      }
      else{
          throw;
      }
  }

  function claimBackChallenge() noReentrancy {
    Challenge senderChallenge = challenges[msg.sender];
    if (senderChallenge.amount == 0){
      //no challenge present for sender
      throw;
    }
    if ( now <= challenges[msg.sender].challengeTimeout) {
      throw;
    }

   //clear challenge because claimBack
    tmpToSent=senderChallenge.amount;
    senderChallenge.amount=0;
    senderChallenge.challengeTimeout=0;
    senderChallenge.resolvedMe="";

    if (! msg.sender.send(tmpToSent)){
      throw;
    }
  }

  function resolvedchallenge( string /* use bytes32  when possible =>cheaper than string*/ password1, string password2 , address addressChallengeToResolve ) noReentrancy  {

    if (addressChallengeToResolve == address(0)){
      throw;
    }

    if (addressChallengeToResolve == msg.sender){
      throw;
    }
    Challenge aChallenge = challenges[addressChallengeToResolve];
    if (aChallenge.amount == 0){
      //no challenge for this address
      throw;
    }
   if(sha3(password1,password2) == aChallenge.resolvedMe ){
      //check timout ?
      if ( now <= aChallenge.challengeTimeout ) {

        //clear challenge because resolved
        tmpToSent=aChallenge.amount;
        aChallenge.amount=0;
        aChallenge.challengeTimeout=0;
        aChallenge.resolvedMe="";
        if (!  msg.sender.send(tmpToSent)){
          throw;
        }
      }

    }
  }
}
