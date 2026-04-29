import { describe, beforeEach, it, expect } from "@jest/globals";
import { Task, TaskBuilder, TaskPriority, TaskStatus } from "./task.model";

describe("Task", () => {
  let task: Task;

  beforeEach(() => {
    task = new Task(
      "Fix login bug",
      "Auth is broken",
      TaskPriority.HIGH,
      "dev",
    );
  });

  // ── Constructor ───────────────────────────────

  describe("constructor", () => {
    it("sets title and description", () => {
      expect(task.title).toBe("Fix login bug");
      expect(task.description).toBe("Auth is broken");
    });
    it("sets priority", () => expect(task.priority).toBe(TaskPriority.HIGH));
    it("defaults status to TODO", () =>
      expect(task.taskStatus).toBe(TaskStatus.TODO));
    it("defaults loggedHours to 0", () => expect(task.loggedHours).toBe(0));
    it('defaults description to ""', () =>
      expect(new Task("T").description).toBe(""));
    it("defaults priority to MEDIUM", () =>
      expect(new Task("T").priority).toBe(TaskPriority.MEDIUM));
  });

  // ── Validation ────────────────────────────────

  describe("validate", () => {
    it("passes for title 3–200 chars", () =>
      expect(new Task("abc").validate()).toBe(true));
    it("fails for title < 3 chars", () =>
      expect(new Task("ab").validate()).toBe(false));
    it("fails for empty title", () =>
      expect(new Task("").validate()).toBe(false));
    it("fails for title > 200 chars", () =>
      expect(new Task("x".repeat(201)).validate()).toBe(false));
  });

  // ── Display ───────────────────────────────────

  describe("getDisplayName", () => {
    it("includes priority label and title", () =>
      expect(task.getDisplayName()).toBe("[HIGH] Fix login bug"));
  });

  // ── Progress ──────────────────────────────────

  describe("progress", () => {
    it("is 0 for a TODO task with no subtasks", () =>
      expect(task.progress).toBe(0));

    it("is 100 for a DONE task with no subtasks", () => {
      task.taskStatus = TaskStatus.DONE;
      expect(task.progress).toBe(100);
    });

    it("derives from subtask completion", () => {
      const sub1 = task.addSubtask("A");
      task.addSubtask("B");
      task.toggleSubtask(sub1.id);
      expect(task.progress).toBe(50);
    });

    it("can be overridden via setter", () => {
      task.progress = 75;
      expect(task.progress).toBe(75);
    });

    it("clamps override to 0–100", () => {
      task.progress = 150;
      expect(task.progress).toBe(100);
    });
  });

  // ── Due date ──────────────────────────────────

  describe("isOverdue", () => {
    it("is false when no due date", () => expect(task.isOverdue).toBe(false));
    it("is false when due date is in the future", () => {
      task.dueDate = new Date(Date.now() + 86_400_000);
      expect(task.isOverdue).toBe(false);
    });
    it("is true when due date is past and status is not DONE", () => {
      task.dueDate = new Date(Date.now() - 86_400_000);
      expect(task.isOverdue).toBe(true);
    });
    it("is false when past due date but status is DONE", () => {
      task.dueDate = new Date(Date.now() - 86_400_000);
      task.taskStatus = TaskStatus.DONE;
      expect(task.isOverdue).toBe(false);
    });
  });

  describe("daysUntilDue", () => {
    it("returns null when no due date", () =>
      expect(task.daysUntilDue).toBeNull());
    it("returns positive value for future date", () => {
      task.dueDate = new Date(Date.now() + 2 * 86_400_000);
      expect(task.daysUntilDue).toBeGreaterThan(0);
    });
    it("returns negative value for past date", () => {
      task.dueDate = new Date(Date.now() - 2 * 86_400_000);
      expect(task.daysUntilDue).toBeLessThan(0);
    });
  });

  // ── Workflow ──────────────────────────────────

  describe("transition", () => {
    it("succeeds for an allowed transition", () => {
      const result = task.transition(TaskStatus.IN_PROGRESS);
      expect(result.success).toBe(true);
      expect(task.taskStatus).toBe(TaskStatus.IN_PROGRESS);
    });

    it("fails for a disallowed transition", () => {
      const result = task.transition(TaskStatus.DONE);
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it("does not mutate status on failure", () => {
      task.transition(TaskStatus.DONE);
      expect(task.taskStatus).toBe(TaskStatus.TODO);
    });
  });

  describe("getAllowedTransitions", () => {
    it("returns transitions for current status", () => {
      expect(task.getAllowedTransitions()).toContain(TaskStatus.IN_PROGRESS);
    });
  });

  // ── Assignment ────────────────────────────────

  describe("assign", () => {
    it("sets assigneeId on success", () => {
      const r = task.assign("user-1");
      expect(r.success).toBe(true);
      expect(task.assigneeId).toBe("user-1");
    });

    it("fails for empty userId", () => {
      const r = task.assign("");
      expect(r.success).toBe(false);
    });
  });

  // ── Subtasks ──────────────────────────────────

  describe("addSubtask", () => {
    it("creates a subtask and appends it", () => {
      const sub = task.addSubtask("Step 1");
      expect(task.subtasks).toHaveLength(1);
      expect(sub.title).toBe("Step 1");
      expect(sub.done).toBe(false);
    });
  });

  describe("toggleSubtask", () => {
    it("flips done flag", () => {
      const sub = task.addSubtask("Step 1");
      task.toggleSubtask(sub.id);
      expect(task.subtasks[0].done).toBe(true);
      task.toggleSubtask(sub.id);
      expect(task.subtasks[0].done).toBe(false);
    });
  });

  // ── Comments ──────────────────────────────────

  describe("addComment", () => {
    it("appends a comment", () => {
      const c = task.addComment("user-1", "Looks good");
      expect(task.comments).toHaveLength(1);
      expect(c.content).toBe("Looks good");
      expect(c.authorId).toBe("user-1");
      expect(c.edited).toBe(false);
    });
  });

  // ── Tags ──────────────────────────────────────

  describe("addTag", () => {
    it("adds a tag", () => {
      task.addTag("bug", "#f00");
      expect(task.tags).toHaveLength(1);
    });
    it("ignores duplicate labels", () => {
      task.addTag("bug", "#f00");
      task.addTag("bug", "#0f0");
      expect(task.tags).toHaveLength(1);
    });
  });

  // ── Time ──────────────────────────────────────

  describe("logTime", () => {
    it("increments loggedHours", () => {
      task.logTime(2);
      task.logTime(1.5);
      expect(task.loggedHours).toBeCloseTo(3.5);
    });
  });

  // ── Clone ─────────────────────────────────────

  describe("clone", () => {
    it("creates an independent copy", () => {
      task.addTag("bug", "#f00");
      const copy = task.clone();
      copy.tags.push({ label: "extra", color: "#000" });
      expect(task.tags).toHaveLength(1);
    });

    it("copies priority and assignee", () => {
      task.assigneeId = "u1";
      const copy = task.clone();
      expect(copy.priority).toBe(TaskPriority.HIGH);
      expect(copy.assigneeId).toBe("u1");
    });
  });
});

// ── TaskBuilder ───────────────────────────────

describe("TaskBuilder", () => {
  it("chains all setters and builds a valid task", () => {
    const task = new TaskBuilder("Write tests")
      .withPriority(TaskPriority.HIGH)
      .withDescription("Cover core modules")
      .withAssignee("u1")
      .withProject("p1")
      .withEstimate(4)
      .withDueDate(new Date(Date.now() + 86_400_000))
      .withTag("testing", "#96CEB4")
      .build();

    expect(task.title).toBe("Write tests");
    expect(task.priority).toBe(TaskPriority.HIGH);
    expect(task.assigneeId).toBe("u1");
    expect(task.tags).toHaveLength(1);
  });

  it("throws when title is too short", () => {
    expect(() => new TaskBuilder("ab").build()).toThrow();
  });
});
