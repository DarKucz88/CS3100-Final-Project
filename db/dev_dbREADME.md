# Database Overview 
# Author: Harrison Kay
# Date: 5/1/2025
# 
# Just kinda shows what my intentions and ideas are for each table in the DB and what each column is linked to via a foreign key (When applicable).

## Table: tblUsers
Stores all users (students and instructors).

| Column       | Type      | Notes                                      |
|--------------|-----------|--------------------------------------------|
| userId       | INTEGER   | Primary key                                |
| firstName    | TEXT      | User's first name                          |
| lastName     | TEXT      | User's last name                           |
| email        | TEXT      | Unique email, required                     |
| passwordHash | TEXT      | Hashed password                            |
| role         | TEXT      | saves roll like 'student' or 'instructor'  |
| phone        | TEXT      | Optional phone number                      |
| discord      | TEXT      | Optional Discord handle                    |
| teams        | TEXT      | Optional Microsoft Teams handle            |
| createdAt    | TIMESTAMP | Timestamp of account creation              |

## Table: tblCourses
Represents courses managed by instructors.

| Column       | Type      | Notes                                      |
|--------------|-----------|--------------------------------------------|
| courseId     | INTEGER   | Primary key                                |
| courseName   | TEXT      | Name of the course                         |
| courseCode   | TEXT      | Unique join code for students              |
| instructorId | INTEGER   | Foreign key → tblUsers.userId              |
| term         | TEXT      | Term information (e.g., Fall 2025)         |
| createdAt    | TIMESTAMP | Timestamp of course creation               |

## Table: tblEnrollments
Links students to courses they are enrolled in.

| Column       | Type    | Notes                                       |
|--------------|---------|---------------------------------------------|
| enrollmentId | INTEGER | Primary key                                 |
| userId       | INTEGER | Foreign key → tblUsers.userId               |
| courseId     | INTEGER | Foreign key → tblCourses.courseId           |
| status       | TEXT    | Enrollment status ('enrolled', 'dropped')   |

## Table: tblCourseGroups
Defines teams or groups within a course.

| Column     | Type    | Notes                                      |
|------------|---------|--------------------------------------------|
| groupId    | INTEGER | Primary key                                |
| courseId   | INTEGER | Foreign key → tblCourses.courseId          |
| groupName  | TEXT    | Team name                                  |

## Table: tblGroupMembers
Links users to the groups they belong to.

| Column   | Type    | Notes                                      |
|----------|---------|--------------------------------------------|
| groupId  | INTEGER | Foreign key → tblCourseGroups.groupId      |
| userId   | INTEGER | Foreign key → tblUsers.userId              |

*Primary Key: (groupId, userId)*

## Table: tblAssessments
Represents a peer review assessment.

| Column       | Type    | Notes                                      |
|--------------|---------|--------------------------------------------|
| assessmentId | INTEGER | Primary key                                |
| courseId     | INTEGER | Foreign key → tblCourses.courseId          |
| name         | TEXT    | Title of the assessment                    |
| description  | TEXT    | Optional description                       |
| startDate    | DATE    | Optional start date                        |
| endDate      | DATE    | Optional end date                          |
| createdBy    | INTEGER | Foreign key → tblUsers.userId              |

## Table: tblAssessmentQuestions
Questions attached to a specific assessment.

| Column        | Type    | Notes                                                   |
|---------------|---------|---------------------------------------------------------|
| questionId    | INTEGER | Primary key                                             |
| assessmentId  | INTEGER | Foreign key → tblAssessments.assessmentId              |
| questionText  | TEXT    | The actual question text                                |
| questionType  | TEXT    | One of: 'likert', 'mcq', 'short'                        |
| optionsJson   | TEXT    | JSON-encoded array of options (for MCQs only)           |

## Table: tblAssessmentResponses
Student-to-student review responses.

| Column        | Type    | Notes                                                  |
|---------------|---------|--------------------------------------------------------|
| responseId    | INTEGER | Primary key                                            |
| assessmentId  | INTEGER | Foreign key → tblAssessments.assessmentId             |
| questionId    | INTEGER | Foreign key → tblAssessmentQuestions.questionId       |
| reviewerId    | INTEGER | Foreign key → tblUsers.userId (who is submitting)      |
| revieweeId    | INTEGER | Foreign key → tblUsers.userId (who is being evaluated) |
| responseText  | TEXT    | Free text or encoded response                          |

---