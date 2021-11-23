import { useRecoilValueLoadable } from "recoil";
import { recoilHookRenderContext } from "recoil-test-render-hooks";
import { apiMyActivities } from "./api";
import { ApiActivity, Frequency } from "../api/responseTypes";
import { Api, ApiPromise, apiPromiseSuccess } from "../api/base";
import { nullApi } from "../api/nullApi";
import { apiState } from "./oauthState";

describe("apiMyActivities", () => {
  const pikachu: ApiActivity = {
    frequency: Frequency.DAILY,
    uuid: "lolol-pika",
    name: "pikachu",
    id: 2,
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
