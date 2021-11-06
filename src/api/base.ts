import { ApiActivity } from "./responseTypes";
import { Activity } from "../state/myActivities";

export interface Api {
  myActivities(): ApiPromise<ApiActivity[]>;
  createActivity(activity: Activity): ApiPromise<ApiActivity>;
}

export enum ResponseKind {
  SUCCESS = "success",
  ERROR = "error",
}

export const { SUCCESS, ERROR } = ResponseKind;

export type SuccessResponse<T> = { kind: typeof SUCCESS; data: T };
export type ErrorResponse = { kind: typeof ERROR; error: Error };

export type ApiPromise<T> = Promise<SuccessResponse<T> | ErrorResponse>;

export const successResponse = <T>(data: T): SuccessResponse<T> => ({
  kind: SUCCESS,
  data,
});

export function apiPromiseSuccess<T>(data: T): ApiPromise<T> {
  return Promise.resolve(successResponse(data));
}
