import assert from "node:assert/strict";
import test from "node:test";

import {
  approveCampaignState,
  campaignTypeLabel,
  campaignActionsDisabled,
  campaignApprovalEndpoints,
  initialCampaignApprovalUiState,
  emptyCampaignMessage,
  preserveUsableRendition,
  reasonLabel,
  reduceCampaignApprovalUi,
  replaceCampaign,
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
  assert.equal(campaignApprovalEndpoints.details("campaign one"), "/api/v1/marketing/campaigns/campaign%20one");
  assert.equal(campaignApprovalEndpoints.approve("one"), "/api/v1/marketing/campaigns/one/approve");
  assert.equal(campaignApprovalEndpoints.regenerate("one"), "/api/v1/marketing/campaigns/one/regenerate");
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

test("regeneration replaces the same row and keeps the usable rendition on failure", () => {
  const current = { campaignId: "one", videoUrl: "https://video.example/keeper.mp4", regenerationCount: 1 };
  const processing = { campaignId: "one", generationStatus: "PROCESSING", regenerationCount: 2 };
  const rows = replaceCampaign([current], preserveUsableRendition(current, processing));
  assert.equal(rows.length, 1);
  assert.equal(rows[0].videoUrl, current.videoUrl);
  const failed = preserveUsableRendition(rows[0], { campaignId: "one", generationStatus: "FAILED", videoUrl: null });
  assert.equal(failed.videoUrl, current.videoUrl);
});

test("processing and in-flight actions disable regeneration and approval", () => {
  assert.equal(campaignActionsDisabled({ campaignId: "one", generationStatus: "PROCESSING" }), true);
  assert.equal(campaignActionsDisabled({ campaignId: "one", generationStatus: "COMPLETED" }, "one"), true);
  assert.equal(campaignActionsDisabled({ campaignId: "one", generationStatus: "COMPLETED" }), false);
});
