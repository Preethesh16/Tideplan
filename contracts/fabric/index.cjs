"use strict";
const { Contract } = require("fabric-contract-api");
// Integration blueprint only. The browser demo does not connect to Fabric.
class TidePlanContract extends Contract {
  constructor() {
    super("TidePlan");
  }
  async Approve(ctx, planId, borrowerIdentity, evidenceHash) {
    if (ctx.clientIdentity.getMSPID() !== "LenderMSP")
      throw new Error("Lender organization required");
    if (
      !/^[a-zA-Z0-9-]{1,80}$/.test(planId) ||
      !borrowerIdentity ||
      !/^[a-f0-9]{64}$/.test(evidenceHash)
    )
      throw new Error("Invalid evidence");
    const key = ctx.stub.createCompositeKey("plan", [planId]);
    if ((await ctx.stub.getState(key)).length)
      throw new Error("Plan version already exists");
    const record = {
      planId,
      borrowerIdentity,
      evidenceHash,
      status: "APPROVED",
      approvalTx: ctx.stub.getTxID(),
    };
    await ctx.stub.putState(key, Buffer.from(JSON.stringify(record)));
    ctx.stub.setEvent(
      "PlanApproved",
      Buffer.from(JSON.stringify({ planId, evidenceHash })),
    );
    return JSON.stringify(record);
  }
  async Consent(ctx, planId) {
    const key = ctx.stub.createCompositeKey("plan", [planId]);
    const raw = await ctx.stub.getState(key);
    if (!raw.length) throw new Error("Unknown plan");
    const record = JSON.parse(raw.toString());
    if (ctx.clientIdentity.getID() !== record.borrowerIdentity)
      throw new Error("Named borrower required");
    if (record.status !== "APPROVED")
      throw new Error("Consent already recorded");
    record.status = "CONSENTED";
    record.consentTx = ctx.stub.getTxID();
    await ctx.stub.putState(key, Buffer.from(JSON.stringify(record)));
    return JSON.stringify(record);
  }
  async ReadPlan(ctx, planId) {
    const raw = await ctx.stub.getState(
      ctx.stub.createCompositeKey("plan", [planId]),
    );
    if (!raw.length) throw new Error("Unknown plan");
    return raw.toString();
  }
}
module.exports.contracts = [TidePlanContract];
