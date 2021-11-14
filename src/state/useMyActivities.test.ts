import { act, addCleanup } from "@testing-library/react-hooks";
import { recoilHookRenderContext } from "recoil-test-render-hooks";
import { v4 } from "uuid";
import { useMyActivities } from "./useMyActivities";
import { Api, ApiPromise, apiPromiseSuccess } from "../api/base";
import { nullApi } from "../api/nullApi";
import { ApiActivity, Frequency } from "../api/responseTypes";
import { apiState } from "./api";
import { Activity, CreateActivityProps, SyncStatus } from "./activity";

const { NEW, SYNCED } = SyncStatus;

describe("useMyActivitities", () => {
  let api: Api = { ...nullApi };
  const activityProps: CreateActivityProps = {
    name: "LOLOLOL",
    frequency: Frequency.DAILY,
  };
  beforeEach(() => {
    addCleanup(() => localStorage.clear());
  });

  describe("When the api Has not yet responded with activities", () => {
    beforeEach(() => {
      api = {
        ...nullApi,
        myActivities(): ApiPromise<ApiActivity[]> {
          return new Promise((_) => {
            // pending
          });
        },
      };
    });

    it("Adds Activities to a list", async () => {
      const { getCurrentValue } = recoilHookRenderContext((s) => {
        s.set(apiState, api);
      });

      let [activities, createActivity] = await getCurrentValue(useMyActivities);
      expect(activities.length).toEqual(0);

      await act(async () => {
        createActivity({ ...activityProps, name: "first" });
        await new Promise(setImmediate);
      });

      [activities, createActivity] = await getCurrentValue(useMyActivities);
      expect(activities).toHaveLength(1);

      act(() => createActivity({ ...activityProps, name: "second" }));
      [activities] = await getCurrentValue(useMyActivities);
      expect(activities).toHaveLength(2);
    });

    it("has a clean slate", async () => {
      const { getCurrentValue } = recoilHookRenderContext((s) => {
        s.set(apiState, api);
      });
      const [activities] = await getCurrentValue(useMyActivities);
      expect(activities).toHaveLength(0);
    });

    xdescribe("remote activity creation", () => {
      // const onCreate = jest.fn();
      // const api: Api = {
      //   ...nullApi,
      //   createActivity(a: Activity): ApiPromise<ApiActivity> {
      //     return apiPromiseSuccess(a).then((r) => {
      //       onCreate();
      //       return r;
      //     });
      //   },
      // };

      xit("sets the status to synced", (done) => {
        // while (onCreate.mock.calls.length === 0) {
        //   // sleep until thing is done
        // }
        // onCreate.
        const promise: Promise<Activity[]> = Promise.resolve([]);
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

    describe("when the api has responded with activities", () => {
      beforeEach(() => {
        api = {
          ...nullApi,
          myActivities(): ApiPromise<ApiActivity[]> {
            return apiPromiseSuccess([
              {
                frequency: Frequency.DAILY,
                uuid: v4(),
                name: "Mudkips",
              },
            ]);
          },
        };
      });

      it("merges local and api activities", async () => {
        const { getCurrentValue } = recoilHookRenderContext((s) =>
          s.set(apiState, api)
        );
        const [_, create] = await getCurrentValue(useMyActivities);

        await act(async () => {
          create({ frequency: Frequency.DAILY, name: "pikachu" });
        });

        const [activities] = await getCurrentValue(useMyActivities);
        expect(activities).toHaveLength(2);

        const [local, synced] = activities as [Activity, Activity];
        expect(local.name).toEqual("pikachu");
        expect(local.status).toEqual(NEW);
        expect(synced.name).toEqual("Mudkips");
        expect(synced.status).toEqual(SYNCED);
      });
    });
  });
});
