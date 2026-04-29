# MatchHire-AI Backend API Reference

## Common middleware

### Helmet
- Adds HTTP headers for improved security.

### CORS
- Allows requests from `http://localhost:5173` by default.

### express.json()
- Parses JSON request bodies for API routes.

### `auth` middleware (`backend/middleware/auth.js`)
- Reads `Authorization: Bearer <token>` header.
- Verifies the JWT using `JWT_SECRET`.
- Loads the `User` from MongoDB and attaches it to `req.user`.
- Returns `401` if the token is missing, invalid, or expired.

### `requireSeeker` / `requireHirer` middleware (`backend/middleware/roles.js`)
- `requireSeeker`: allows only users with `hasSeeker=true`.
- `requireHirer`: allows only users with `hasHirer=true`.
- Returns `403` when the role requirement is not met.

### `upload` middleware (`backend/middleware/upload.js`)
- Handles multipart form uploads for resume parsing.
- Enforces file size limits and returns `413` for files larger than allowed.

### Error handler
- Catches `LIMIT_FILE_SIZE` and returns a 413 error.
- Converts other unhandled errors into `500` responses.

## API endpoints

### Authentication

#### `POST /api/auth/signup`
- No auth required.
- Validates `fullName`, `email`, `password`, and role flags `hasSeeker` / `hasHirer`.
- Requires exactly one role to be `true`.
- Creates a new `User` and returns:
  - `accessToken`
  - `refreshToken`
  - `user` object

#### `POST /api/auth/signin`
- No auth required.
- Validates `email` and `password`.
- Verifies the credentials and returns:
  - `accessToken`
  - `refreshToken`
  - `user` object

### Resume parsing

#### `POST /api/resume/parse`
- Middleware:
  1. `auth`
  2. `requireSeeker`
  3. `upload.single("file")`
- Controller: `parseResume`
- What it does:
  - Accepts a resume file upload (PDF or DOCX).
  - Extracts text and sends it to AI if `GEMINI_API_KEY` is configured.
  - Creates or updates the seeker profile and parsed resume artifacts.
- Checks:
  - User must be authenticated.
  - User must be a seeker.
  - File is required.
  - Returns `413` when upload is too large.

#### `PATCH /api/resume`
- Middleware:
  1. `auth`
  2. `requireSeeker`
- Controller: `patchResume`
- What it does:
  - Accepts JSON fields such as `headline`, `summary`, `location`, `skills`, `experience`, and `education`.
  - Updates the current seeker profile without uploading a new file.
  - If the seeker already has a `profileStrength`, recomputes and saves the updated value via AI.
- Checks:
  - User must be authenticated.
  - User must be a seeker.

### Seeker profile management

#### `GET /api/me/profile`
- Middleware:
  1. `auth`
  2. `requireSeeker`
- Controller: `getProfile`
- What it does:
  - Returns the authenticated seeker's profile details, jobs swiped, total matches, AI readiness, profile strength, and top job recommendations.
  - If `profileStrength` is unset, calls AI to compute and save it before returning.
  - Uses the same job matching logic as `GET /api/jobs/closest`.
- Checks:
  - User must be authenticated.
  - User must be a seeker.

#### `PUT /api/me/profile`
- Middleware:
  1. `auth`
  2. `requireSeeker`
- Controller: `updatePersonal`
- What it does:
  - Updates personal seeker profile fields such as name, title, bio, links, and skills.
  - If the seeker already has a `profileStrength`, recomputes it via AI and stores the new value in the profile.
- Checks:
  - User must be authenticated.
  - User must be a seeker.

#### `DELETE /api/me/profile`
- Middleware:
  1. `auth`
  2. `requireSeeker`
- Controller: `deleteProfile`
- What it does:
  - Deletes the authenticated seeker's profile and related parsed artifacts.
- Checks:
  - User must be authenticated.
  - User must be a seeker.

### Job management

#### `POST /api/jobs`
- Middleware:
  1. `auth`
  2. `requireHirer`
- Controller: `postJob`
- What it does:
  - Creates a job listing for the authenticated hirer.
  - Stores job details such as title, company, location, salary, description, skills, and requirements.
- Checks:
  - User must be authenticated.
  - User must be a hirer.

