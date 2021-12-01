import { Api, ApiPromise } from "./base";
import { ApiActivity } from "./responseTypes";
import { Activity } from "../state/myActivities";

const NOOP = () => {}; // eslint-disable-line @typescript-eslint/no-empty-function

export const nullApi: Api = {
  myActivities(): ApiPromise<ApiActivity[]> {
    return new Promise(NOOP);
  },

  createActivity(_: Activity): ApiPromise<ApiActivity> {
    return new Promise(NOOP);
  },
};
