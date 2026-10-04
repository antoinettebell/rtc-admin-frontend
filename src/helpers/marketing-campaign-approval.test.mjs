import assert from "node:assert/strict";
import test from "node:test";

import {
  approveCampaignState,
  campaignTypeLabel,
  campaignActionsDisabled,
  campaignCanApprove,
  campaignApprovalEndpoints,
  campaignRegenerationIsActive,
  campaignFailureMessage,
  campaignStatusIsFailure,
  campaignStatusLabel,
  campaignVideoDownloadName,
  discardConfirmationMessage,
  discardFailureMessage,
  discardCampaignState,
  initialCampaignApprovalUiState,
  emptyCampaignMessage,
  preserveUsableRendition,
  reasonLabel,
  reduceCampaignApprovalUi,
  replaceCampaign,
  toggleVendorSelection,
} from "./marketing-campaign-approval.js";

test("pending is expanded and approved is collapsed by default", () => {
  assert.deepEqual(initialCampaignApprovalUiState(), {
    pendingOpen: true, approvedOpen: false, previewCampaignId: null, detailsCampaignId: null,
  });
});

test("sections and preview/details controls open and close independently", () => {
  let state = initialCampaignApprovalUiState();
  state = reduceCampaignApprovalUi(state, { type: "TOGGLE_PENDING" });
  state = reduceCampaignApprovalUi(state, { type: "TOGGLE_APPROVED" });
  state = reduceCampaignApprovalUi(state, { type: "OPEN_PREVIEW", campaignId: "one" });
  state = reduceCampaignApprovalUi(state, { type: "OPEN_DETAILS", campaignId: "two" });
  assert.deepEqual(state, {
    pendingOpen: false, approvedOpen: true, previewCampaignId: "one", detailsCampaignId: "two",
  });
  assert.equal(reduceCampaignApprovalUi(state, { type: "CLOSE_PREVIEW" }).previewCampaignId, null);
  assert.equal(reduceCampaignApprovalUi(state, { type: "CLOSE_DETAILS" }).detailsCampaignId, null);
});

test("maps reasons to human-readable labels and preserves future values", () => {
  assert.equal(reasonLabel("NEW_SPOTLIGHT"), "New Spotlight");
  assert.equal(reasonLabel("SCHEDULE_CHANGE"), "Schedule Updated");
  assert.equal(reasonLabel("CONTENT_CHANGE"), "Vendor Content Changed");
  assert.equal(reasonLabel("MONTHLY_REFRESH"), "Monthly Refresh");
  assert.equal(reasonLabel("MANUAL_GENERATION"), "Manual Generation");
  assert.equal(reasonLabel("MANUAL_REGENERATION"), "Regenerated");
  assert.equal(campaignTypeLabel("APP_FEATURE"), "App Feature");
  assert.equal(campaignTypeLabel("EVENT_PROMOTION"), "Event Promotion");
});

test("uses the required queue empty states", () => {
  assert.equal(emptyCampaignMessage("pending"), "No campaigns are waiting for approval.");
  assert.equal(emptyCampaignMessage("approved"), "No approved campaigns yet.");
});

test("uses the authenticated RTC backend campaign endpoints", () => {
  assert.equal(campaignApprovalEndpoints.pending, "/api/v1/marketing/campaigns/pending");
  assert.equal(campaignApprovalEndpoints.approved, "/api/v1/marketing/campaigns/approved");
  assert.equal(campaignApprovalEndpoints.eligibleVendors, "/api/v1/marketing/campaigns/eligible-vendors");
  assert.equal(campaignApprovalEndpoints.eligibleAppFeatures, "/api/v1/marketing/campaigns/eligible-app-features");
  assert.equal(campaignApprovalEndpoints.eligibleEvents, "/api/v1/marketing/campaigns/eligible-events");
  assert.equal(campaignApprovalEndpoints.generate, "/api/v1/marketing/campaigns/generate");
  assert.equal(campaignApprovalEndpoints.generateAppFeatures, "/api/v1/marketing/campaigns/generate-app-features");
  assert.equal(campaignApprovalEndpoints.generateEvents, "/api/v1/marketing/campaigns/generate-events");
  assert.equal(campaignApprovalEndpoints.details("campaign one"), "/api/v1/marketing/campaigns/campaign%20one");
  assert.equal(campaignApprovalEndpoints.approve("one"), "/api/v1/marketing/campaigns/one/approve");
  assert.equal(campaignApprovalEndpoints.discard("one"), "/api/v1/marketing/campaigns/one/discard");
  assert.equal(campaignApprovalEndpoints.regenerate("one"), "/api/v1/marketing/campaigns/one/regenerate");
});

test("creates a safe MP4 filename for pending and archived campaign downloads", () => {
  assert.equal(campaignVideoDownloadName({
    businessName: "Jazzy Fried Rice!", campaignId: "abc-123:private",
  }), "jazzy-fried-rice-abc-123priva.mp4");
});

test("approval moves one row without duplication and maintains counts", () => {
  const campaign = { campaignId: "one", approvedAt: "2026-09-20T12:00:00Z" };
  const result = approveCampaignState(
    [{ campaignId: "one" }, { campaignId: "two" }],
    [{ campaignId: "three", approvedAt: "2026-09-19T12:00:00Z" }], campaign,
  );
  assert.deepEqual(result.pending.map((item) => item.campaignId), ["two"]);
  assert.deepEqual(result.approved.map((item) => item.campaignId), ["one", "three"]);
});

test("discard removes only the selected pending campaign", () => {
  assert.deepEqual(
    discardCampaignState([{ campaignId: "one" }, { campaignId: "two" }], "one"),
    [{ campaignId: "two" }],
  );
});

