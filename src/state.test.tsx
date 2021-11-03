import { snapshot_UNSTABLE as getSnapshot } from "recoil";
import { myActivityState } from "./state";

describe("syncing activities from the server", () => {
  test("It grabs the activities", async () => {
    const state = getSnapshot();
    const activities = await state
      .getLoadable(myActivityState)
      .promiseOrThrow();
    expect(activities[0]?.name).toEqual("Mudkips");
  });
});
