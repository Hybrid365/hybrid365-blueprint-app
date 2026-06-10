/** Optional Kit tag on Hybrid 1-1 application submit — never blocks submission. */
export async function tagHybrid11ApplicantInKit(email: string, firstName: string): Promise<void> {
  const apiKey = process.env.KIT_API_KEY?.trim();
  const tagId =
    process.env.KIT_HYBRID_1_1_TAG_ID?.trim() || process.env.KIT_TAG_ID?.trim();

  if (!apiKey || !tagId) {
    if (process.env.NODE_ENV === "development") {
      console.log("[hybrid-1-1] Kit tagging skipped — KIT_API_KEY or KIT_HYBRID_1_1_TAG_ID missing");
    }
    return;
  }

  const createRes = await fetch("https://api.kit.com/v4/subscribers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Kit-Api-Key": apiKey,
    },
    body: JSON.stringify({
      email_address: email,
      first_name: firstName,
      fields: { application_type: "hybrid_1_1", track: "hybrid_performance" },
    }),
  });

  const createText = await createRes.text();
  if (!createRes.ok) {
    console.warn("[hybrid-1-1] Kit subscriber create failed:", createRes.status, createText);
    return;
  }

  let subscriberId: number | undefined;
  try {
    const parsed = JSON.parse(createText) as { subscriber?: { id?: number } };
    subscriberId = parsed.subscriber?.id;
  } catch {
    console.warn("[hybrid-1-1] Kit subscriber response parse failed");
    return;
  }

  if (!subscriberId) return;

  const tagRes = await fetch(
    `https://api.kit.com/v4/tags/${tagId}/subscribers/${subscriberId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Kit-Api-Key": apiKey,
      },
      body: JSON.stringify({}),
    }
  );

  if (!tagRes.ok) {
    const tagText = await tagRes.text();
    console.warn("[hybrid-1-1] Kit tag failed:", tagRes.status, tagText);
  }
}
