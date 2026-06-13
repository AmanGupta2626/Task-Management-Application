import "dotenv/config";
import mongoose from "mongoose";

import { connectDB } from "./config/db.js";
import User from "./models/User.js";
import Task from "./models/Task.js";

async function seed() {
  await connectDB(process.env.MONGO_URI);

  await Task.deleteMany({});
  await User.deleteMany({});

  const manager = await User.create({
    username: "manager",
    email: "manager@demo.com",
    password: "password123",
    role: "Manager",
  });

  const leadAlice = await User.create({
    username: "alice_lead",
    email: "alice@demo.com",
    password: "password123",
    role: "TeamLead",
    manager: manager._id,
  });

  const leadBob = await User.create({
    username: "bob_lead",
    email: "bob@demo.com",
    password: "password123",
    role: "TeamLead",
    manager: manager._id,
  });

  const emp1 = await User.create({
    username: "charlie",
    email: "charlie@demo.com",
    password: "password123",
    role: "Employee",
    teamLead: leadAlice._id,
  });

  const emp2 = await User.create({
    username: "dave",
    email: "dave@demo.com",
    password: "password123",
    role: "Employee",
    teamLead: leadAlice._id,
  });

  const emp3 = await User.create({
    username: "erin",
    email: "erin@demo.com",
    password: "password123",
    role: "Employee",
    teamLead: leadBob._id,
  });

  await Task.create([
    {
      title: "Prepare sprint report",
      description: "Compile the weekly sprint metrics",
      status: "pending",
      createdBy: manager._id,
      assignedTo: leadAlice._id,
    },
    {
      title: "Review pull requests",
      description: "Review open PRs from the team",
      status: "completed",
      createdBy: leadAlice._id,
      assignedTo: emp1._id,
    },
    {
      title: "Fix login bug",
      description: "Investigate the reported login failure",
      status: "pending",
      createdBy: emp1._id,
      assignedTo: emp1._id,
    },
    {
      title: "Update documentation",
      description: "Refresh the onboarding docs",
      status: "pending",
      createdBy: leadAlice._id,
      assignedTo: emp2._id,
    },
    {
      title: "Deploy staging build",
      description: "Push the latest build to staging",
      status: "completed",
      createdBy: leadBob._id,
      assignedTo: emp3._id,
    },
  ]);

  console.log("Seed complete");
  console.log("Login with any of these (password: password123):");
  console.log("  Manager   -> manager@demo.com");
  console.log("  TeamLead  -> alice@demo.com / bob@demo.com");
  console.log(
    "  Employee  -> charlie@demo.com / dave@demo.com / erin@demo.com",
  );

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
