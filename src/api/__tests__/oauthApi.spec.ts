import { v4 } from "uuid";
import { OauthApi } from "../oauthApi";
import { ApiWrappedResponse, ERROR, Frequency } from "../base";
import { Activity, SyncStatus } from "../../state/myActivities";

function newActivity(props: Partial<Activity>): Activity {
  const uuid = v4();
  return {
    frequency: Frequency.DAILY,
    status: SyncStatus.NEW,
    uuid,
    name: `NewActivity${uuid}`,
    ...props,
  };
}

describe.skip("API INTEGRATION", () => {
  const oauthToken = "Nb2V_5Lk8RHbs0s9mIMp80LiNxDkuFUk4d2gkqQrcAg";
  const api = new OauthApi(oauthToken);

  describe("myActivities", () => {
    it("Fetches my activities", async () => {
      const activities = dataOrThrow(await api.myActivities());
      expect(activities.length).toBeGreaterThan(0);
    });

    it("can create shit", async () => {
      const name = "MadeInJSOauthTestLOL";
      const response = await api.createActivity(newActivity({ name }));

      const activity = dataOrThrow(response);
      expect(activity.name).toEqual(name);
    });
  });

  describe("activityCompletions", () => {
    it("has them or somethinglol", async () => {
      const createActivityResp = await api.createActivity(
        newActivity({ name: "HEYYY" })
      );

      const activityId = dataOrThrow(createActivityResp).uuid;

      const fetchCompletions = async () =>
        dataOrThrow(await api.activityCompletions({ activityId }));

      expect(await fetchCompletions()).toHaveLength(0);

      const doneAt = new Date();
      const uuid = v4();
      const createResponse = await api.completeActivity(activityId, {
        doneAt,
        uuid,
      });

      expect(dataOrThrow(createResponse).uuid).toEqual(uuid);
      expect(await fetchCompletions()).toHaveLength(1);
    });
  });

  function dataOrThrow<T>(response: ApiWrappedResponse<T>): T {
    if (response.kind === ERROR) throw response.error;
    return response.data;
  }
});
