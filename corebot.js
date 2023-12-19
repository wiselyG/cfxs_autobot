require("dotenv").config();
const { program } =require('commander');
const { Drip } =require('js-conflux-sdk');

const CoreCfxsUtil = require("./coreCfxsUtil");

const pKey1=process.env.pKey1;
const pKey2=process.env.pKey2;

let cfxsUtil;

program
.name("cfxs mint tool from core net")
.version("0.1.1")

program
.command("hello")
.argument('<number>',"use which wallet to mint")
.argument('<gasprice>',"set gasprice muanl")
.action((args,gasprice,option)=>{
  if(args == 1){
    cfxsUtil = new CoreCfxsUtil(pKey1,gasprice);
  }else if(args == 2){
    cfxsUtil = new CoreCfxsUtil(pKey2,gasprice);
  }else if(args == 3){
    const pKey3=process.env.pKey3;
    if(!pKey3){
      console.log("Wallet is not setup,please setup in env");
      return;
    }
    cfxsUtil = new CoreCfxsUtil(pKey3,gasprice);
  }
  startTask();
});

const startTask = async ()=>{
  if(!cfxsUtil){
    console.error("cfxsUtil is not inited");
    return;
  }
  let index=0;
  let minted=0;
  let gasfirst=1n;
  const evmAddress= await cfxsUtil.getEvmaddress();
  console.log("start to mint cfxs to: ",evmAddress);
  while(true){
    let corebalance=2n;
    try {
      corebalance =await cfxsUtil.getCoreBalance();
    } catch (error) {
      console.error("get Balance failed,",error.message);
    }
    if(cfxsUtil.lte(corebalance)){
      console.log("balance is less than 2 CFX,balance:",new Drip(corebalance).toCFX());
      break;
    }
    let txHash;
    let nextNonce;
    try {
      nextNonce=await cfxsUtil.getNonce();
      txHash =await cfxsUtil.mint(nextNonce);
    } catch (error) {
      console.log("mint failed");
      index++;
      continue;
    }
    console.log("Hash:",txHash);
    let receipt;
    do{
      try {
        receipt = await cfxsUtil.getReceipt(txHash);
      } catch (error) {
        console.log("get Receipt failed");
        console.error(error.stack);
      }
    }while(!receipt);
    minted=receipt.outcomeStatus ==0 ?minted+1:minted;
    index++;
    if(index==1){
      gasfirst=receipt.gasUsed;
    }else{
      if(receipt.gasUsed>gasfirst*2n){
        console.log("gas is double,stop it. gas now:",receipt.gasUsed," first:",gasfirst);
        break;
      }
    }
    // const bcore=await cfxsUtil.getCoreBalance();
    console.log("index: ",index," minted:",minted," Nonce:",nextNonce," balance:",new Drip(corebalance).toCFX());
  }
}

program
.command("address")
.argument('<number>',"which wallet")
.argument('<number>',"set gasPrice")
.action((index,gasprice)=>{
  console.log("I:",index,"gasP:",gasprice);
  if(index == 1){
    cfxsUtil= new CoreCfxsUtil(pKey1,gasprice);
  }else{
    cfxsUtil= new CoreCfxsUtil(pKey2,gasprice);
  }
  cfxsUtil.getEvmaddress()
  .then(result=>{
    console.log("evm:",result);
    console.log("core: ",cfxsUtil.account.address);
  });
  
});

program
.command("mintcount")
.argument('<number>',"which wallet")
.action((args)=>{
  if(args == 1){
    cfxsUtil= new CoreCfxsUtil(pKey1);
  }else{
    cfxsUtil= new CoreCfxsUtil(pKey2);
  }
  mintedBalance(cfxsUtil);
});

const mintedBalance = async (cfxsUtil)=>{
  const packedTx = await cfxsUtil.getWalletBalance();
  // console.log("Hash:",hash);
  // let receipt;
  // let index=0;
  // do {
  //   try {
  //     receipt = await cfxsUtil.getReceipt(hash);
  //   } catch (error) {
  //     console.log("get Receipt error:");
  //     console.error(error.stack);
  //   }
  //   index++;
  //   if(index % 10==0){
  //     console.log("Index:",index);
  //   }
  // } while (!receipt);
  console.log(packedTx);
  console.log("**Data:",packedTx.data);
  console.log("**Nonce:",packedTx.nonce);
  console.log("**Value:",packedTx.value);
  const result = cfxsUtil.getResultData("CFXsCounter",packedTx.data);
  console.log("--result:",result);
}

program.parse();
console.log("cfxs core bot v0.0.1");
