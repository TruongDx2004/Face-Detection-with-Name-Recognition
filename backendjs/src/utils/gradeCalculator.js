/**
 * Utility class for grade calculations
 */
class GradeCalculator {
    /**
     * Convert numeric score to letter grade
     * @param {number} score - Numeric score (0-10)
     * @returns {object} - Letter grade and GPA points
     */
    static getLetterGrade(score) {
        if (score >= 9.0) {
            return { letter: 'A+', gpa: 4.0 };
        } else if (score >= 8.5) {
            return { letter: 'A', gpa: 3.7 };
        } else if (score >= 8.0) {
            return { letter: 'B+', gpa: 3.5 };
        } else if (score >= 7.0) {
            return { letter: 'B', gpa: 3.0 };
        } else if (score >= 6.5) {
            return { letter: 'C+', gpa: 2.5 };
        } else if (score >= 5.5) {
            return { letter: 'C', gpa: 2.0 };
        } else if (score >= 5.0) {
            return { letter: 'D+', gpa: 1.5 };
        } else if (score >= 4.0) {
            return { letter: 'D', gpa: 1.0 };
        } else {
            return { letter: 'F', gpa: 0.0 };
        }
    }

    /**
     * Get classification based on cumulative GPA
     * @param {number} gpa - Cumulative GPA (0-4.0)
     * @returns {string} - Classification
     */
    static getClassification(gpa) {
        if (gpa >= 3.6) {
            return 'Xuất sắc';
        } else if (gpa >= 3.2) {
            return 'Giỏi';
        } else if (gpa >= 2.5) {
            return 'Khá';
        } else if (gpa >= 2.0) {
            return 'Trung bình';
        } else if (gpa >= 1.0) {
            return 'Yếu';
        } else {
            return 'Kém';
        }
    }

    /**
     * Calculate final score based on weights
     * @param {object} scores - Object containing assignment_avg, exam_avg, attendance_score
     * @param {object} weights - Object containing assignment_weight, exam_weight, attendance_weight
     * @returns {number} - Final calculated score
     */
    static calculateFinalScore(scores, weights) {
        const assignmentScore = scores.assignment_avg || 0;
        const examScore = scores.exam_avg || 0;
        const attendanceScore = scores.attendance_score || 0;

        const assignmentWeight = weights.assignment_weight || 30;
        const examWeight = weights.exam_weight || 60;
        const attendanceWeight = weights.attendance_weight || 10;

        // Ensure weights total 100%
        const totalWeight = assignmentWeight + examWeight + attendanceWeight;
        if (totalWeight !== 100) {
            throw new Error('Total weights must equal 100%');
        }

        const finalScore = (
            (assignmentScore * assignmentWeight / 100) +
            (examScore * examWeight / 100) +
            (attendanceScore * attendanceWeight / 100)
        );

        return parseFloat(finalScore.toFixed(2));
    }

    /**
     * Calculate weighted GPA for multiple courses
     * @param {Array} courses - Array of course objects with credits and gpa_points
     * @returns {number} - Weighted GPA
     */
    static calculateWeightedGPA(courses) {
        let totalCredits = 0;
        let totalGpaPoints = 0;

        courses.forEach(course => {
            const credits = course.credits || 3; // Default 3 credits
            const gpaPoints = course.gpa_points || 0;
            
            totalCredits += credits;
            totalGpaPoints += gpaPoints * credits;
        });

        return totalCredits > 0 ? parseFloat((totalGpaPoints / totalCredits).toFixed(2)) : 0;
    }

    /**
     * Check if student passes based on final score and passing threshold
     * @param {number} finalScore - Final calculated score
     * @param {number} passingScore - Minimum passing score
     * @returns {boolean} - Whether student passes
     */
    static isPassed(finalScore, passingScore = 5.0) {
        return finalScore >= passingScore;
    }

    /**
     * Calculate attendance score from attendance records
     * @param {number} presentCount - Number of present sessions
     * @param {number} totalSessions - Total number of sessions
     * @param {number} maxScore - Maximum attendance score (default 10)
     * @returns {number} - Attendance score
     */
    static calculateAttendanceScore(presentCount, totalSessions, maxScore = 10) {
        if (totalSessions === 0) return 0;
        const attendanceRate = presentCount / totalSessions;
        return parseFloat((attendanceRate * maxScore).toFixed(1));
    }

