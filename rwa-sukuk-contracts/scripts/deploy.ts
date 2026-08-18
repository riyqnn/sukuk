import { ethers, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Deployment flow:
 *   1. Deploy IDRX (mock stablecoin).
 *   2. Deploy SukukVault with (underlying, name, symbol, admin, auditor multisig).
 *   3. Grant PROTOCOL_ROLE to the protocol admin (defaults to deployer).
 *   4. Log all addresses and persist them to deployments/<network>.json.
 */
async function main() {
  const [deployer] = await ethers.getSigners();

  const auditorMultisig = process.env.AUDITOR_MULTISIG;
  if (!auditorMultisig) {
    throw new Error("AUDITOR_MULTISIG is not set in .env");
  }
  const protocolAdmin = process.env.PROTOCOL_ADMIN ?? deployer.address;

  console.log(`\n=== Deploying to network: ${network.name} ===`);
  console.log(`Deployer:            ${deployer.address}`);
  console.log(`Protocol admin:      ${protocolAdmin}`);
  console.log(`Auditor multisig:    ${auditorMultisig}\n`);

  // 1. Deploy IDRX
  const IDRX = await ethers.getContractFactory("IDRX");
  const idrx = await IDRX.deploy(deployer.address);
  await idrx.waitForDeployment();
  const idrxAddress = await idrx.getAddress();
  console.log(`IDRX deployed at:    ${idrxAddress}`);

  // 2. Deploy SukukVault
  const SukukVault = await ethers.getContractFactory("SukukVault");
  const vault = await SukukVault.deploy(
    idrxAddress,
    "Sukuk Share Token",
    "sSUKUK",
    protocolAdmin,
    auditorMultisig
  );
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log(`SukukVault deployed: ${vaultAddress}`);

  // 3. Ensure PROTOCOL_ROLE is held by the protocol admin (constructor already grants
  //    it to `admin_`, but make it explicit in case PROTOCOL_ADMIN != deployer).
  const PROTOCOL_ROLE = await vault.PROTOCOL_ROLE();
  const hasProtocolRole = await vault.hasRole(PROTOCOL_ROLE, protocolAdmin);
  if (!hasProtocolRole) {
    const tx = await vault.grantRole(PROTOCOL_ROLE, protocolAdmin);
    await tx.wait();
    console.log(`Granted PROTOCOL_ROLE to: ${protocolAdmin}`);
  } else {
    console.log(`PROTOCOL_ROLE already held by: ${protocolAdmin}`);
  }

  const AUDITOR_ROLE = await vault.AUDITOR_ROLE();
  const hasAuditorRole = await vault.hasRole(AUDITOR_ROLE, auditorMultisig);
  console.log(
    `AUDITOR_ROLE held by multisig: ${hasAuditorRole ? "yes" : "NO — verify constructor arg"}`
  );

  // 4. Persist deployment artifacts
  const out: Record<string, unknown> = {
    network: network.name,
    chainId: network.config.chainId,
    idrx: idrxAddress,
    sukukVault: vaultAddress,
    protocolAdmin,
    auditorMultisig,
  };

  const dir = path.join(__dirname, "..", "deployments");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, `${network.name}.json`),
    JSON.stringify(out, null, 2)
  );
  console.log(`\nSaved deployment to deployments/${network.name}.json`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
