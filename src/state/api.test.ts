import { useRecoilValueLoadable } from "recoil";
import { recoilHookRenderContext } from "recoil-test-render-hooks";
import { apiMyActivities, apiState } from "./api";
import { ApiActivity, Frequency } from "../api/responseTypes";
import { Api, ApiPromise, apiPromiseSuccess } from "../api/base";
import { nullApi } from "../api/nullApi";
import { Activity, SyncStatus } from "./activity";

describe("apiMyActivities", () => {
  const pikachu: Activity = {
    frequency: Frequency.DAILY,
    uuid: "lolol-pika",
    name: "pikachu",
    status: SyncStatus.NEW,
  };

  describe("With remote activities", () => {
    const mudkips: ApiActivity = {
      ...pikachu,
      uuid: "ALLO-ilurvmudkips",
      name: "Mudkips",
    };

    const api: Api = {
      ...nullApi,
      myActivities(): ApiPromise<ApiActivity[]> {
        return apiPromiseSuccess([mudkips]);
      },
    };

    it("has the api response", async () => {
      const { getCurrentValue } = recoilHookRenderContext((s) =>
        s.set(apiState, api)
      );
      const loadable = await getCurrentValue(() =>
        useRecoilValueLoadable(apiMyActivities)
      );
      const activities = await loadable.toPromise();

      expect(activities.length).toEqual(1);
      expect(activities[0]?.name).toEqual("Mudkips");
    });
  });
});
