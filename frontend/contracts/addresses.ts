export const SEPOLIA_CHAIN_ID = 11155111;

/** Block in which SukukVault was deployed; lower bound for event queries. */
export const VAULT_DEPLOY_BLOCK = 11776473n;

export const CONTRACTS = {
  idrx: "0x26071A9337090447C167A68A6a28057Eb1eDD570" as const,
  sukukVault: "0xB9C61659a77bbD47CddD4a63914cBFa762866B04" as const,
} as const;

export const ADDRESSES = {
  protocolAdmin: "0x1cEdC27fc1351141c0231BFeD3E7caFA9bbb2238" as const,
  /** Wallets granted PROTOCOL_ROLE on SukukVault. The UI still checks hasRole() on-chain. */
  protocolAdmins: [
    "0x1cEdC27fc1351141c0231BFeD3E7caFA9bbb2238",
    "0xa189Be51cb780f0C26e3e161d73F69484d37de85",
  ] as const,
  auditorMultisig: "0x411E4A576d3cA579e8795559875D1F0684452801" as const,
} as const;
