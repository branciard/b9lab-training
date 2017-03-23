pragma solidity ^0.4.4;
import 'zeppelin/lifecycle/Killable.sol';
import './Mutex.sol';
contract Remittance is Killable, Mutex {

  enum RemittanceState {noGiverChallenge,giverChallengeProcessing}

  RemittanceState public currentRemittanceState;
  address public giver;
  address public receiver;
  bytes32 private resolvedMe;
  uint private challengeTimeout;

  function Remittance (address _giver) {
    //check not null address
    if (_giver == address(0)){
      throw;
    }
    giver=_giver;
    currentRemittanceState =RemittanceState.noGiverChallenge;
  }

  function launchChallenge(bytes32 sha3toDiscover, address _receiver , uint _timeForResolvingchallenge) payable noReentrancy {
      if (currentRemittanceState !=  RemittanceState.noGiverChallenge){
        throw;
      }
      if (giver !=  msg.sender){
        throw;
      }
      if (_receiver == address(0)){
        throw;
      }
      if (_receiver == giver){
        throw;
      }
      if (_receiver == owner){
        throw;
      }
      //max time for a chalenge is 1 week
      if ( _timeForResolvingchallenge >= 1 weeks) {
        throw;
      }
      if ( _timeForResolvingchallenge  == 0) {
        throw;
      }
      if ( sha3("") == sha3toDiscover) {
        throw;
      }
      if(msg.value > 0){
            receiver =_receiver;
            resolvedMe =sha3toDiscover;
            currentRemittanceState =RemittanceState.giverChallengeProcessing;
            challengeTimeout=now+_timeForResolvingchallenge;
      }
      else{
          throw;
      }
  }

  function claimBackChallenge() noReentrancy {
    if (currentRemittanceState !=  RemittanceState.giverChallengeProcessing){
      throw;
    }
    if (giver !=  msg.sender){
      throw;
    }
    if ( now <= challengeTimeout) {
      throw;
    }
    else{
      currentRemittanceState =RemittanceState.noGiverChallenge;

      //make you, the owner of the contract, take a cut of the Ethers smaller than what it would cost Alice to deploy the same contract without (you) any fee
      //TODO cost of the deploy

      if (! giver.send(this.balance)){
        throw;
      }
    }
  }

  function resolvedchallenge( string password1,  string password2 ) noReentrancy  {
    if (currentRemittanceState !=  RemittanceState.giverChallengeProcessing){
      throw;
    }
    if (receiver !=  msg.sender){
      throw;
    }
    if(sha3(password1,password2) == resolvedMe ){
      //check timout ?
      if ( now < challengeTimeout) {
        //change state before sending money. even if already secured by noReentrancy modifier
        currentRemittanceState =RemittanceState.noGiverChallenge;

        //make you, the owner of the contract, take a cut of the Ethers smaller than what it would cost Alice to deploy the same contract without (you) any fee
        //TODO sent to woner fees. cost of the deploy when better understanding of gaz price, gaz used

        if (! receiver.send(this.balance)){
          throw;
        }
      }
    }
  }
}
