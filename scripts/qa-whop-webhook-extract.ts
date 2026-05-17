/**
 * QA: Whop webhook field extraction (run: npm run qa:whop-webhook-extract)
 */
import {
  extractMembershipExpiresAt,
  extractWhopEmail,
  extractWhopMembershipId,
  extractWhopPlanId,
  extractWhopProductId,
  extractWhopUserId,
} from "../app/lib/whopWebhook";

const REAL_PAYLOAD_EXAMPLE = {
  id: "msg_z4IOHuFPnHyD4hcJlRucyW4X",
  api_version: "v1",
  data: {
    id: "mem_Wowe1crDwOa040",
    member: {
      id: "mber_T2RYYA2rg16UV",
    },
    user: {
      name: null,
      id: "user_2JSde7IjybYg1",
      email: "kieranhiggsgmail@gmail.com",
      username: "soggyspeck",
    },
    plan: {
      id: "plan_JdjBrs5xpfpoN",
    },
    product: {
      id: "prod_6BzpRayCWMnSM",
    },
    renewal_period_end: "2026-06-16T22:53:18.336Z",
    status: "trialing",
  },
  type: "membership.activated",
  timestamp: "2026-05-17T22:53:27.141Z",
} as const;

function assertEqual(label: string, actual: string | null, expected: string | null) {
  if (actual !== expected) {
    console.error(`FAIL ${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    process.exit(1);
  }
  console.log(`OK ${label}`);
}

const email = extractWhopEmail(REAL_PAYLOAD_EXAMPLE);
assertEqual("extractWhopEmail", email, "kieranhiggsgmail@gmail.com");

assertEqual(
  "extractWhopMembershipId",
  extractWhopMembershipId(REAL_PAYLOAD_EXAMPLE),
  "mem_Wowe1crDwOa040"
);
assertEqual(
  "extractWhopUserId",
  extractWhopUserId(REAL_PAYLOAD_EXAMPLE),
  "user_2JSde7IjybYg1"
);
assertEqual(
  "extractWhopPlanId",
  extractWhopPlanId(REAL_PAYLOAD_EXAMPLE),
  "plan_JdjBrs5xpfpoN"
);
assertEqual(
  "extractWhopProductId",
  extractWhopProductId(REAL_PAYLOAD_EXAMPLE),
  "prod_6BzpRayCWMnSM"
);
assertEqual(
  "extractMembershipExpiresAt",
  extractMembershipExpiresAt(REAL_PAYLOAD_EXAMPLE),
  "2026-06-16T22:53:18.336Z"
);

const dataOnlyEmail = extractWhopEmail(REAL_PAYLOAD_EXAMPLE.data);
assertEqual("extractWhopEmail(data object)", dataOnlyEmail, "kieranhiggsgmail@gmail.com");

console.log("\nAll Whop webhook extraction checks passed.");