test("discard confirmation names the selected campaign and explains the effect", () => {
  assert.equal(
    discardConfirmationMessage({ businessName: "Featured Vendor Discovery" }),
    "Discard \"Featured Vendor Discovery\"?\n\nThis removes it from Pending Campaigns without approving or publishing it.",
  );
});

test("discard failures distinguish timeouts and service failures", () => {
  assert.match(discardFailureMessage({ code: "ECONNABORTED" }), /timed out/i);
  assert.match(discardFailureMessage({
    response: { data: { data: { error: { code: "MARKETING_CONTROL_REQUEST_FAILED" } } } },
  }), /marketing service/i);
  assert.match(discardFailureMessage({}), /remains in the review queue/i);
});

test("regeneration replaces the same row and keeps the usable rendition on failure", () => {
  const current = { campaignId: "one", videoUrl: "https://video.example/keeper.mp4", regenerationCount: 1 };
  const processing = { campaignId: "one", generationStatus: "PROCESSING", regenerationCount: 2 };
  const rows = replaceCampaign([current], preserveUsableRendition(current, processing));
  assert.equal(rows.length, 1);
  assert.equal(rows[0].videoUrl, current.videoUrl);
  const failed = preserveUsableRendition(rows[0], { campaignId: "one", generationStatus: "FAILED", videoUrl: null });
  assert.equal(failed.videoUrl, current.videoUrl);
});

test("queued, generating, and rendering jobs disable regeneration and approval", () => {
  assert.equal(campaignRegenerationIsActive({ regenerationStatus: "QUEUED" }), true);
  assert.equal(campaignRegenerationIsActive({ regenerationStatus: "PROCESSING" }), true);
  assert.equal(campaignRegenerationIsActive({ regenerationStatus: "RETRY_SCHEDULED" }), true);
  assert.equal(campaignRegenerationIsActive({ regenerationStatus: "WAITING_FOR_RENDER" }), true);
  assert.equal(campaignRegenerationIsActive({ regenerationStatus: "READY_FOR_APPROVAL" }), false);
  assert.equal(campaignActionsDisabled({ campaignId: "one", generationStatus: "PROCESSING" }), true);
  assert.equal(campaignActionsDisabled({ campaignId: "one", generationStatus: "COMPLETED", regenerationStatus: "QUEUED" }), true);
  assert.equal(campaignActionsDisabled({ campaignId: "one", generationStatus: "COMPLETED" }, "one"), true);
  assert.equal(campaignActionsDisabled({ campaignId: "one", generationStatus: "COMPLETED" }), false);
});

test("shows human-readable queued generation and terminal statuses", () => {
  assert.equal(campaignStatusLabel({ regenerationStatus: "QUEUED" }), "Queued");
  assert.equal(campaignStatusLabel({ regenerationStatus: "PROCESSING" }), "Generating");
  assert.equal(campaignStatusLabel({ regenerationStatus: "RETRY_SCHEDULED" }), "Retry Scheduled");
  assert.equal(campaignStatusLabel({ regenerationStatus: "WAITING_FOR_RENDER" }), "Rendering");
  assert.equal(campaignStatusLabel({ regenerationStatus: "READY_FOR_APPROVAL" }), "Ready for Approval");
  assert.equal(campaignStatusLabel({ generationStatus: "COMPLETED" }), "Ready for Approval");
  assert.equal(campaignStatusLabel({ regenerationStatus: "TIMED_OUT" }), "Timed Out");
  assert.equal(campaignStatusLabel({ regenerationStatus: "DEAD_LETTERED" }), "Needs Attention");
  assert.equal(campaignStatusIsFailure({ regenerationStatus: "FAILED" }), true);
  assert.equal(campaignStatusIsFailure({ regenerationStatus: "TIMED_OUT" }), true);
  assert.equal(campaignStatusIsFailure({ generationStatus: "COMPLETED" }), false);
});

test("shows safe actionable generation failure messages", () => {
  assert.equal(campaignFailureMessage({
    regenerationStatus: "RETRY_SCHEDULED",
    regenerationFailure: { code: "OPENAI_RATE_LIMITED", stage: "generation" },
  }), "OpenAI temporarily limited requests. The campaign will retry automatically.");
  assert.equal(campaignFailureMessage({
    regenerationStatus: "DEAD_LETTERED",
    regenerationFailure: { code: "APP_FEATURE_COPY_VALIDATION_FAILED", stage: "generation" },
  }), "The generated wording did not pass RTC copy checks.");
});

test("approval requires a completed usable video and no active or failed job", () => {
  assert.equal(campaignCanApprove({ generationStatus: "COMPLETED", videoUrl: "https://video.example/ad.mp4" }), true);
  assert.equal(campaignCanApprove({ generationStatus: "COMPLETED", videoUrl: null }), false);
  assert.equal(campaignCanApprove({ generationStatus: "COMPLETED", videoUrl: "https://video.example/ad.mp4", regenerationStatus: "QUEUED" }), false);
  assert.equal(campaignCanApprove({ generationStatus: "COMPLETED", videoUrl: "https://video.example/ad.mp4", regenerationStatus: "FAILED" }), false);
});

test("eligible vendor checkbox selection is deduplicated and removable", () => {
  let selected = toggleVendorSelection([], "vendor-1", true);
  selected = toggleVendorSelection(selected, "vendor-1", true);
  selected = toggleVendorSelection(selected, "vendor-2", true);
  assert.deepEqual(selected, ["vendor-1", "vendor-2"]);
  assert.deepEqual(toggleVendorSelection(selected, "vendor-1", false), ["vendor-2"]);
});
