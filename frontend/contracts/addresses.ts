export const SEPOLIA_CHAIN_ID = 11155111;

export const CONTRACTS = {
  idrx: "0xF15E653e19bd35cDBE9c32999a912D040b76324b" as const,
  sukukVault: "0xD963B9bF6747771bc44043445A2a0edba62ccE76" as const,
} as const;

export const ADDRESSES = {
  protocolAdmin: "0x1cEdC27fc1351141c0231BFeD3E7caFA9bbb2238" as const,
  protocolAdmins: [
    "0x1cEdC27fc1351141c0231BFeD3E7caFA9bbb2238",
    "0xa189Be51cb780f0C26e3e161d73F69484d37de85",
  ] as const,
  auditorMultisig: "0x411E4A576d3cA579e8795559875D1F0684452801" as const,
} as const;

export const isAdminAddress = (address?: string): boolean => {
  if (!address) return false;
  return ADDRESSES.protocolAdmins.some(
    (admin) => admin.toLowerCase() === address.toLowerCase()
  );
};