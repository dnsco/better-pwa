import { v4 } from "uuid";
import { OauthApi } from "./oauthApi";
import { ERROR } from "./base";
import { Activity, SyncStatus } from "../state/myActivities";
import { Frequency } from "./responseTypes";

describe.skip("API INTEGRATOIN", () => {
  const oauthToken = "PVL2EGwJgYjwiWndR4SCfBTDUBsc0iGfuwlpV5D3G78";
  const api = new OauthApi(oauthToken);

  it("Fetches my activities", async () => {
    const activitiesResp = await api.myActivities();

    if (activitiesResp.kind === ERROR) {
      throw activitiesResp.error;
    }

    const activities = activitiesResp.data;

    expect(activities.length).toBeGreaterThan(0);
  });

  it("can create shit", async () => {
    const a: Activity = {
      frequency: Frequency.DAILY,
      status: SyncStatus.NEW,
      uuid: v4(),
      name: "Palestine",
    };

    const createResponse = await api.createActivity(a);

    if (createResponse.kind === ERROR) {
      throw createResponse.error;
    }
    expect(createResponse.data.name).toEqual("Palestine");
  });
});