#### `PUT /api/jobs/:id`
- Middleware:
  1. `auth`
  2. `requireHirer`
- Controller: `updateJob`
- What it does:
  - Replaces full job details for the specified job.
  - Typically requires ownership validation inside the controller.
- Checks:
  - User must be authenticated.
  - User must be a hirer.
  - Job must exist.

#### `PATCH /api/jobs/:id`
- Middleware:
  1. `auth`
  2. `requireHirer`
- Controller: `patchJob`
- What it does:
  - Updates one or more fields of an existing job listing.
- Checks:
  - User must be authenticated.
  - User must be a hirer.
  - Job must exist.

#### `DELETE /api/jobs/:id`
- Middleware:
  1. `auth`
  2. `requireHirer`
- Controller: `deleteJob`
- What it does:
  - Deletes the specified job listing.
- Checks:
  - User must be authenticated.
  - User must be a hirer.
  - Job must exist.

#### `GET /api/jobs/closest`
- Middleware:
  1. `auth`
  2. `requireSeeker`
- Controller: `getClosestJobs`
- What it does:
  - Loads the authenticated seeker's profile.
  - Excludes jobs the seeker already swiped on.
  - Computes similarity using local heuristics and optionally refines with AI.
  - Returns jobs sorted by similarity percentage.
- Checks:
  - User must be authenticated.
  - User must be a seeker.

#### `GET /api/jobs/:id/candidates`
- Middleware:
  1. `auth`
  2. `requireHirer`
- Controller: `getCandidates`
- What it does:
  - Loads the specified job.
  - Excludes candidates the hirer already swiped on.
  - Computes similarity between the job and seeker profiles.
  - Optionally refines results with AI.
- Checks:
  - User must be authenticated.
  - User must be a hirer.
  - Job must exist.

### Swipe and matching

#### `POST /api/swipe/job`
- Middleware:
  1. `auth`
  2. `requireSeeker`
- Controller: `swipeJob`
- What it does:
  - Records a seeker swipe on a job (`heart` / `reject`).
  - Updates seeker profile swipe counters and `jobsSwiped`.
  - If the hirer previously hearted this seeker, creates a `Match`.
  - Returns the swipe record and any created `match`.
- Checks:
  - User must be authenticated.
  - User must be a seeker.
  - `jobId` and `type` are required.

#### `POST /api/swipe/candidate`
- Middleware:
  1. `auth`
  2. `requireHirer`
- Controller: `swipeCandidate`
- What it does:
  - Records a hirer swipe on a candidate for a given job.
  - Updates hirer stats for candidate interest.
  - If the seeker previously hearted the job, creates a `Match`.
  - Returns the swipe record and any created `match`.
- Checks:
  - User must be authenticated.
  - User must be a hirer.
  - `userId`, `jobId`, and `type` are required.

### Interview practice

#### `POST /api/interview/generate`
- Middleware:
  1. `auth`
  2. `requireSeeker`
- Controller: `generatePractice`
- What it does:
  - Sends the seeker's role, experience, skills, and level to AI.
  - Returns the top 10 practice interview questions.
  - If AI is not available, returns a fallback set of generic interview questions.
- Checks:
  - User must be authenticated.
  - User must be a seeker.

#### `POST /api/interview/evaluate`
- Middleware:
  1. `auth`
  2. `requireSeeker`
- Controller: `evaluateTest`
- What it does:
  - Sends job description and question/answer pairs to AI.
  - Receives an AI readiness score and breakdown.
  - Stores the score in the seeker's profile under `aiReadiness`.
- Checks:
  - User must be authenticated.
  - User must be a seeker.
  - `qna` array is required.

### Miscellaneous

#### `GET /health`
- No auth required.
- Returns `{ status: "ok" }`.

#### `GET /api-docs`
- No auth required.
- Serves Swagger UI for the backend API.

## Notes

- `Authorization` header requirement: `Bearer <access_token>`.
- `requireSeeker` and `requireHirer` are used consistently to enforce role-based access.
- Uploaded resume files should be sent as `multipart/form-data` with field name `file`.
- AI-powered features depend on `GEMINI_API_KEY` or an equivalent key.
