import { act, addCleanup } from "@testing-library/react-hooks";
import {
  recoilHookRenderContext,
  RecoilHookRenderer,
} from "recoil-test-render-hooks";
import { v4 } from "uuid";
import { useMergedActivities } from "../useMergedActivities";
import {
  Api,
  ApiPromise,
  apiPromiseSuccess,
  ERROR,
  ErrorResponse,
} from "../../../api/base";
import { nullApi } from "../../../api/nullApi";
import { ApiActivity, Frequency } from "../../../api/responseTypes";
import { Activity, SyncStatus } from "../../myActivities";
import { apiState } from "../../oauthState";
import { CreateActivityProps, useActivityFactory } from "../useActivityFactory";

const { NEW, SYNCED } = SyncStatus;

describe("useMyActivities", () => {
  function contextWithApi(api: Api): RecoilHookRenderer {
    return recoilHookRenderContext((s) => s.set(apiState, api));
  }

  const apiWithActivities: Api = {
    ...nullApi,
    myActivities(): ApiPromise<ApiActivity[]> {
      return apiPromiseSuccess([apiMudkips]);
    },
  };

  const apiMudkips: ApiActivity = {
    frequency: Frequency.DAILY,
    uuid: v4(),
    name: "Mudkips",
    id: 19,
  };

  const activityProps: CreateActivityProps = {
    name: "LOLOLOL",
    frequency: Frequency.DAILY,
  };

  beforeEach(() => {
    addCleanup(() => localStorage.clear());
  });

  describe("When the api Has not yet responded with activities", () => {
    const makeTestContext = (): RecoilHookRenderer =>
      contextWithApi({
        ...nullApi,
        myActivities(): ApiPromise<ApiActivity[]> {
          return new Promise((_) => {
            // pending
          });
        },
      });

    it("Adds Activities to a list", async () => {
      const { getCurrentValue } = makeTestContext();
      let activities = await getCurrentValue(useMergedActivities);
      const createActivity = await getCurrentValue(useActivityFactory);
      expect(activities.length).toEqual(0);

      await act(async () => {
        createActivity({ ...activityProps, name: "first" });
        await new Promise(setImmediate);
      });

      activities = await getCurrentValue(useMergedActivities);

      expect(activities).toHaveLength(1);

      act(() => createActivity({ ...activityProps, name: "second" }));
      activities = await getCurrentValue(useMergedActivities);
      expect(activities).toHaveLength(2);
    });

    it("has a clean slate", async () => {
      const { getCurrentValue } = makeTestContext();
      const activities = await getCurrentValue(useMergedActivities);
      expect(activities).toHaveLength(0);
    });
  });

  describe("when the api has responded with activities", () => {
    const setupTestContext = async (): Promise<RecoilHookRenderer> => {
      const renderer = contextWithApi(apiWithActivities);

      const { getCurrentValue } = renderer;
      const create = await getCurrentValue(useActivityFactory);

      await act(async () => {
        create({ frequency: Frequency.DAILY, name: "pikachu" });
      });

      return renderer;
    };

    it("is a collection of local and remote activiites", async () => {
      const { getCurrentValue } = await setupTestContext();
      const activities = await getCurrentValue(useMergedActivities);
      expect(activities).toHaveLength(2);
      expect(activityNamed("pikachu", activities).status).toEqual(NEW);
      expect(activityNamed("Mudkips", activities).status).toEqual(SYNCED);
    });

    it("perists the merged versions to local storage", async () => {
      const { getCurrentValue } = await setupTestContext();
      const activities = await getCurrentValue(useMergedActivities);

      const pikachu = activityFromLocalStorage("pikachu", activities);
      expect(pikachu.name).toEqual("pikachu");
      expect(pikachu.status).toEqual(NEW);

      const synced = activityFromLocalStorage("Mudkips", activities);
      expect(synced.name).toEqual("Mudkips");
      expect(synced.status).toEqual(SYNCED);
    });
  });

  describe("remote activity creation", () => {
    describe("successful sync", () => {
      const makeTestContext = (): RecoilHookRenderer =>
        contextWithApi({
          ...nullApi,
          createActivity(a: Activity): ApiPromise<ApiActivity> {
            return apiPromiseSuccess(a as ApiActivity);
          },
        });

      it("syncs with the API", async () => {
        // waitFor(() => onCreate.mock.calls.length > 1);
        const { getCurrentValue } = makeTestContext();
        const create = await getCurrentValue(useActivityFactory);
        act(() => create({ frequency: Frequency.DAILY, name: "love" }));
        const activities = await getCurrentValue(useMergedActivities);
        const love = activityFromLocalStorage("love", activities);
        expect(love?.status).toEqual(SYNCED);
      });
    });

    describe("erroneous states", () => {
      const BACKEND_ERROR = new Error("Fake backend error lol");

      const makeErrorOnCreateContext = (): [RecoilHookRenderer, Api] => {
        const errorsOnCreateApi: Api = {
          ...apiWithActivities,

          myActivities: jest.fn(apiWithActivities.myActivities),

          createActivity: jest.fn(async (): Promise<ErrorResponse> => {
            return {
              kind: ERROR,
              error: BACKEND_ERROR,
            };
          }),
        };

        return [contextWithApi(errorsOnCreateApi), errorsOnCreateApi];
      };

      describe("when it has synced remote activities", () => {
        it("does not try to recreate the activities", async () => {
          const [{ getCurrentValue }, api] = makeErrorOnCreateContext();
          const activities = await getCurrentValue(useMergedActivities);
          expect((api.myActivities as jest.Mock).mock.calls.length).toEqual(1);
          expect((api.createActivity as jest.Mock).mock.calls.length).toEqual(
            0
          );

          expect(activities.length).toEqual(1);
        });
      });

      describe("when the api returns an error", () => {
        it("logs the error", async () => {
          jest.spyOn(console, "error").mockImplementation(() => {
            // noop
          });
          const [{ getCurrentValue }] = makeErrorOnCreateContext();
          const create = await getCurrentValue(useActivityFactory);

          await act(async () => {
            await create({ frequency: Frequency.DAILY, name: "lolol" });
            await new Promise((r) => setImmediate(r));
          });

          // eslint-disable-next-line no-console
          expect(console.error).toHaveBeenCalledWith(BACKEND_ERROR);
        });
      });
    });
  });
});

const activityFromLocalStorage = (
  name: string,
  activities: Activity[],
  localStorageKey = "recoil-my-activities"
): Activity => {
  const activity = activityNamed(name, activities);
  const localStorageString = localStorage.getItem(localStorageKey) ?? "{}";
  const storageMap = JSON.parse(localStorageString);

  const fromStorage: Activity | undefined =
    storageMap[`myActivities__"${activity.uuid}"`];

  if (!fromStorage)
    throw new Error(
      `Not found in local Storage– Activity: ${JSON.stringify(activity)}`
    );

  return fromStorage;
};

function activityNamed(name: string, activities: Activity[]): Activity {
  const filtered = activities.filter((a) => a.name === name);

  if (filtered.length !== 1) {
    const s = JSON.stringify(activities);
    throw new Error(
      `There is not exactly one activity named "${name}" in ${s}`
    );
  }

  return (filtered as [Activity])[0];
}
