import { prisma } from "@/lib/prisma";
import type { AgreementType } from "@prisma/client";
import {
  getTemplate,
  renderTemplate,
  type RenderContext,
} from "./templates";

/**
 * Pull a case (and its claimant, if any) and build the RenderContext used
 * by the template engine. Returns null if the case doesn't exist.
 */
export async function buildRenderContext(
  claimId: string,
  feePercent: number,
  agentName: string,
): Promise<RenderContext | null> {
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    include: {
      claimant: true,
    },
  });
  if (!claim) return null;

  return {
    ownerName: claim.ownerName,
    countyName: claim.countyName,
    state: claim.state,
    propertyAddr: claim.propertyAddr,
    parcelId: claim.parcelId,
    amount: claim.amount,
    deadlineDate: claim.deadlineDate,
    surplusType: claim.surplusType,

    claimantName: claim.claimant?.fullName ?? claim.ownerName,
    claimantEmail: claim.claimant?.email ?? null,
    claimantPhone: claim.claimant?.phone ?? null,
    claimantAddress:
      claim.claimant?.address ?? claim.propertyAddr ?? null,

    firmName: process.env.FIRM_NAME || "OneClickIT Surplus Recovery",
    firmContact: process.env.FIRM_CONTACT || "hello@oneclickit.com",
    agentName,
    feePercent,

    today: new Date().toISOString().slice(0, 10),
  };
}

/** Render an agreement and return the full text body, title, and context. */
export async function renderAgreement(
  claimId: string,
  type: AgreementType,
  feePercent: number,
  agentName: string,
): Promise<{ title: string; text: string } | null> {
  const ctx = await buildRenderContext(claimId, feePercent, agentName);
  if (!ctx) return null;
  const tpl = getTemplate(type);
  return {
    title: tpl.title,
    text: renderTemplate(tpl.body, ctx),
  };
}
