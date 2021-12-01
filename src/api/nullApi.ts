import { Api, ApiActivity, ApiActivityCompletion, ApiPromise } from "./base";
import { Activity } from "../state/myActivities";

const NOOP = () => {}; // eslint-disable-line @typescript-eslint/no-empty-function

export const nullApi: Api = {
  myActivities(): ApiPromise<ApiActivity[]> {
    return new Promise(NOOP);
  },

  createActivity(_: Activity): ApiPromise<ApiActivity> {
    return new Promise(NOOP);
  },

  activityCompletions(): ApiPromise<ApiActivityCompletion[]> {
    return new Promise(NOOP);
  },
};
