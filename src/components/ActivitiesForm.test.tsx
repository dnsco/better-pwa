import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { RecoilRoot } from "recoil";
import { act } from "react-dom/test-utils";
import { ActivitiesForm } from "./ActivitiesForm";
import { Activity } from "../state/myActivities";

describe("THE APP", () => {
  beforeAll(async () => {
    render(
      <RecoilRoot>
        <ActivitiesForm />
      </RecoilRoot>
    );

    await act(() => {
      const name = screen.getByLabelText("name") as HTMLInputElement;
      fireEvent.change(name, { target: { value: "YES" } });
      fireEvent.click(screen.getByLabelText("create"));
      return Promise.resolve();
    });
  });

  test("adds the newly created activity to the page", () => {
    expect(screen.getByTestId("activity-YES")).toBeInTheDocument();
  });

  test("it persists the activities to local storage", () => {
    const { localActivities = [] } = recoilLocalStorage();
    expect(localActivities[0]?.name).toBe("YES");
  });

  function recoilLocalStorage(): { localActivities?: Activity[] } {
    return JSON.parse(localStorage.getItem("recoil-persist") || "{}");
  }
});
