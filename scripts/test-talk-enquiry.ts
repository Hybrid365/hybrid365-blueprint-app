/**
 * Local validation checks for Talk to Kieran enquiries. No database writes.
 *
 *   npx tsx scripts/test-talk-enquiry.ts
 */

import {
  isTalkEnquiryHoneypotTriggered,
  normalizeInstagramHandle,
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

assert("valid required fields", validateTalkEnquiry({
  first_name: "Kieran",
  instagram_handle: "kieranhiggs",
  main_goal: "Sub-60 HYROX",
}).ok);

assert("valid with optional fields", validateTalkEnquiry({
  first_name: "Kieran",
  instagram_handle: "@kieranhiggs",
  main_goal: "Sub-60 HYROX",
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
  first_name: "Kieran",
  instagram_handle: "@kieran",
  main_goal: "Goal",
  email: "not-an-email",
}).ok);

assert("empty email allowed", validateTalkEnquiry({
  first_name: "Kieran",
  instagram_handle: "@kieran",
  main_goal: "Goal",
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

if (failed) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}

console.log("\nTalk enquiry validation checks passed");
