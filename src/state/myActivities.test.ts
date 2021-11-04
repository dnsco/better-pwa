import { snapshot_UNSTABLE as getSnapshot } from "recoil";
import {
  apiMyActivies,
  apiState,
  localMyActivities,
  mergedActivities,
  SyncStatus,
} from "./myActivities";
import { Api, ApiActivity, ApiPromise, SUCCESS } from "./api";

const { NEW, SYNCED } = SyncStatus;

describe("My Activity State", () => {
  const pikachu = { name: "pikachu", status: NEW };

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
  });

  describe("With remote activities", () => {
    const api: Api = {
      myActivities(): ApiPromise<ApiActivity[]> {
        return Promise.resolve({
          kind: SUCCESS,
          data: [{ name: "Mudkips" }],
        });
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
