const { Conflux, Drip, address } = require('js-conflux-sdk');
const { ethers } = require("ethers");
const CORE_URL = process.env.CORE_URL;
const ESPACE_URL = process.env.ESPACE_URL;
const GASPRICE = process.env.gasprice || 90;
const GASLimit = process.env.gasLimit || 1770000;
const cfxs_contract = '0xc6e865c213c89ca42a622c5572d19f00d84d7a16';
const cfxsAbi = [{ "anonymous": false, "inputs": [{ "indexed": false, "internalType": "uint256", "name": "id", "type": "uint256" }, { "indexed": false, "internalType": "address", "name": "to", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }, { "indexed": false, "internalType": "string", "name": "data", "type": "string" }], "name": "CFXsCreated", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "uint256", "name": "id", "type": "uint256" }], "name": "CFXsDeleted", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "uint256", "name": "id", "type": "uint256" }, { "indexed": false, "internalType": "address", "name": "to", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }, { "indexed": false, "internalType": "string", "name": "data", "type": "string" }], "name": "CFXsEvent", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "uint256", "name": "CFXsId", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "etherAmount", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "locktime", "type": "uint256" }], "name": "CFXsLocked", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "uint256", "name": "CFXsId", "type": "uint256" }], "name": "CFXsUnlocked", "type": "event" }, { "inputs": [], "name": "CFXsCounter", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "name": "CFXss", "outputs": [{ "internalType": "uint256", "name": "id", "type": "uint256" }, { "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }, { "internalType": "string", "name": "data", "type": "string" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "CreateCFXs", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "CFXsId", "type": "uint256" }, { "internalType": "address", "name": "_to", "type": "address" }, { "internalType": "uint256", "name": "_amount", "type": "uint256" }], "name": "DangerTransfer", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "name": "LockedCFXs", "outputs": [{ "internalType": "uint256", "name": "_ether", "type": "uint256" }, { "internalType": "uint256", "name": "locktime", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "CFXsId", "type": "uint256" }, { "internalType": "uint256", "name": "_ether", "type": "uint256" }, { "internalType": "uint256", "name": "locktime", "type": "uint256" }], "name": "LockingScript", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "CFXsId", "type": "uint256" }], "name": "OwnerUnlockingScript", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "CFXsId", "type": "uint256" }], "name": "UnlockingScript", "outputs": [], "stateMutability": "payable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_addr", "type": "address" }], "name": "balanceOf", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "_id", "type": "uint256" }], "name": "getLockStates", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "uint256", "name": "CFXsId", "type": "uint256" }, { "internalType": "string", "name": "_data", "type": "string" }], "name": "inscribe", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "components": [{ "internalType": "uint256[]", "name": "inputs", "type": "uint256[]" }, { "components": [{ "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" }, { "internalType": "string", "name": "data", "type": "string" }], "internalType": "struct CFXsContract.OutputCFXsData[]", "name": "outputs", "type": "tuple[]" }], "internalType": "struct CFXsContract.Transaction", "name": "_tx", "type": "tuple" }], "name": "processTransaction", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "totalSupply", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "stateMutability": "payable", "type": "receive" }];
const ONECFX = 1000000000000000000n;
const BLIMIT = 2n;

class CoreCfxsUtil {
  constructor(pKey, gasprice = 120) {
    try {
      this.conflux = new Conflux({
        url: CORE_URL,
        networkId: 1029,
        defaultGasPrice: Drip.fromGDrip(GASPRICE)
      });
      this.crossSpaceCall = this.conflux.InternalContract('CrossSpaceCall');
      const account = this.conflux.wallet.addPrivateKey('0x' + pKey);
      this.account = account;
      this.gasprice = gasprice;
      const provider = new ethers.providers.JsonRpcProvider(ESPACE_URL);
      const eContract = new ethers.Contract(cfxs_contract, cfxsAbi, provider);
      this.eContract = eContract;
    } catch (error) {
      console.error("init coreCfxsUtil failed.");
      throw error;
    }
  }

  async getNonce() {
    return new Promise((resolve, reject) => {
      this.conflux.getNextNonce(this.account.address)
        .then(nonce => {
          resolve(nonce);
        })
        .catch(err => reject(err));
    });
  }

  async getEvmaddress() {
    return address.cfxMappedEVMSpaceAddress(this.account.address);
  }

  async getCoreBalance() {
    return new Promise((resolve, reject) => {
      this.conflux.cfx.getBalance(this.account.address)
        .then(balance => {
          resolve(balance);
        })
        .catch(err => {
          reject(err);
        })
    });
  }

  //获取与core关联地址的cfxs数量
  getWalletBalance() {
    return new Promise((resolve, reject) => {
      const params = {
        from: this.account.address,
        gasPrice: Drip.fromGDrip(this.gasprice)
      }
      const runone = async (params) => {
        const packedTx = await this.crossSpaceCall.staticCallEVM(cfxs_contract, this.eContract.interface.encodeFunctionData("CFXsCounter"))
          .sendTransaction(params).get();
        return packedTx;
      }
      runone(params)
        .then(result => {
          resolve(result);
        })
        .catch(err => {
          reject(err);
        })

    });
  }

  //获取已经铸造的铭文数量
  getTotalminted() {
    return new Promise((resolve, reject) => {

    });
  }

  async mint(nonce) {
    return new Promise((resolve, reject) => {
      const params = {
        from: this.account.address,
        nonce: nonce,
        gasPrice: Drip.fromGDrip(this.gasprice)
      }
      const runone = async (params) => {
        let hash = await this.crossSpaceCall.transferEVM(cfxs_contract).sendTransaction(params);
        return hash;
      }
      runone(params)
        .then(result => {
          resolve(result);
        })
        .catch(err => {
          reject(err);
        })
    });
  }

  lte(balance) {
    if (balance == 2n) {
      return false;
    }
    const islarge = balance < ONECFX * BLIMIT;
    return islarge;
  }

  async getReceipt(txHash, delay = 1400) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        this.conflux.getTransactionReceipt(txHash)
          .then(result => {
            resolve(result);
          })
          .catch(err => reject(err));
      }, delay)

    });
  }
}

module.exports = CoreCfxsUtil;