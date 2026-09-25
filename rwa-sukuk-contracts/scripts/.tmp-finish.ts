import { ethers } from "hardhat";
import * as fs from "fs";

const SAFE_ABI = [
  "function execTransaction(address to,uint256 value,bytes data,uint8 operation,uint256 safeTxGas,uint256 baseGas,uint256 gasPrice,address gasToken,address refundReceiver,bytes signatures) payable returns (bool)",
];
const f = ethers.formatEther;

async function safeExec(safeAddr: string, to: string, data: string) {
  const [me] = await ethers.getSigners();
  const safe = await ethers.getContractAt(SAFE_ABI, safeAddr);
  const sig = ethers.solidityPacked(["uint256", "uint256", "uint8"], [me.address, 0, 1]);
  const tx = await safe.execTransaction(to, 0, data, 0, 0, 0, 0, ethers.ZeroAddress, ethers.ZeroAddress, sig);
  return tx.wait();
}

async function main() {
  const d = JSON.parse(fs.readFileSync("./deployments/sepolia-certificate.json", "utf8"));
  const [me] = await ethers.getSigners();
  const c = await ethers.getContractAt("SukukCertificate", d.sukukCertificate);
  const t = await ethers.getContractAt("MockIDRX", d.idrx);

  const maturity = Number(await c.maturityDate());
  for (;;) {
    const now = Math.floor(Date.now() / 1000);
    if (now >= maturity + 15) break;
    console.log(`waiting for maturity, ${maturity - now}s left`);
    await new Promise((r) => setTimeout(r, 30000));
  }

  await (await c.markMatured()).wait();
  console.log("markMatured -> phase", await c.phase());

  const r = await safeExec(d.auditorSafe, d.sukukCertificate, c.interface.encodeFunctionData("openRedemption", []));
  console.log("Safe openRedemption tx", r?.hash, "-> phase", await c.phase());

  const shares = await c.balanceOf(me.address);
  await (await c.requestRedeem(shares, me.address, me.address)).wait();
  console.log("requested", f(shares), "| balance now", f(await c.balanceOf(me.address)));
  console.log("pending", f(await c.pendingRedeemRequest(0, me.address)), "claimable", f(await c.claimableRedeemRequest(0, me.address)));
  console.log("totalAssets after request", f(await c.totalAssets()), "pendingRedemptionAssets", f(await c.pendingRedemptionAssets()));

  await (await c.fulfillRedeem([me.address])).wait();
  console.log("fulfilled -> claimable", f(await c.claimableRedeemRequest(0, me.address)), "maxWithdraw", f(await c.maxWithdraw(me.address)));

  const before = await t.balanceOf(me.address);
  await (await c.redeem(await c.claimableRedeemRequest(0, me.address), me.address, me.address)).wait();
  console.log("claimed", f((await t.balanceOf(me.address)) - before), "IDRX");
  console.log("FINAL phase", await c.phase(), "supply", f(await c.totalSupply()), "totalAssets", f(await c.totalAssets()));
  console.log("contract IDRX left", f(await t.balanceOf(d.sukukCertificate)));
}

main().catch((e) => {
  console.error("FAILED:", e.shortMessage ?? e.message);
  process.exitCode = 1;
});
