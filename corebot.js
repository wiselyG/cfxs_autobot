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
    console.log("--1");
    const nextNonce=await cfxsUtil.getNonce();
    console.log("--2");
    const txHash =await cfxsUtil.mint(nextNonce);
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
.action((index)=>{
  if(index == 1){
    cfxsUtil= new CoreCfxsUtil(pKey1);
  }else{
    cfxsUtil= new CoreCfxsUtil(pKey2);
  }
  cfxsUtil.getEvmaddress()
  .then(result=>{
    console.log("evm:",result);
    console.log("core: ",cfxsUtil.account.address);
  });
  
});

const showEvm = async ()=>{
  if(cfxsUtil){
    const evmAddress= await cfxsUtil.getEvmaddress();
    console.log("evm:",evmAddress);
    const corebalance= await cfxsUtil.getCoreBalance();
    console.log(corebalance," -",corebalance.toCFX());
    const nextNonce= await cfxsUtil.getNonce();
    console.log("Nonce:",nextNonce,"typeof:",typeof nextNonce);
    const hash= await cfxsUtil.mint(nextNonce);
    console.log("Tx hash:",hash);
    // const txData = await hash.mined();
    // console.log("Tx info:",txData);
    // const txReceipt = await hash.executed();
    let receipt;
    do{
      receipt = await cfxsUtil.getReceipt(hash);
    }while(!receipt);
    console.log("mint result:",receipt);
    const balance = await cfxsUtil.getCoreBalance();
    console.log("balance:",balance.toCFX());
  }
}

program.parse();
console.log("cfxs core bot v0.0.1");