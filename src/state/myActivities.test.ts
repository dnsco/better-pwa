import { snapshot_UNSTABLE as getSnapshot } from "recoil";
import {
  Activity,
  apiMyActivies,
  apiState,
  localMyActivities,
  mergedActivities,
  SyncStatus,
} from "./myActivities";
import { Api, ApiPromise, apiPromiseSuccess } from "../api/base";
import { nullApi } from "../api/nullApi";
import { ApiActivity, Frequency } from "../api/responseTypes";

const { NEW, SYNCED } = SyncStatus;

describe("My Activity State", () => {
  const pikachu: Activity = {
    frequency: Frequency.DAILY,
    uuid: "lolol",
    name: "pikachu",
    status: NEW,
  };

  const newPikachuSnapshot = getSnapshot().map((s) =>
    s.set(localMyActivities, [pikachu])
  );

  describe("localActivityState", () => {
    const localPikachu = newPikachuSnapshot
      .getLoadable(localMyActivities)
      .valueOrThrow()
      .find((a) => a.name === "pikachu");

    it("has a newPikachu", () => {
      expect(localPikachu?.status).toEqual(NEW);
    });

    describe("creating it remotely", () => {
      const onCreate = jest.fn();
      const api: Api = {
        ...nullApi,
        createActivity(a: Activity): ApiPromise<ApiActivity> {
          return apiPromiseSuccess(a).then((r) => {
            onCreate();
            return r;
          });
        },
      };

      const state = getSnapshot().map((s) => {
        s.set(apiState, api);
        s.set(localMyActivities, [pikachu]);
        return s;
      });

      xit("sets the status to synced", (done) => {
        // while (onCreate.mock.calls.length === 0) {
        //   // sleep until thing is done
        // }
        // onCreate.
        const promise = state.getLoadable(localMyActivities).toPromise();

        promise
          .then((activities) => {
            const activity = activities[0];
            // eslint-disable-next-line jest/no-conditional-expect
            expect(activity?.name).toEqual("pikachu");
            // eslint-disable-next-line jest/no-conditional-expect
            expect(activity?.status).toEqual(SYNCED);
            done();
          })
          // eslint-disable-next-line no-console
          .catch((e) => console.error(e));
      });
    });
  });

  describe("With remote activities", () => {
    const mudkips: ApiActivity = {
      ...pikachu,
      uuid: "ALLO",
      name: "Mudkips",
    };

    const api: Api = {
      ...nullApi,
      myActivities(): ApiPromise<ApiActivity[]> {
        return apiPromiseSuccess([mudkips]);
      },
    };

    const state = newPikachuSnapshot.map((s) => s.set(apiState, api));

    describe("apiActivities", () => {
      it("returns the api's activities", async () => {
        const activities = await state.getLoadable(apiMyActivies).toPromise();
        expect(activities[0]?.name).toEqual("Mudkips");
      });
    });

    describe("mergedActivities", () => {
      it("merges local and new activities", async () => {
        const allActivities = await state
          .getLoadable(mergedActivities)
          .promiseOrThrow();

        expect(allActivities.map((a) => [a.name, a.status])).toEqual([
          ["pikachu", NEW],
          ["Mudkips", SYNCED],
        ]);
      });
    });
  });
});
