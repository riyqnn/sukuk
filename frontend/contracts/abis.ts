import idrxAbiJson from "@/contracts/abis/IDRX.json";
import sukukVaultAbiJson from "@/contracts/abis/SukukVault.json";
import type { Abi } from "viem";

export const IDRX_ABI = (idrxAbiJson as { abi: Abi }).abi;
export const SUKUK_VAULT_ABI = (sukukVaultAbiJson as { abi: Abi }).abi;