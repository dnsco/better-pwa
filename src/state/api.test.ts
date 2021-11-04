import { ERROR, OauthApi } from "./api";

describe("API INTEGRATOIN", () => {
  const oauthToken = "PVL2EGwJgYjwiWndR4SCfBTDUBsc0iGfuwlpV5D3G78";

  it("Fetches my activities", async () => {
    const api = new OauthApi(oauthToken);

    const activitiesResp = await api.myActivities();

    if (activitiesResp.kind === ERROR) {
      throw activitiesResp.error;
    }

    const activities = activitiesResp.data;

    expect(activities.length).toBeGreaterThan(0);
  });
});
