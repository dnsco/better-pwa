import { snapshot_UNSTABLE as getSnapshot } from "recoil";
import {
  Activity,
  Api,
  apiMyActivies,
  apiState,
  localMyActivities,
  mergedActivities,
} from "./myActivities";

const api: Api = {
  myActivities(): Promise<Activity[]> {
    return Promise.resolve([{ name: "Mudkips" }]);
  },
};

describe("myActivityState", () => {
  test("It grabs the activities from the api", async () => {
    const state = getSnapshot().map((s) => {
      s.set(apiState, api);
      s.set(localMyActivities, [{ name: "pikachu" }]);
      return s;
    });

    const localPikachu = state
      .getLoadable(localMyActivities)
      .valueOrThrow()
      .find((a) => a.name === "pikachu");

    expect(localPikachu).toBeTruthy();

    const allActivities = await state
      .getLoadable(mergedActivities)
      .promiseOrThrow();
    expect(allActivities.map((a) => a.name)).toEqual(["pikachu", "Mudkips"]);

    const activities = await state.getLoadable(apiMyActivies).toPromise();
    expect(activities[0]?.name).toEqual("Mudkips");
  });
});
