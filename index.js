const express = require("express")
const bodyParser = require("body-parser")
const ejs = require("ejs")
const _ = require("lodash")
const mongoose = require("mongoose")
const path = require("path")
const fs = require("fs")
const { spawnSync } = require('child_process')
const router = express.Router();

const Upload = require("./middlewares/UploadImage");
const Resize = require("./middlewares/Resize");

const User = require("./models/User.js");
const AttendanceSheet = require("./models/AttendanceSheet.js");

mongoose.connect("mongodb://localhost:27017/AttendanceSystemDatabase")

const app = express()
app.set("view engine", "ejs")
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }))
app.use(express.static("public"))

let loginErrorMessage = ""
let registerErrorMessage = ""

let isUserLoggedIn = false;
let userLoggedIn = null;

let attendanceStatus = false; // depicts whether attendance is going or not
let currentAttendanceSheet = null;


app.get(["/", "/login"], function (req, res) {

    if (isUserLoggedIn === true) {
        if (userLoggedIn.role === "student") {
            return res.redirect("/sdashboard");
        }
        else {
            return res.redirect("/dashboard");
        }
    }

    let loginTempMessage = loginErrorMessage
    loginErrorMessage = ""

    res.render("login", { page: "Login", loginErrorMessage: loginTempMessage, registerErrorMessage: registerErrorMessage });
});

app.get("/register", function (req, res) {

    if (isUserLoggedIn === true) {
        if (userLoggedIn.role === "student") {
            return res.redirect("/sdashboard");
        }
        else {
            return res.redirect("/dashboard");
        }
    }

    let registerTempMessage = registerErrorMessage
    registerErrorMessage = ""

    res.render("login", { page: "Register", loginErrorMessage: loginErrorMessage, registerErrorMessage: registerTempMessage });
});

app.get("/dashboard", function (req, res) {
    if (isUserLoggedIn === false) { return res.redirect("/login"); }
    else { if (userLoggedIn.role === "student") { return res.redirect("/sdashboard"); } }

    User.find({ role: "student" }, function (err, students) {
        if (!err) {
            res.render("dashboard", { page: "Dashboard", user: userLoggedIn, students: students });
        }
    });
});

app.get("/sdashboard", function (req, res) {
    if (isUserLoggedIn === false) { return res.redirect("/login"); }
    else { if (userLoggedIn.role === "teacher") { return res.redirect("/dashboard"); } }

    if (userLoggedIn.imageUploaded === false) { return res.redirect("./screenshot") };

    res.render("sdashboard", { page: "Dashboard", user: userLoggedIn, attendanceStatus: attendanceStatus });
});

app.get("/toggleAttendanceStatus", function (req, res) {

    if (isUserLoggedIn === false) { return res.redirect("/login"); }
    else { if (userLoggedIn.role === "student") { return res.redirect("/sdashboard"); } }

    attendanceStatus = attendanceStatus === false ? true : false;

    if (attendanceStatus === true) {

        currentAttendanceSheet = new AttendanceSheet({
            teacherEmail: userLoggedIn.email,
            dateAndTime: new Date(), // CHANGE DATE HERE
            record: []
        });
        currentAttendanceSheet.save();
    }
    else {
        currentAttendanceSheet.save();
        // make changes to students attendance record

        const presentStudentEmails = currentAttendanceSheet.record;
        const attendanceDate = currentAttendanceSheet.dateAndTime;
        presentStudentEmails.forEach(function (studentEmail) {
            User.findOne({ email: studentEmail }, function (err, studentFound) {
                if (!err) {
                    studentFound.presentClasses += 1;
                    studentFound.presentClassesDates.push(attendanceDate);
                    studentFound.save();
                }
            });
        });

        User.find({ role: "student" }, function (err, students) {
            if (!err) {
                students.forEach(function (student) {
                    student.totalClasses += 1;
                    student.save();
                })
            }
        });

        currentAttendanceSheet = null;
    }

    res.redirect("/takeattendance");
});

app.get("/takeattendance", function (req, res) {
    if (isUserLoggedIn === false) { return res.redirect("/login"); }
    else { if (userLoggedIn.role === "student") { return res.redirect("/sdashboard"); } }

    User.find({ role: "student" }, function (err, students) {
        if (!err) {
            res.render("takeattendance", {
                page: "Take Attendance",
                students: students,
                user: userLoggedIn,
                attendanceStatus: attendanceStatus,
                presentStudentEmails: currentAttendanceSheet
            });
        }
    });
});

app.get("/viewattendance", function (req, res) {
    if (isUserLoggedIn === false) { return res.redirect("/login"); }
    else { if (userLoggedIn.role === "student") { return res.redirect("/sdashboard"); } }

    User.find({ role: "student" }, function (err, students) {
        if (!err) {

            AttendanceSheet.find({}, function (err, attendanceSheet) {
                if (!err) {
                    classesDates = []
                    attendanceSheet.forEach(function (record) {
                        classesDates.push(record.dateAndTime);
                    });
                    res.render("viewattendance", {
                        page: "Attendance Sheet",
                        students: students,
                        user: userLoggedIn,
                        totalClassesDates: classesDates
                    });
                }
            })
        }
    });
});

app.get("/sviewattendance", function (req, res) {
    if (isUserLoggedIn === false) { return res.redirect("/login"); }
    else { if (userLoggedIn.role === "teacher") { return res.redirect("/dashboard"); } }

    AttendanceSheet.find({}, function (err, attendanceSheet) {
        if (!err) {
            classesDates = []
            attendanceSheet.forEach(function (record) {
                classesDates.push(record.dateAndTime);
            });
            res.render("sviewattendance", {
                page: "Attendance Sheet",
                user: userLoggedIn,
                totalClassesDates: classesDates
            });
        }
    });
});


