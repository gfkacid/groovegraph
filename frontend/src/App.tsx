import React, { useState, useEffect } from 'react';
import Menu from './components/Menu';
import Content from './components/Content';
import { CHAIN_NAMESPACES, IProvider, WEB3AUTH_NETWORK } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { Web3Auth } from "@web3auth/modal";
import RPC from "./ethersRPC";

const clientId = "BE_EMkx5m3ahpo2dfSBGY1W6OuB2Kc6MZratSXiFNuAKA_qFkGVcSSsPWXtXhMg7_vXJJWdTeItsNS2QiGceaEw";//import.meta.env.VITE_WEB3AUTH_CLIENT_ID || "";

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0xaa36a7",
  rpcTarget: "https://rpc.ankr.com/eth_sepolia",
  displayName: "Ethereum Sepolia Testnet",
  blockExplorerUrl: "https://sepolia.etherscan.io",
  ticker: "ETH",
  tickerName: "Ethereum",
  logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
};

const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: { chainConfig },
});

const web3auth = new Web3Auth({
  clientId,
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
  privateKeyProvider,
});

function App() {
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        await web3auth.initModal();
        setProvider(web3auth.provider);

        if (web3auth.connected) {
          setLoggedIn(true);
        }
      } catch (error) {
        console.error(error);
      }
    };

    init();
  }, []);

  const login = async () => {
    const web3authProvider = await web3auth.connect();
    setProvider(web3authProvider);
    if (web3auth.connected) {
      setLoggedIn(true);
    }
  };

  const getUserInfo = async () => {
    const user = await web3auth.getUserInfo();
    console.log(user);
  };

  const logout = async () => {
    await web3auth.logout();
    setProvider(null);
    setLoggedIn(false);
    console.log("logged out");
  };

  const getAccounts = async () => {
    if (!provider) {
      console.log("provider not initialized yet");
      return;
    }
    const address = await RPC.getAccounts(provider);
    console.log(address);
    return address;
  };

  const getBalance = async () => {
    if (!provider) {
      console.log("provider not initialized yet");
      return;
    }
    const balance = await RPC.getBalance(provider);
    console.log(balance);
    return balance;
  };

  useEffect(() => {
    const fetchAccounts = async () => {
      if (loggedIn) {
        const addy = await getAccounts();
        setWalletAddress(addy);
      }
    };
    fetchAccounts();
  }, [loggedIn]);

  return (
    <div className="min-h-screen bg-background text-text">
      <div className="grid grid-cols-12 gap-10 mx-8">
        <div className="col-span-2 fixed h-screen">
          <Menu loggedIn={loggedIn} walletAddress={walletAddress} login={login} logout={logout}/>
        </div>
        <div className="col-span-10 col-start-3">
          <Content />
        </div>
      </div>
    </div>
  );
}

export default App;