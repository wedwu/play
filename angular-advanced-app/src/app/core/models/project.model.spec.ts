import { Project } from "./project.model";
import { describe, beforeEach, it, expect } from "@jest/globals";
import { Task, TaskStatus, TaskPriority } from "./task.model";

describe("Project", () => {
  let project: Project;

  beforeEach(() => {
    project = new Project("Nexus", "Core rebuild", "u1", "product");
  });

  // ── Constructor ───────────────────────────────

  describe("constructor", () => {
    it("sets name, description, ownerId, category", () => {
      expect(project.name).toBe("Nexus");
      expect(project.ownerId).toBe("u1");
      expect(project.category).toBe("product");
    });
    it('defaults phase to "planning"', () =>
      expect(project.phase).toBe("planning"));
    it("assigns a color string", () =>
      expect(project.color.startsWith("#")).toBe(true));
    it("assigns an emoji icon", () =>
      expect(project.iconEmoji.length).toBeGreaterThan(0));
  });

  // ── Validation ────────────────────────────────

  describe("validate", () => {
    it("passes for a valid project", () =>
      expect(project.validate()).toBe(true));
    it("fails for name shorter than 2", () => {
      project.name = "X";
      expect(project.validate()).toBe(false);
    });
    it("fails for missing ownerId", () => {
      project.ownerId = "";
      expect(project.validate()).toBe(false);
    });
  });

  // ── Members ───────────────────────────────────

  describe("addMember / removeMember", () => {
    it("adds a member", () => {
      project.addMember("u2");
      expect(project.memberIds).toContain("u2");
    });
    it("ignores duplicates", () => {
      project.addMember("u2");
      project.addMember("u2");
      expect(project.memberIds).toHaveLength(1);
    });
    it("removes a member", () => {
      project.addMember("u2");
      project.removeMember("u2");
      expect(project.memberIds).not.toContain("u2");
    });
  });

  // ── Tasks ─────────────────────────────────────

  describe("addTask / removeTask", () => {
    it("associates a task and sets projectId", () => {
      const task = new Task("Build API", "", TaskPriority.MEDIUM);
      project.addTask(task);
      expect(project.tasks).toHaveLength(1);
      expect(task.projectId).toBe(project.id);
    });

    it("removes a task by id", () => {
      const task = new Task("Build API", "", TaskPriority.MEDIUM);
      project.addTask(task);
      project.removeTask(task.id);
      expect(project.tasks).toHaveLength(0);
    });

    it("tasks getter returns a copy", () => {
      const task = new Task("T", "", TaskPriority.LOW);
      project.addTask(task);
      const snapshot = project.tasks;
      snapshot.pop();
      expect(project.tasks).toHaveLength(1);
    });
  });

  // ── Stats ─────────────────────────────────────

  describe("stats", () => {
    it("counts tasks by status", () => {
      const t1 = new Task("A", "", TaskPriority.HIGH);
      const t2 = new Task("B", "", TaskPriority.MEDIUM);
      t2.taskStatus = TaskStatus.DONE;
      project.addTask(t1);
      project.addTask(t2);

      const s = project.stats;
      expect(s.totalTasks).toBe(2);
      expect(s.completedTasks).toBe(1);
      expect(s.completionRate).toBe(50);
    });

    it("returns 0 completionRate for empty project", () =>
      expect(project.stats.completionRate).toBe(0));
  });

  // ── Health ────────────────────────────────────

  describe("health", () => {
    it('is "green" when completion ≥ 80%', () => {
      for (let i = 0; i < 8; i++) {
        const t = new Task(`T${i}`, "", TaskPriority.LOW);
        t.taskStatus = TaskStatus.DONE;
        project.addTask(t);
      }
      for (let i = 0; i < 2; i++)
        project.addTask(new Task(`P${i}`, "", TaskPriority.LOW));
      expect(project.health).toBe("green");
    });

    it('is "red" when there are overdue tasks', () => {
      const t = new Task("Late", "", TaskPriority.HIGH);
      t.dueDate = new Date(Date.now() - 86_400_000);
      project.addTask(t);
      expect(project.health).toBe("red");
    });
  });

  // ── Milestones ────────────────────────────────

  describe("addMilestone / completeMilestone", () => {
    it("creates and returns a milestone", () => {
      const m = project.addMilestone(
        "Alpha",
        new Date(Date.now() + 86_400_000),
      );
      expect(project.milestones).toHaveLength(1);
      expect(m.name).toBe("Alpha");
      expect(m.completed).toBe(false);
    });

    it("marks a milestone complete", () => {
      const m = project.addMilestone("Beta", new Date(Date.now() + 86_400_000));
      project.completeMilestone(m.id);
      expect(project.milestones[0].completed).toBe(true);
    });
  });

  // ── Sprints ───────────────────────────────────

  describe("startSprint", () => {
    it("creates a sprint with the given details", () => {
      const start = new Date();
      const end = new Date(Date.now() + 14 * 86_400_000);
      const sprint = project.startSprint("Sprint 1", start, end, ["t1"]);
      expect(project.sprints).toHaveLength(1);
      expect(sprint.taskIds).toContain("t1");
    });
  });

  describe("activeSprint", () => {
    it("returns undefined when no active sprint", () =>
      expect(project.activeSprint).toBeUndefined());

    it("returns the sprint whose date range includes today", () => {
      const sprint = project.startSprint(
        "Current",
        new Date(Date.now() - 86_400_000),
        new Date(Date.now() + 86_400_000),
      );
      expect(project.activeSprint?.id).toBe(sprint.id);
    });
  });

  // ── Phase progression ─────────────────────────

  describe("advance", () => {
    it("moves to next phase", () => {
      project.advance();
      expect(project.phase).toBe("active");
    });

    it('does not advance past "completed"', () => {
      project.phase = "completed";
      project.advance();
      expect(project.phase).toBe("completed");
    });
  });

  // ── Clone ─────────────────────────────────────

  describe("clone", () => {
    it("creates an independent copy", () => {
      project.addMember("u2");
      const copy = project.clone();
      copy.memberIds.push("u3");
      expect(project.memberIds).toHaveLength(1);
    });
  });
});
