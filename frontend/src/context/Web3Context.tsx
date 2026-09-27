import React, { createContext, useContext, useState, useEffect } from "react";
import { ethers } from "ethers";

interface Web3ContextType {
  account: string | null;
  chainId: number | null;
  isConnecting: boolean;
  isCorrectNetwork: boolean;
  contractAddress: string;
  connectWallet: () => Promise<void>;
  switchNetwork: () => Promise<void>;
}

const POLYGON_AMOY_CHAIN_ID = 80002;
const POLYGON_AMOY_HEX = "0x13882";
const CONTRACT_ADDRESS = import.meta.env.VITE_CREDCHAIN_CONTRACT_ADDRESS || "0xCredChainRegistryPolygonAmoy";

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  const checkConnection = async () => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      try {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          setAccount(accounts[0].address);
          const network = await provider.getNetwork();
          setChainId(Number(network.chainId));
        }
      } catch (err) {
        console.warn("Web3 auto-check note:", err);
      }
    }
  };

  useEffect(() => {
    checkConnection();

    if (typeof window !== "undefined" && (window as any).ethereum) {
      const handleAccounts = (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          setAccount(null);
        }
      };

      const handleChain = (hexChain: string) => {
        setChainId(parseInt(hexChain, 16));
      };

      (window as any).ethereum.on("accountsChanged", handleAccounts);
      (window as any).ethereum.on("chainChanged", handleChain);

      return () => {
        (window as any).ethereum?.removeListener("accountsChanged", handleAccounts);
        (window as any).ethereum?.removeListener("chainChanged", handleChain);
      };
    }
  }, []);

  const connectWallet = async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      alert("MetaMask or Web3 wallet is not detected in your browser. Please install MetaMask to interact directly with Polygon Amoy.");
      return;
    }

    setIsConnecting(true);
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        const network = await provider.getNetwork();
        setChainId(Number(network.chainId));

        if (Number(network.chainId) !== POLYGON_AMOY_CHAIN_ID) {
          await switchNetwork();
        }
      }
    } catch (error: any) {
      console.error("Wallet connection error:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  const switchNetwork = async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) return;
    try {
      await (window as any).ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: POLYGON_AMOY_HEX }],
      });
    } catch (switchError: any) {
      // 4902 error code means network is not added yet
      if (switchError.code === 4902) {
        try {
          await (window as any).ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: POLYGON_AMOY_HEX,
                chainName: "Polygon Amoy Testnet",
                nativeCurrency: {
                  name: "POL",
                  symbol: "POL",
                  decimals: 18,
                },
                rpcUrls: ["https://rpc-amoy.polygon.technology"],
                blockExplorerUrls: ["https://amoy.polygonscan.com/"],
              },
            ],
          });
        } catch (addError) {
          console.error("Failed to add Polygon Amoy to MetaMask:", addError);
        }
      }
    }
  };

  const isCorrectNetwork = chainId === POLYGON_AMOY_CHAIN_ID;

  return (
    <Web3Context.Provider
      value={{
        account,
        chainId,
        isConnecting,
        isCorrectNetwork,
        contractAddress: CONTRACT_ADDRESS,
        connectWallet,
        switchNetwork,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) throw new Error("useWeb3 must be used within a Web3Provider");
  return context;
};
