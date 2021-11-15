import { act, addCleanup } from "@testing-library/react-hooks";
import {
  recoilHookRenderContext,
  RecoilHookRenderer,
} from "recoil-test-render-hooks";
import { v4 } from "uuid";
import { useMyActivities } from "./useMyActivities";
import { Api, ApiPromise, apiPromiseSuccess } from "../api/base";
import { nullApi } from "../api/nullApi";
import { ApiActivity, Frequency } from "../api/responseTypes";
import { apiState } from "./api";
import { Activity, CreateActivityProps, SyncStatus } from "./activity";

const { NEW, SYNCED } = SyncStatus;

function contextWithApi(api: Api): RecoilHookRenderer {
  return recoilHookRenderContext((s) => s.set(apiState, api));
}

describe("useMyActivities", () => {
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
      const { getCurrentValue } = makeTestContext();
      const [activities] = await getCurrentValue(useMyActivities);
      expect(activities).toHaveLength(0);
    });
  });

  describe("remote activity creation", () => {
    const makeTestContext = (): RecoilHookRenderer =>
      contextWithApi({
        ...nullApi,
        createActivity(a: Activity): ApiPromise<ApiActivity> {
          return apiPromiseSuccess(a);
        },
      });

    it("syncs with the API", async () => {
      // waitFor(() => onCreate.mock.calls.length > 1);
      const { getCurrentValue } = makeTestContext();
      const [_, create] = await getCurrentValue(useMyActivities);
      act(() => create({ frequency: Frequency.DAILY, name: "love" }));
      const [activities] = await getCurrentValue(useMyActivities);
      const love = activityFromLocalStorage("love", activities);
      expect(love?.status).toEqual(SYNCED);
    });
  });

  describe("when the api has responded with activities", () => {
    const setupTestContext = async (): Promise<RecoilHookRenderer> => {
      const renderer = contextWithApi({
        ...nullApi,
        myActivities(): ApiPromise<ApiActivity[]> {
          return apiPromiseSuccess([apiMudkips]);
        },
      });

      const { getCurrentValue } = renderer;
      const [_, create] = await getCurrentValue(useMyActivities);

      await act(async () => {
        create({ frequency: Frequency.DAILY, name: "pikachu" });
      });

      return renderer;
    };

    const apiMudkips: ApiActivity = {
      frequency: Frequency.DAILY,
      uuid: v4(),
      name: "Mudkips",
    };

    it("is a collection of local and remote activiites", async () => {
      const { getCurrentValue } = await setupTestContext();
      const [activities] = await getCurrentValue(useMyActivities);
      expect(activities).toHaveLength(2);
      expect(activityNamed("pikachu", activities).status).toEqual(NEW);
      expect(activityNamed("Mudkips", activities).status).toEqual(SYNCED);
    });

    it("perists the merged versions to local storage", async () => {
      const { getCurrentValue } = await setupTestContext();
      const [activities] = await getCurrentValue(useMyActivities);

      const pikachu = activityFromLocalStorage("pikachu", activities);
      expect(pikachu.name).toEqual("pikachu");
      expect(pikachu.status).toEqual(NEW);

      const synced = activityFromLocalStorage("Mudkips", activities);
      expect(synced.name).toEqual("Mudkips");
      expect(synced.status).toEqual(SYNCED);
    });
  });

  const activityFromLocalStorage = (
    name: string,
    activities: Activity[]
  ): Activity => {
    const activity = activityNamed(name, activities);
    const storageMap = JSON.parse(
      localStorage.getItem("recoil-persist") || "{}"
    );

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
});
