const mongoose = require("mongoose")

const attendanceSheetSchema = new mongoose.Schema({
    teacherEmail: String,
    dateAndTime: Date,
    record: [String]
});

const AttendanceSheet = mongoose.model("AttendanceSheet", attendanceSheetSchema);


module.exports = AttendanceSheet;
