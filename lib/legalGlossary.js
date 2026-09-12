/**
 * CourtFlight — Plain-language Legal Glossary
 * Maps formal legal terms and case categories to concise, accessible explanations
 * for non-lawyer citizens and litigants.
 */

export const GLOSSARY = {
  // Case types in cases.json dataset
  "Criminal": "Proceedings initiated by the state or complainant to investigate, prosecute, and adjudicate alleged criminal offences.",
  "Civil": "A dispute between two parties over money, property, rights, or contractual obligations — not a criminal offence.",
  "Commercial": "High-value business disputes involving commercial contracts, partnership disputes, banking, or trade transactions.",
  "Property": "A legal disagreement over ownership, boundary lines, partition, tenancy, or rights to a piece of land or building.",
  "Family": "Matrimonial disputes, child custody, maintenance, divorce, and domestic relations adjudicated under family law.",
  "Service": "Litigation between employees and government/public sector employers regarding promotions, recruitment, or pensions.",
  
  // Specific case categories & procedural shorthand
  "Cheque Bounce (Sec 138 NI Act)": "A case where a cheque payment failed to clear, and the receiver is taking legal action to recover the money.",
  "Civil Suit": "A dispute between two parties over money, property, or a contract — not a criminal matter.",
  "Property Dispute": "A legal disagreement over ownership, boundaries, or rights to a piece of land or property.",
  "Criminal Appeal": "A request to a higher court to review and overturn the verdict or sentence of a lower criminal court.",
  "Divorce Petition": "A legal request submitted by one or both spouses to formally dissolve a marriage.",
  "Motor Accident Claim": "A claim for compensation filed after a road accident, usually involving personal injury or vehicle damage.",
  "Consumer Complaint": "A complaint filed against a company or vendor for defective goods, deficiency of service, or unfair trade practices."
};

/**
 * Look up a term in the legal glossary.
 * Case-insensitive match with fallback trimming.
 */
export function getGlossaryExplanation(term) {
  if (!term || typeof term !== 'string') return null;
  const direct = GLOSSARY[term];
  if (direct) return direct;

  const lower = term.toLowerCase().trim();
  for (const [key, value] of Object.entries(GLOSSARY)) {
    if (key.toLowerCase() === lower) {
      return value;
    }
  }
  return null;
}
