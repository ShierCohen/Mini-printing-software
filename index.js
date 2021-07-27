const express = require("express");
const methodOverride = require("method-override");
const app = express();
const path = require("path");
const { v4: uuid } = require("uuid"); //For generating ID's
const timeHeightRatio = 2;

const mongoose = require("mongoose");
const Queue = require("./models/queue");
const History = require("./models/history");

mongoose
  .connect("mongodb://localhost:27017/queue", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MONGO connection open!");
  })
  .catch((err) => {
    console.log("MONGO connection error!");
    console.log(err);
  });

app.use(express.static(path.join(__dirname, "public")));

//To parse form data in POST request body:
app.use(express.urlencoded({ extended: true }));

// To 'fake' put/patch/delete requests:
app.use(methodOverride("_method"));

// Views folder and EJS setup:
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));

// **********************************
// home - renders the home page
// **********************************
app.get("/", (req, res) => {
  res.render("home");
});

// **********************************
// NEW - renders the form (print page)
// **********************************
app.get("/print", (req, res) => {
  res.render("print");
});

// **********************************
// queue - renders the queue page
// **********************************
app.get("/queue", async (req, res) => {
  const allJobs = await Queue.find({});
  res.render("queue", { allJobs });
});

// **********************************
// edit - renders the edit page
// **********************************
app.get("/:id/edit", async (req, res) => {
  const { id } = req.params;
  const selectedJob = await Queue.find({ jobId: id });
  const jobDetaild = selectedJob[0];
  res.render("edit", { jobDetaild });
});

// **********************************
// Register - renders the register page
// **********************************
app.get("/register", (req, res) => {
  res.render("register");
});

// **********************************
// Login - renders the login page
// **********************************
app.get("/login", (req, res) => {
  res.render("login");
});

// **********************************
// CREATE - creates a new print and
// render the queue page
// **********************************
app.post("/queue", async (req, res) => {
  const { projectname, modelfile, modelsize } = req.body;
  const jobsInQueue = await Queue.countDocuments();
  const newPrint = new Queue({
    jobId: uuid(),
    name: projectname,
    modelPath: modelfile,
    height: modelsize,
    estimatedTime: modelsize * timeHeightRatio,
    status: jobsInQueue === 0 ? "Awaits Operator" : "In queue",
    remaining: modelsize * timeHeightRatio,
  });
  await newPrint.save();
  res.render("processing");
});

// **********************************
// history - renders the history page
// **********************************
app.get("/history", async (req, res) => {
  const historyJobs = await History.find({});
  res.render("history", { historyJobs });
});

// *******************************************
// SHOW - details about one particular print
// *******************************************
app.get("/:id", async (req, res) => {
  const { id } = req.params;
  const Job = await Queue.findOne({ jobId: id });
  res.render("showJob", { Job });
});

// *******************************************
// SHOW - show history job details
// *******************************************
app.get("/history/:id", async (req, res) => {
  const { id } = req.params;
  const Job = await History.findOne({ jobId: id });
  res.render("showJob", { Job });
});

// *******************************************
// UPDATE - updates a particular job
// *******************************************
app.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const newProjectName = req.body.projectname;
  const newProjectHight = req.body.modelsize;

  await Queue.updateOne(
    { jobId: id },
    {
      name: newProjectName,
      height: newProjectHight,
      estimatedTime: newProjectHight * timeHeightRatio,
      remaining: newProjectHight * timeHeightRatio,
    }
  );
  res.redirect("/queue");
});

// *******************************************
// DELETE/DESTROY- removes a single job
// *******************************************
app.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const deletedJob = await Queue.findOne({ jobId: id });

  if (deletedJob.status === "Printing") {
    let remainingTime =
      deletedJob.remaining - (Date.now() - deletedJob.startTime) / 1000;
    await Queue.updateOne(
      { jobId: id },
      { status: "Stopped", remaining: remainingTime }
    );
    clearTimeout(printingJob);
  } else {
    await Queue.findOneAndDelete({ jobId: id });
    const nextJob = await Queue.find().limit(1);
    const deletedPrint = new History({
      jobId: deletedJob.jobId,
      name: deletedJob.name,
      modelPath: deletedJob.modelPath,
      height: deletedJob.height,
      estimatedTime: deletedJob.estimatedTime,
      status: "Canceled",
    });
    await deletedPrint.save();

    // If the deleted job was the first job, change the new first job status to be 'Awaits Operator'
    if (
      deletedJob.status === "Awaits Operator" ||
      deletedJob.status === "Stopped"
    ) {
      try {
        await Queue.updateOne(
          { jobId: nextJob[0].jobId },
          { status: "Awaits Operator" }
        );
      } catch (error) {
        console.log("queue is empty");
      }
    }
  }
  res.redirect("/queue");
});