app.get("/screenshot", function (req, res) {
    if (isUserLoggedIn === false) { return res.redirect("/login"); }
    else { if (userLoggedIn.role === "teacher") { return res.redirect("/dashboard"); } }

    res.render("screenshot", { page: "Upload Image", user: userLoggedIn });
    //get screenshot
});

app.get("/change-image", function (req, res) {
    if (isUserLoggedIn === false) { return res.redirect("/login"); }
    else { if (userLoggedIn.role === "teacher") { return res.redirect("/dashboard"); } }

    res.render("screenshot", { page: "Upload Image", user: userLoggedIn });
});

app.get("/click-image", function (req, res) {
    if (isUserLoggedIn === false) { return res.redirect("/login"); }
    else { if (userLoggedIn.role === "teacher") { return res.redirect("/dashboard"); } }

    res.render("clickImage", { page: "Click Image", user: userLoggedIn });
});

app.get("/view-image", function (req, res) {
    if (isUserLoggedIn === false) { return res.redirect("/login"); }
    else { if (userLoggedIn.role === "teacher") { return res.redirect("/dashboard"); } }

    res.render("viewImage", { page: "Uploaded Image", user: userLoggedIn });
});


app.get("/logout", function (req, res) {
    isUserLoggedIn = false;
    userLoggedIn = null;
    res.redirect("/login");
});

app.post("/mark-present", function (req, res) {
    if (isUserLoggedIn === false) { return res.redirect("/login"); }
    else { if (userLoggedIn.role === "teacher") { return res.redirect("/dashboard"); } }

    if (attendanceStatus === false) { return res.redirect("/sdashboard") }

    // CHECK FACE HERE
    // And based upon the result, redirect to respective pages

    const base64 = req.body.clickImage;
    const buffer = Buffer.from(base64, "base64");
    fs.writeFileSync("public/images/recognizeImages/" + userLoggedIn.email + ".jpg", buffer);

    let recognizeFace = false;

    function faceRecognition(email) {

        const FACE_RECOGNIZER_PATH = __dirname.replace("\\", "\\\\") + "\\FaceRecognizer\\main.py";
        const FACE_RECOGNIZER_IMAGES_PATH = __dirname.replace("\\", "\\\\") + "\\public\\images\\";

        const python = spawnSync('python', [FACE_RECOGNIZER_PATH, email, FACE_RECOGNIZER_IMAGES_PATH]);

        let dataToSend = python.output.toString();
        dataToSend = dataToSend.split(',')[1];

        return (dataToSend === "TRUE" ? true : false);
    }

    recognizeFace = faceRecognition(userLoggedIn.email);

    if (recognizeFace === false) {
        return res.render("recognizeFace", { page: "Not Recognize", user: userLoggedIn, recognizeFace: false });
    }
    else {
        let found = false;
        currentAttendanceSheet.record.forEach(function (studentEmail) {
            if (studentEmail === userLoggedIn.email) {
                found = true;
            }
        });

        if (found === false) {
            currentAttendanceSheet.record.push(userLoggedIn.email);
        }

        currentAttendanceSheet.save();
        return res.render("recognizeFace", { page: "Recognize", user: userLoggedIn, recognizeFace: true });
    }
});


app.post("/registeruser", function (req, res) {
    const userObj = req.body;

    if (userObj.password[0] !== userObj.password[1]) {
        registerErrorMessage = "Password do not match"
        return res.redirect("/register");
    }

    User.findOne({ email: userObj.email }, function (err, user) {
        if (!err) {
            if (user !== null) {
                registerErrorMessage = "Email-ID already registered"
                return res.redirect("/register");
            }
            else {
                const user = new User({
                    name: _.startCase(_.toLower(userObj.name)),
                    email: userObj.email,
                    password: userObj.password[0],
                    role: userObj.btnradio,
                    presentClasses: 0,
                    totalClasses: 0,
                    imageUploaded: false,
                });
                user.save();
                isUserLoggedIn = true;
                userLoggedIn = user;
                userObj.btnradio === "student" ? res.redirect("/sdashboard") : res.redirect("/dashboard");
            }
        }
    })
});

app.post("/loginuser", function (req, res) {

    const userObj = req.body;

    User.findOne({ email: userObj.email, password: userObj.password }, function (err, user) {
        if (user === null) {
            loginErrorMessage = "Email ID or password do not match"
            return res.redirect("/login");
        }
        else {
            isUserLoggedIn = true;
            userLoggedIn = user;
            if (user.role === "student") {
                res.redirect("sdashboard");
            }
            else {
                res.redirect("dashboard");
            }
        }
    });
});

app.post("/upload-image", Upload.single("userImage"), function (req, res) {
    if (isUserLoggedIn === false) { return res.redirect("/login"); }
    else { if (userLoggedIn.role === "teacher") { return res.redirect("/dashboard"); } }

    const imagePath = path.join(__dirname, "/public/images");
    const fileUpload = new Resize(imagePath, userLoggedIn.email);
    if (req.file) {
        // IMAGE UPLOADED SUCCESSFULLY
        fileName = fileUpload.save(req.file.buffer);
        userLoggedIn.imageUploaded = true;
        userLoggedIn.save();
        res.redirect("sdashboard");
    }
    else {
        res.send("Image not saved");
    }
});

const port = 3000
app.listen(port, function () {
    console.log("Server is up and running on port : " + port);
});
