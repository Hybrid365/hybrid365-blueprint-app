/**
 * Local validation checks for coaching enquiries. No database writes.
 *
 *   npx tsx scripts/test-talk-enquiry.ts
 */

import {
  COACHING_ENQUIRY_SOURCE,
  FIRST_HYROX_LEVEL_VALUE,
  isTalkEnquiryHoneypotTriggered,
  normalizeInstagramHandle,
  resolveCoachingEnquirySource,
  sanitizeAttribution,
  validateTalkEnquiry,
} from "../app/lib/start/talkEnquiry";

let failed = 0;

function assert(name: string, condition: boolean) {
  if (condition) {
    console.log(`✓ ${name}`);
    return;
  }
  failed += 1;
  console.error(`✗ ${name}`);
}

const base = {
  first_name: "Kieran",
  instagram_handle: "@kieranhiggs",
  main_goal: "Sub-60 HYROX",
};

assert("valid required fields", validateTalkEnquiry(base).ok);

assert("valid with optional fields", validateTalkEnquiry({
  ...base,
  email: "kieran@example.com",
  hyrox_pb: "59:14",
  next_race: "London, March 2027",
}).ok);

assert("missing name", !validateTalkEnquiry({
  instagram_handle: "@kieran",
  main_goal: "Goal",
}).ok);

assert("missing instagram", !validateTalkEnquiry({
  first_name: "Kieran",
  main_goal: "Goal",
}).ok);

assert("missing goal", !validateTalkEnquiry({
  first_name: "Kieran",
  instagram_handle: "@kieran",
}).ok);

assert("whitespace-only name", !validateTalkEnquiry({
  first_name: "   ",
  instagram_handle: "@kieran",
  main_goal: "Goal",
}).ok);

assert("whitespace-only instagram", !validateTalkEnquiry({
  first_name: "Kieran",
  instagram_handle: "   ",
  main_goal: "Goal",
}).ok);

assert("whitespace-only goal", !validateTalkEnquiry({
  first_name: "Kieran",
  instagram_handle: "@kieran",
  main_goal: "   ",
}).ok);

assert("malformed email rejected", !validateTalkEnquiry({
  ...base,
  email: "not-an-email",
}).ok);

assert("empty email allowed", validateTalkEnquiry({
  ...base,
  email: "  ",
}).ok);

assert("handle without @ stores @handle", normalizeInstagramHandle("kieranhiggs") === "@kieranhiggs");
assert("handle with @ stores @handle", normalizeInstagramHandle("@kieranhiggs") === "@kieranhiggs");
assert("instagram url stores @handle", normalizeInstagramHandle("https://instagram.com/kieranhiggs") === "@kieranhiggs");
assert("empty handle rejected", normalizeInstagramHandle("   ") === null);
assert("handle mixed case lowercased", normalizeInstagramHandle("@KieranHiggs") === "@kieranhiggs");

const withHandle = validateTalkEnquiry({
  first_name: "Kieran",
  instagram_handle: "handle",
  main_goal: "Goal",
});
assert("payload stores @handle", withHandle.ok && withHandle.data.instagram_handle === "@handle");

assert("attribution sanitizes known keys", sanitizeAttribution({
  utm_source: "instagram",
  evil: "nope",
})?.utm_source === "instagram" && !("evil" in (sanitizeAttribution({ utm_source: "instagram", evil: "nope" }) ?? {})));

assert("honeypot triggered", isTalkEnquiryHoneypotTriggered({ company_website: "https://spam.test" }));
assert("honeypot empty ok", !isTalkEnquiryHoneypotTriggered({ company_website: "  " }));

const talkDefault = validateTalkEnquiry(base);
assert(
  "talk default source is talk_to_kieran",
  talkDefault.ok && talkDefault.data.source === COACHING_ENQUIRY_SOURCE.talkToKieran
);
assert("talk PB remains optional", talkDefault.ok && talkDefault.data.current_hyrox_pb === null);

const startPb = validateTalkEnquiry({ ...base, source: "start_funnel", hyrox_pb: "1:15" });
assert(
  "start_funnel source preserved",
  startPb.ok && startPb.data.source === COACHING_ENQUIRY_SOURCE.startFunnel
);

assert(
  "unknown source ignored",
  resolveCoachingEnquirySource("hyrox_applications") === COACHING_ENQUIRY_SOURCE.talkToKieran
);

const arbitrary = validateTalkEnquiry({ ...base, source: "hyrox_applications" });
assert(
  "arbitrary source not stored",
  arbitrary.ok && arbitrary.data.source === COACHING_ENQUIRY_SOURCE.talkToKieran
);

assert(
  "start_funnel missing HYROX level accepted",
  validateTalkEnquiry({ ...base, source: "start_funnel" }).ok
);
assert(
  "start_funnel first HYROX accepted",
  validateTalkEnquiry({ ...base, source: "start_funnel", hyrox_pb: FIRST_HYROX_LEVEL_VALUE }).ok
);
assert(
  "start_funnel PB accepted",
  validateTalkEnquiry({ ...base, source: "start_funnel", hyrox_pb: "1:12" }).ok
);
assert(
  "start_funnel empty race allowed",
  validateTalkEnquiry({
    ...base,
    source: "start_funnel",
    hyrox_pb: FIRST_HYROX_LEVEL_VALUE,
    next_race: "  ",
  }).ok
);

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}

console.log("\nTalk enquiry validation checks passed");
