import {
  MutableSnapshot,
  RecoilRoot,
  snapshot_UNSTABLE as getSnapshot,
} from "recoil";
import { act, renderHook } from "@testing-library/react-hooks";
// import { act } from "@testing-library/react";
import React from "react";
import {
  Activity,
  allActivities,
  apiMyActivies,
  apiState,
  CreateActivityProps,
  myActivityIds,
  SyncStatus,
  useMyActivities,
  UseMyActivitiesResult,
} from "./myActivities";
import { Api, ApiPromise, apiPromiseSuccess } from "../api/base";
import { nullApi } from "../api/nullApi";
import { ApiActivity, Frequency } from "../api/responseTypes";

const { NEW, SYNCED } = SyncStatus;

describe("useMyActivitities", () => {
  let api: Api = { ...nullApi };
  const activityProps: CreateActivityProps = {
    name: "LOLOLOL",
    frequency: Frequency.DAILY,
  };

  function makeHookRenderer(
    stateFactory?: (s: MutableSnapshot) => void
  ): () => Promise<UseMyActivitiesResult> {
    return async () => {
      let res: UseMyActivitiesResult | undefined;

      await act(async () => {
        const { result } = renderHook(useMyActivities, {
          wrapper: ({ children }) => (
            <RecoilRoot initializeState={stateFactory}>{children}</RecoilRoot>
          ),
        });

        await new Promise((res) => setImmediate(res));
        expect(result.error).toBeUndefined();
        res = result.current;
      });

      if (!res) throw new Error("Did not set hook result");
      return res;
    };
  }

  describe("When the api Has not yet responded with activities", () => {
    let stateFactory: (s: MutableSnapshot) => void | undefined;
    beforeEach(() => {
      api = {
        ...nullApi,
        myActivities(): ApiPromise<ApiActivity[]> {
          return new Promise((_) => {
            // pending
          });
        },
      };
      stateFactory = (s) => s.set(apiState, api);
    });

    it("Adds Activities to a list", async () => {
      const getState = makeHookRenderer(stateFactory);
      let [activities, createActivity] = await getState();
      expect(activities.length).toEqual(0);

      act(() => createActivity({ ...activityProps, name: "first" }));
      [activities, createActivity] = await getState();
      expect(activities).toHaveLength(1);

      act(() => createActivity({ ...activityProps, name: "second" }));
      [activities] = await getState();
      expect(activities).toHaveLength(2);
    });
  });
});
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
          s.asyncMap((s2) => {
            s2.retain();
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
