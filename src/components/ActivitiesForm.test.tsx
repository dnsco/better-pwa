import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { RecoilRoot } from "recoil";
import { act } from "react-dom/test-utils";
import { ActivitiesForm } from "./ActivitiesForm";
import { Activity } from "../state/activity";

describe("THE APP", () => {
  async function renderAndCreateActivity() {
    render(
      <RecoilRoot>
        <ActivitiesForm />
      </RecoilRoot>
    );

    await act(() => {
      const name = screen.getByLabelText("name") as HTMLInputElement;
      fireEvent.change(name, { target: { value: "NewActivity1" } });
      fireEvent.click(screen.getByLabelText("create"));
      return Promise.resolve();
    });
  }

  beforeEach(() => {
    localStorage.clear();
  });

  it("adds the newly created activity to the page", async () => {
    await renderAndCreateActivity();
    expect(screen.getByTestId("activity-NewActivity1")).toBeInTheDocument();
  });

  it("adds new items to  a list", async () => {
    await renderAndCreateActivity();

    await act(() => {
      const name = screen.getByLabelText("name") as HTMLInputElement;
      fireEvent.change(name, { target: { value: "NewActivity2" } });
      fireEvent.click(screen.getByLabelText("create"));
      return Promise.resolve();
    });
    expect(screen.getByTestId("activity-NewActivity2")).toBeInTheDocument();
    expect(screen.getByTestId("activity-NewActivity1")).toBeInTheDocument();
  });

  it("persists the activities to local storage", async () => {
    await renderAndCreateActivity();

    const node = screen.getByTestId("activity-NewActivity1");
    const uuid = node.getAttribute("data-uuid");
    if (!uuid) throw Error(`Couldn't get uuid off of ${node}`);

    expect(itemInLocalStorage(uuid).name).toBe("NewActivity1");
  });

  function itemInLocalStorage(uuid: string): Activity {
    const storageMap = JSON.parse(
      localStorage.getItem("recoil-persist") || "{}"
    );

    const activity = storageMap[`myActivities__"${uuid}"`];
    if (!activity) throw new Error(`Failed to find activity with key${uuid}`);
    return activity;
  }
});
