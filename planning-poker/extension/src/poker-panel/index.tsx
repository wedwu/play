import * as React from "react";
import { createRoot } from "react-dom/client";
import * as SDK from "azure-devops-extension-sdk";
import { CommonServiceIds, IProjectPageService } from "azure-devops-extension-api";
import { WorkItemTrackingServiceIds, IWorkItemFormService } from "azure-devops-extension-api/WorkItemTracking";
import { PokerPanel } from "./PokerPanel";

async function main() {
  await SDK.init({ loaded: false });
  await SDK.ready();

  const projectService = await SDK.getService<IProjectPageService>(
    CommonServiceIds.ProjectPageService
  );
  const project = await projectService.getProject();

  const formService = await SDK.getService<IWorkItemFormService>(
    WorkItemTrackingServiceIds.WorkItemFormService
  );
  const workItemId = await formService.getId();

  const user = SDK.getUser();

  // Room is unique per org+project+work item so multiple teams/items never collide.
  const host = SDK.getHost();
  const roomId = `${host.name}/${project?.name}/${workItemId}`;

  const root = createRoot(document.getElementById("root")!);
  root.render(
    React.createElement(PokerPanel, {
      roomId,
      currentUserId: user.id,
      currentUserName: user.displayName,
      currentUserImage: user.imageUrl,
      onApplyEstimate: async (value: number) => {
        // "Story Points" is the standard Scrum field; swap for
        // Microsoft.VSTS.Scheduling.Effort (Agile) or Size (CMMI) if your
        // process template differs.
        await formService.setFieldValue("Microsoft.VSTS.Scheduling.StoryPoints", value);
      }
    })
  );

  SDK.notifyLoadSucceeded();
}

main().catch((err) => {
  console.error("Planning Poker panel failed to load", err);
});
