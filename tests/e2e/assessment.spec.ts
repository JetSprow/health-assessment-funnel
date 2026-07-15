import { expect, test } from "@playwright/test";

test("restores progress and preserves full access after mock payment", async ({ page }) => {
  const browserErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  page.on("pageerror", (error) => browserErrors.push(error.message));

  await page.goto("/");
  await page.getByRole("link", { name: "开始测评" }).click();
  await page.waitForLoadState("networkidle");
  const sessionCreated = page.waitForResponse(
    (response) => response.url().endsWith("/api/sessions") && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "开始我的测评" }).click();
  await sessionCreated;
  await expect(page).toHaveURL(/\/assessment\/[0-9a-f-]+$/);

  await expect(page.getByText("你的生理性别是？")).toBeVisible();
  await page.getByRole("button", { name: /女性/ }).click();
  await page.getByRole("button", { name: /保存并继续/ }).click();

  await expect(page.getByText("这次最想实现什么？")).toBeVisible();
  await page.getByRole("button", { name: /健康减重/ }).click();
  await page.getByRole("button", { name: /保存并继续/ }).click();

  await expect(page.getByText("你今年多大？")).toBeVisible();
  await page.getByRole("spinbutton").fill("30");
  await page.getByRole("button", { name: /保存并继续/ }).click();
  await expect(page.getByText("你的身高是多少？")).toBeVisible();

  await page.reload();
  await expect(page.getByText("你的身高是多少？")).toBeVisible();
  await expect(page.getByText("已恢复上次保存的进度")).toBeVisible();

  await page.getByRole("spinbutton").fill("165");
  await page.getByRole("button", { name: /保存并继续/ }).click();
  await expect(page.getByText("你现在的体重是？")).toBeVisible();

  await page.getByRole("spinbutton").fill("70");
  await page.getByRole("button", { name: /保存并继续/ }).click();
  await expect(page.getByText("你的目标体重是？")).toBeVisible();

  await page.getByRole("spinbutton").fill("60");
  await page.getByRole("button", { name: /保存并继续/ }).click();
  await expect(page.getByText("你平时的活动水平？")).toBeVisible();

  await page.getByRole("button", { name: /中度活动/ }).click();
  await page.getByRole("button", { name: /生成我的报告/ }).click();
  await expect(page).toHaveURL(/\/result$/);

  await expect(page.getByText("基础报告", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /模拟支付并解锁/ })).toBeVisible();
  await page.getByRole("button", { name: /模拟支付并解锁/ }).click();

  await expect(page.getByText("逐周体重趋势")).toBeVisible();
  await expect(page.getByText("会员报告 · 已解锁")).toBeVisible();
  await page.reload();
  await expect(page.getByText("逐周体重趋势")).toBeVisible();
  await expect(page.getByText("会员报告 · 已解锁")).toBeVisible();
  expect(browserErrors).toEqual([]);
});

test("real PostgreSQL API handles replay, out-of-order saves, recovery and concurrent versions", async ({ request }) => {
  const created = await request.post("/api/sessions");
  expect(created.status()).toBe(201);
  const createdBody = await created.json();
  const sessionId = createdBody.data.sessionId as string;

  const saveStep = (
    stepKey: string,
    requestId: string,
    version: number,
    data: Record<string, unknown>,
  ) =>
    request.patch(`/api/sessions/${sessionId}/steps/${stepKey}`, {
      data: { requestId, version, data },
    });

  const outOfOrder = await saveStep(
    "activity",
    "e2e-activity-replay-001",
    0,
    { activityLevel: "ACTIVE" },
  );
  expect(outOfOrder.status()).toBe(200);
  expect((await outOfOrder.json()).data).toMatchObject({
    currentStep: 7,
    version: 1,
    duplicated: false,
  });

  const replay = await saveStep(
    "activity",
    "e2e-activity-replay-001",
    0,
    { activityLevel: "ACTIVE" },
  );
  expect(replay.status()).toBe(200);
  expect((await replay.json()).data).toMatchObject({
    version: 1,
    duplicated: true,
  });

  const conflictingReplay = await saveStep(
    "activity",
    "e2e-activity-replay-001",
    1,
    { activityLevel: "LIGHT" },
  );
  expect(conflictingReplay.status()).toBe(409);
  expect((await conflictingReplay.json()).error.code).toBe(
    "IDEMPOTENCY_CONFLICT",
  );

  const concurrentResponses = await Promise.all([
    saveStep("gender", "e2e-concurrent-gender-001", 1, {
      gender: "FEMALE",
    }),
    saveStep("goal", "e2e-concurrent-goal-001", 1, {
      goal: "LOSE_WEIGHT",
    }),
  ]);
  expect(concurrentResponses.map((response) => response.status()).sort()).toEqual([
    200,
    409,
  ]);

  const recovered = await request.get(
    `/api/sessions/${sessionId}/progress`,
  );
  expect(recovered.status()).toBe(200);
  const recoveredBody = await recovered.json();
  expect(recoveredBody.data).toMatchObject({
    currentStep: 7,
    version: 2,
    profile: { activityLevel: "ACTIVE" },
  });
  expect(
    [recoveredBody.data.profile.gender, recoveredBody.data.profile.goal].filter(
      Boolean,
    ),
  ).toHaveLength(1);
});