    /**
     * Get grade statistics for a student
     * @param {Array} grades - Array of grade objects
     * @returns {object} - Statistics object
     */
    static getGradeStatistics(grades) {
        if (grades.length === 0) {
            return {
                total_subjects: 0,
                passed_subjects: 0,
                failed_subjects: 0,
                pass_rate: 0,
                average_score: 0,
                highest_score: 0,
                lowest_score: 0,
                grade_distribution: {}
            };
        }

        const validGrades = grades.filter(g => g.final_score !== null && g.final_score !== undefined);
        const passedGrades = validGrades.filter(g => g.is_passed);
        const failedGrades = validGrades.filter(g => !g.is_passed);

        const scores = validGrades.map(g => g.final_score);
        const averageScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

        // Grade distribution
        const distribution = {};
        validGrades.forEach(grade => {
            const letterGrade = grade.letter_grade || 'N/A';
            distribution[letterGrade] = (distribution[letterGrade] || 0) + 1;
        });

        return {
            total_subjects: validGrades.length,
            passed_subjects: passedGrades.length,
            failed_subjects: failedGrades.length,
            pass_rate: validGrades.length > 0 ? parseFloat(((passedGrades.length / validGrades.length) * 100).toFixed(1)) : 0,
            average_score: parseFloat(averageScore.toFixed(2)),
            highest_score: scores.length > 0 ? Math.max(...scores) : 0,
            lowest_score: scores.length > 0 ? Math.min(...scores) : 0,
            grade_distribution: distribution
        };
    }

    /**
     * Predict required score for remaining assessments to reach target grade
     * @param {object} currentScores - Current scores object
     * @param {object} weights - Weight configuration
     * @param {number} targetScore - Target final score
     * @param {string} remainingType - Type of remaining assessment ('assignment' or 'exam')
     * @returns {number|null} - Required score or null if impossible
     */
    static predictRequiredScore(currentScores, weights, targetScore, remainingType) {
        const assignmentWeight = weights.assignment_weight / 100;
        const examWeight = weights.exam_weight / 100;
        const attendanceWeight = weights.attendance_weight / 100;
        
        const attendanceScore = currentScores.attendance_score || 0;
        const attendanceContribution = attendanceScore * attendanceWeight;

        if (remainingType === 'assignment') {
            const examContribution = (currentScores.exam_avg || 0) * examWeight;
            const requiredAssignmentContribution = targetScore - examContribution - attendanceContribution;
            const requiredAssignmentScore = requiredAssignmentContribution / assignmentWeight;
            
            return requiredAssignmentScore >= 0 && requiredAssignmentScore <= 10 
                ? parseFloat(requiredAssignmentScore.toFixed(1)) 
                : null;
        } else if (remainingType === 'exam') {
            const assignmentContribution = (currentScores.assignment_avg || 0) * assignmentWeight;
            const requiredExamContribution = targetScore - assignmentContribution - attendanceContribution;
            const requiredExamScore = requiredExamContribution / examWeight;
            
            return requiredExamScore >= 0 && requiredExamScore <= 10 
                ? parseFloat(requiredExamScore.toFixed(1)) 
                : null;
        }

        return null;
    }

    /**
     * Format grade for display
     * @param {object} grade - Grade object
     * @returns {object} - Formatted grade object
     */
    static formatGradeForDisplay(grade) {
        return {
            ...grade,
            assignment_avg: grade.assignment_avg ? parseFloat(grade.assignment_avg.toFixed(1)) : null,
            exam_avg: grade.exam_avg ? parseFloat(grade.exam_avg.toFixed(1)) : null,
            attendance_score: grade.attendance_score ? parseFloat(grade.attendance_score.toFixed(1)) : null,
            final_score: grade.final_score ? parseFloat(grade.final_score.toFixed(1)) : null,
            gpa_points: grade.gpa_points ? parseFloat(grade.gpa_points.toFixed(2)) : null
        };
    }
}

module.exports = GradeCalculator;