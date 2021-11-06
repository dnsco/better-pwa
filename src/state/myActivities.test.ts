import { MutableSnapshot, snapshot_UNSTABLE as getSnapshot } from "recoil";
import {
  Activity,
  allActivities,
  apiMyActivies,
  apiState,
  myActivityIds,
  SyncStatus,
} from "./myActivities";
import { Api, ApiPromise, apiPromiseSuccess } from "../api/base";
import { nullApi } from "../api/nullApi";
import { ApiActivity, Frequency } from "../api/responseTypes";

const { NEW, SYNCED } = SyncStatus;

describe("My Activity State", () => {
  const pikachu: Activity = {
    frequency: Frequency.DAILY,
    uuid: "lolol-pika",
    name: "pikachu",
    status: NEW,
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

    const makeSnapshot = () =>
      getSnapshot()
        .asyncMap((s) => {
          s.set(apiState, api);
          s.set(allActivities, [pikachu]);
          s.retain();
          return new Promise((resolve) => setTimeout(resolve, 100));
        })
        .then((s) =>
          s.asyncMap((s) => {
            s.retain();
            return new Promise((resolve) => setTimeout(resolve, 100));
          })
        );

    describe("apiMyActivities", () => {
      it("has the api response", async () => {
        const snapshot = await makeSnapshot();
        const apiActivities = await snapshot
          .getLoadable(apiMyActivies)
          .toPromise();
        expect(apiActivities.length).toEqual(1);
        expect(apiActivities[0]?.name).toEqual("Mudkips");
      });
    });

    describe("myActivityIds", () => {
      it("Has both ids", async () => {
        const snapshot = await makeSnapshot();

        const activityIds = snapshot.getLoadable(myActivityIds).valueOrThrow();
        expect(activityIds).toContain(pikachu.uuid);
        expect(activityIds).toContain(mudkips.uuid);
      });
    });

    describe("allActivities", () => {
      it("merges local and api activities", async () => {
        const snapshot = await makeSnapshot();

        const activities = snapshot
          .getLoadable(allActivities)
          .getValue()
          .map((a) => [a.name, a.status]);

        expect(activities[0]).toEqual(["Mudkips", SYNCED]);
        expect(activities[1]).toEqual(["pikachu", NEW]);
      });
    });
  });

  describe("creating an activity", () => {
    const localPikachu = getSnapshot()
      .map((s: MutableSnapshot) => s.set(allActivities, [pikachu]))
      .getLoadable(allActivities)
      .valueOrThrow()
      .find((a) => a.name === "pikachu");

    it("has locally created things", () => {
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
        s.set(allActivities, [pikachu]);
        return s;
      });

      xit("sets the status to synced", (done) => {
        // while (onCreate.mock.calls.length === 0) {
        //   // sleep until thing is done
        // }
        // onCreate.
        const promise = state.getLoadable(allActivities).toPromise();

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
});
