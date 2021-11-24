import { v4 } from "uuid";
import { OauthApi } from "./oauthApi";
import { ERROR } from "./base";
import { Frequency } from "./responseTypes";
import { Activity, SyncStatus } from "../state/activity";

describe("API INTEGRATOIN", () => {
  const oauthToken = "bEYzseGqyy7GXwEy6KEZpIqTew7NYA3kDzZaRVlA6wg";
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