// *******************************************
// REPRINT- reprint a particular job
// *******************************************
app.post("/:id/reprint", async (req, res) => {
  const { id } = req.params;
  const origJob = await Queue.findOne({ jobId: id });
  const newPrint = new Queue({
    jobId: uuid(),
    name: origJob.name,
    modelPath: origJob.modelPath,
    height: origJob.height,
    estimatedTime: origJob.estimatedTime,
    status: "In queue",
    remaining: origJob.estimatedTime,
  });
  await newPrint.save();
  res.redirect("/queue");
});

// *******************************************
// REPRINT- reprint from history
// *******************************************
app.post("/:id/reprintFromHistory", async (req, res) => {
  const { id } = req.params;
  const origJob = await History.findOne({ jobId: id });
  const jobsInQueue = await Queue.countDocuments();
  const newPrint = new Queue({
    jobId: uuid(),
    name: origJob.name,
    modelPath: origJob.modelPath,
    height: origJob.height,
    estimatedTime: origJob.estimatedTime,
    status: jobsInQueue === 0 ? "Awaits Operator" : "In queue",
    remaining: origJob.estimatedTime,
  });
  await newPrint.save();
  res.redirect("/queue");
});

// *******************************************
// RESUME- resume job
// *******************************************
app.post("/:id/resume", async (req, res) => {
  const { id } = req.params;
  const printJob = await Queue.findOne({ jobId: id });
  await Queue.updateOne(
    { jobId: id },
    { status: "Printing", startTime: Date.now() }
  );
  const time = printJob.remaining * 1000;
  let prom = new Promise((resolve) => {
    printingJob = setTimeout(() => resolve(printJob.jobId), time);
  });

  prom
    .then((x) => Queue.findOneAndDelete({ jobId: x }))
    .then(
      () =>
        (deletedPrint = new History({
          jobId: printJob.jobId,
          name: printJob.name,
          modelPath: printJob.modelPath,
          height: printJob.height,
          estimatedTime: printJob.estimatedTime,
          status: "Success",
        }))
    )
    .then(async () => await deletedPrint.save())

    .then(async () => (nextJob = await Queue.find().limit(1)))
    .then(async () => {
      try {
        await Queue.updateOne(
          { jobId: nextJob[0].jobId },
          { status: "Awaits Operator" }
        );
      } catch (error) {
        console.log("queue is empty");
      }
    });

  res.redirect("/queue");
});

// *******************************************
// PLAY- play job
// *******************************************
app.post("/:id/play", async (req, res) => {
  const { id } = req.params;
  const printJob = await Queue.findOne({ jobId: id });
  await Queue.updateOne(
    { jobId: id },
    { status: "Printing", startTime: Date.now() }
  );

  const time = printJob.remaining * 1000;

  let prom = new Promise((resolve) => {
    printingJob = setTimeout(() => resolve(printJob.jobId), time);
  });

  prom
    .then((x) => Queue.findOneAndDelete({ jobId: x }))
    .then(
      () =>
        (deletedPrint = new History({
          jobId: printJob.jobId,
          name: printJob.name,
          modelPath: printJob.modelPath,
          height: printJob.height,
          estimatedTime: printJob.estimatedTime,
          status: "Success",
        }))
    )
    .then(async () => await deletedPrint.save())

    .then(async () => (nextJob = await Queue.find().limit(1)))
    .then(async () => {
      try {
        await Queue.updateOne(
          { jobId: nextJob[0].jobId },
          { status: "Awaits Operator" }
        );
      } catch (error) {
        console.log("queue is empty");
      }
    });

  res.redirect("/queue");
});

app.listen(4000, () => {
  console.log("Listening to port 4000");
});
