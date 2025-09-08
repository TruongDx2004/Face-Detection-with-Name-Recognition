# AttendanceController.js Database Schema Updates

## Summary of Changes Made

The AttendanceController.js has been updated to match the new database schema defined in `setup_server.js`. Here are the key changes:

### 1. Database Schema Changes
- **Old Schema**: Used `schedule_id` in `attendance_sessions` table
- **New Schema**: Uses `course_section_id` in `attendance_sessions` table
- **Old Schema**: Direct relationships between sessions and classes/subjects/teachers
- **New Schema**: Relationships through `course_sections` table

### 2. Table Structure Updates
- `attendance_sessions` now has:
  - `course_section_id` instead of `schedule_id`
  - `session_name` field added
  - `is_active` boolean instead of `status` enum
- `attendances` table (was `attendance_records`)
- Relationships: `attendance_sessions` → `course_sections` → `classes`/`subjects`/`users`

### 3. Methods Updated

#### `createAttendanceSession()`
- Changed parameter from `schedule_id` to `course_section_id`
- Added `session_name` parameter
- Updated validation to check `course_sections` table
- Updated authorization check through `course_sections.teacher_id`

#### `getAttendanceSessions()`
- Updated JOIN to use `course_sections` instead of `schedules`
- Added `course_section_name` and `course_section_code` to response

#### `markAttendanceByFace()`
- Updated to get class info through `course_sections`
- Fixed table references from `attendance_records` to `attendances`

#### `getSessionDetails()`
- Updated JOINs to use `course_sections`
- Added course section information to response
- Updated field mapping for new schema

#### `getAttendanceReport()`
- Updated to use `course_sections` relationships
- Fixed table name from `attendance_records` to `attendances`

#### `updateSessionStatus()`
- Changed from `status` enum to `is_active` boolean
- Added automatic `end_time` setting when deactivating

#### `markAttendanceManual()`
- Updated authorization check through `course_sections`

#### `getActiveSessions()`
- Updated JOINs to use `course_sections`
- Added `course_section_name` to response
- Fixed table references

#### `getMyAttendance()`
- Updated to use `attendances` table instead of `attendance_records`
- Updated JOINs through `course_sections`
- Added `course_section_name` to response

#### `getMySessions()`
- Updated to use `course_sections` for teacher filtering
- Updated JOINs and field references
- Fixed count query

#### `endSession()`
- Updated authorization check through `course_sections`
- Changed to set `is_active = FALSE` and `end_time`

#### `deleteSession()`
- Updated authorization check through `course_sections`
- Fixed table name from `attendance_records` to `attendances`

### 4. Key Database Relationship Changes

**Old Structure:**
```
attendance_sessions → schedules → classes/subjects/users
```

**New Structure:**
```
attendance_sessions → course_sections → classes/subjects/users
```

### 5. Field Mapping Changes

| Old Field | New Field | Notes |
|-----------|-----------|-------|
| `schedule_id` | `course_section_id` | Foreign key change |
| `status` | `is_active` | Enum to boolean |
| `attendance_records` | `attendances` | Table rename |
| - | `session_name` | New field added |

### 6. Benefits of New Schema
- Better separation of concerns with course sections
- More flexible course management
- Cleaner relationship structure
- Support for multiple sections of same subject
- Better academic year and semester tracking

All methods now correctly use the new database schema and maintain backward compatibility in API responses where possible.