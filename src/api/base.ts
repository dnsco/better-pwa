import { Activity } from "../state/myActivities";

export const NOOP = () => {}; // eslint-disable-line @typescript-eslint/no-empty-function

export interface Api {
  myActivities(): ApiPromise<ApiActivity[]>;
  createActivity(activity: Activity): ApiPromise<ApiActivity>;

  activityCompletions(param: {
    activityId: UUID;
  }): ApiPromise<ApiActivityCompletion[]>;
}

export interface ApiActivity {
  name: string;
  uuid: UUID;
  frequency: Frequency;
  id: number;
}

export interface ApiActivityCompletion {
  activity_uuid: string; // eslint-disable-line camelcase
  done_at: string; // eslint-disable-line camelcase
  id: number;
  uuid: UUID;
}

export type UUID = string; // todo refine this
export enum Frequency {
  DAILY = 7,
  EVERY_OTHER = 3.5,
  ONCE = 1,
  TWICE = 2,
  THRICE = 3,
  FOUR = 4,
  FIVE = 5,
  SIX = 6,
}

export enum ResponseKind {
  SUCCESS = "success",
  ERROR = "error",
}

export const { SUCCESS, ERROR } = ResponseKind;

export type SuccessResponse<T> = { kind: typeof SUCCESS; data: T };
export type ErrorResponse = { kind: typeof ERROR; error: Error };

export type ApiWrappedResponse<T> = SuccessResponse<T> | ErrorResponse;
export type ApiPromise<T> = Promise<ApiWrappedResponse<T>>;

export const successResponse = <T>(data: T): SuccessResponse<T> => ({
  kind: SUCCESS,
  data,
});

export function apiPromiseSuccess<T>(data: T): ApiPromise<T> {
  return Promise.resolve(successResponse(data));
}
