import { v4 } from "uuid";
import { OauthApi } from "./oauthApi";
import { ERROR } from "./base";
import { Frequency } from "./responseTypes";
import { Activity, SyncStatus } from "../state/activity";

describe("API INTEGRATOIN", () => {
  const oauthToken = "9A-F4Jxp86jEpX2jpkorcKR4Iks597sb1pLiA9gr8T0";
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
