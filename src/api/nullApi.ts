import {
  Api,
  ApiActivity,
  ApiActivityCompletion,
  ApiPromise,
  NOOP,
} from "./base";
import { Activity } from "../state/myActivities";

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
