import { atom } from "recoil";
import { recoilPersist } from "recoil-persist";

const { persistAtom } = recoilPersist();

export type Activity = { name: string };

export const activityState = atom<Activity[]>({
  key: "activities",
  default: [],
  effects_UNSTABLE: [persistAtom],
});
