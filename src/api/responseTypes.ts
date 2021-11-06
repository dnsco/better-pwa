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

export interface ApiActivity {
  name: string;
  uuid: UUID;
  frequency: Frequency;
}
