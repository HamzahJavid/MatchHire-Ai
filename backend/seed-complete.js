require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
const HirerProfile = require("./models/HirerProfile");
const Job = require("./models/Job");
const SeekerProfile = require("./models/SeekerProfile");
const Skill = require("./models/Skill");
const Experience = require("./models/Experience");
const Education = require("./models/Education");
const Swipe = require("./models/Swipe");
const Match = require("./models/Match");
const Interview = require("./models/Interview");
const Message = require("./models/Message");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/matchhire";

async function seedDatabase() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("✓ Connected to MongoDB");

        // Clear existing data
        await Promise.all([
            User.deleteMany({}),
            HirerProfile.deleteMany({}),
            Job.deleteMany({}),
            SeekerProfile.deleteMany({}),
            Skill.deleteMany({}),
            Experience.deleteMany({}),
            Education.deleteMany({}),
            Swipe.deleteMany({}),
            Match.deleteMany({}),
            Interview.deleteMany({}),
            Message.deleteMany({}),
        ]);
        console.log("✓ Cleared existing data");

        // ===== CREATE USERS =====
        const dummyUsers = [
            {
                email: "alice@matchhire.com",
                password: "password123",
                fullName: "Alice Johnson",
                phone: "555-0101",
                hasSeeker: true,
                hasHirer: false,
                activeMode: "seeker",
                isEmailVerified: true,
                isActive: true,
            },
            {
                email: "bob@matchhire.com",
                password: "password123",
                fullName: "Bob Smith",
                phone: "555-0102",
                hasSeeker: true,
                hasHirer: false,
                activeMode: "seeker",
                isEmailVerified: true,
                isActive: true,
            },
            {
                email: "carol@matchhire.com",
                password: "password123",
                fullName: "Carol Williams",
                phone: "555-0103",
                hasSeeker: true,
                hasHirer: false,
                activeMode: "seeker",
                isEmailVerified: true,
                isActive: true,
            },
            {
                email: "david@matchhire.com",
                password: "password123",
                fullName: "David Engineer",
                phone: "555-0104",
                hasSeeker: true,
                hasHirer: false,
                activeMode: "seeker",
                isEmailVerified: true,
                isActive: true,
            },
            {
                email: "john@techcorp.com",
                password: "password123",
                fullName: "John Davis",
                phone: "555-0201",
                hasSeeker: false,
                hasHirer: true,
                activeMode: "hirer",
                isEmailVerified: true,
                isActive: true,
            },
            {
                email: "sarah@innovationlabs.com",
                password: "password123",
                fullName: "Sarah Brown",
                phone: "555-0202",
                hasSeeker: false,
                hasHirer: true,
                activeMode: "hirer",
                isEmailVerified: true,
                isActive: true,
            },
        ];

        const SALT_ROUNDS = 12;
        const usersToInsert = await Promise.all(
            dummyUsers.map(async (user) => ({
                ...user,
                password: await bcrypt.hash(user.password, SALT_ROUNDS),
            })),
        );

        const createdUsers = await User.insertMany(usersToInsert);
        console.log(`✓ Created ${createdUsers.length} users`);

        // ===== CREATE HIRER PROFILES =====
        const hirerUsers = createdUsers.filter((u) => u.hasHirer);
        const hirerProfiles = await HirerProfile.insertMany([
            {
                user: hirerUsers[0]._id,
                company: {
                    name: "Tech Corp",
                    website: "https://techcorp.com",
                    industry: "Technology",
                    size: "201-500",
                    location: "San Francisco, USA",
                },
            },
            {
                user: hirerUsers[1]._id,
                company: {
                    name: "Innovation Labs",
                    website: "https://innovationlabs.com",
                    industry: "Software Development",
                    size: "51-200",
                    location: "New York, USA",
                },
            },
        ]);
        console.log(`✓ Created ${hirerProfiles.length} hirer profiles`);

        // ===== CREATE JOBS =====
        const jobs = await Job.insertMany([
            {
                hirer: hirerProfiles[0]._id,
                postedBy: hirerUsers[0]._id,
                title: "Senior React Developer",
                company: "Tech Corp",
                description: "We are looking for an experienced React developer to join our frontend team. You will work on building scalable web applications with modern React patterns.",
                location: { city: "San Francisco", country: "USA", isRemote: false, rangeKm: 50 },
                jobType: "full_time",
                salary: { min: 120000, max: 160000, currency: "USD", period: "annual", isVisible: true },
                minExperienceYears: 3,
                educationRequirement: "Bachelors in Computer Science",
                requiredSkills: [
                    { name: "React", isMandatory: true, minYears: 2 },
                    { name: "JavaScript", isMandatory: true, minYears: 3 },
                    { name: "TypeScript", isMandatory: false, minYears: 1 },
                ],
                preferredSkills: ["Next.js", "GraphQL", "Testing"],
                status: "active",
                publishedAt: new Date(),
            },
            {
                hirer: hirerProfiles[0]._id,
                postedBy: hirerUsers[0]._id,
                title: "Full Stack JavaScript Developer",
                company: "Tech Corp",
                description: "Join our team to develop both frontend and backend solutions using Node.js and React.",
                location: { city: "New York", country: "USA", isRemote: true },
                jobType: "full_time",
                salary: { min: 100000, max: 140000, currency: "USD", period: "annual", isVisible: true },
                minExperienceYears: 2,
                educationRequirement: "Bachelors in Computer Science",
                requiredSkills: [
                    { name: "JavaScript", isMandatory: true, minYears: 2 },
                    { name: "Node.js", isMandatory: true, minYears: 1 },
                    { name: "React", isMandatory: true, minYears: 2 },
                ],
                preferredSkills: ["Express.js", "MongoDB", "Docker"],
                status: "active",
                publishedAt: new Date(),
            },
            {
                hirer: hirerProfiles[1]._id,
                postedBy: hirerUsers[1]._id,
                title: "Backend Engineer - Python",
                company: "Innovation Labs",
                description: "We need a talented backend engineer to work with Python and develop scalable APIs.",
                location: { city: "Austin", country: "USA", isRemote: true },
                jobType: "full_time",
                salary: { min: 110000, max: 150000, currency: "USD", period: "annual", isVisible: true },
                minExperienceYears: 3,
                educationRequirement: "Bachelors in Computer Science",
                requiredSkills: [
                    { name: "Python", isMandatory: true, minYears: 3 },
                    { name: "FastAPI", isMandatory: false, minYears: 1 },
                    { name: "PostgreSQL", isMandatory: true, minYears: 2 },
                ],
                preferredSkills: ["Docker", "Kubernetes", "Redis"],
                status: "active",
                publishedAt: new Date(),
            },
            {
                hirer: hirerProfiles[1]._id,
                postedBy: hirerUsers[1]._id,
                title: "Mobile Developer - React Native",
                company: "Innovation Labs",
                description: "Build beautiful cross-platform mobile applications using React Native.",
                location: { city: "Seattle", country: "USA", isRemote: false, rangeKm: 30 },
                jobType: "full_time",
                salary: { min: 100000, max: 130000, currency: "USD", period: "annual", isVisible: true },
                minExperienceYears: 2,
                educationRequirement: "Bachelors in Computer Science",
                requiredSkills: [
                    { name: "React Native", isMandatory: true, minYears: 2 },
                    { name: "JavaScript", isMandatory: true, minYears: 2 },
                ],
                preferredSkills: ["TypeScript", "Redux", "Firebase"],
                status: "active",
                publishedAt: new Date(),
            },
        ]);
        console.log(`✓ Created ${jobs.length} job postings`);

        // ===== CREATE SEEKER PROFILES =====
        const seekerUsers = createdUsers.filter((u) => u.hasSeeker);
        const seekerProfiles = await Promise.all(
            seekerUsers.map(async (user) => {
                return await SeekerProfile.create({
                    user: user._id,
                    headline: "Experienced Full Stack Developer",
                    summary: "Passionate about building amazing web applications with modern technologies.",
                    location: "San Francisco, CA",
                    portfolioUrl: `https://${user.fullName.replace(/ /g, "").toLowerCase()}.dev`,
                    linkedinUrl: `https://linkedin.com/in/${user.fullName.replace(/ /g, "-").toLowerCase()}`,
                    githubUrl: `https://github.com/${user.fullName.replace(/ /g, "").toLowerCase()}`,
                    totalYearsOfExperience: 3,
                    highestEducationLevel: "bachelors",
                    profileStrength: 75,
                    aiReadiness: {
                        tag: "high",
                        score: 78,
                        assessedAt: new Date(),
                        breakdown: { communication: 75, technical: 82, profileCompleteness: 78 },
                    },
                    stats: { totalSwipes: 5, rightSwipes: 4, leftSwipes: 1, totalMatches: 2 },
                    preferences: {
                        jobTypes: ["full_time", "contract"],
                        expectedSalaryMin: 100000,
                        expectedSalaryMax: 150000,
                        currency: "USD",
                        preferredLocations: ["San Francisco", "New York", "Remote"],
                        openToRelocation: false,
                    },
                    isPublic: true,
                    isActive: true,
                });
            })
        );
        console.log(`✓ Created ${seekerProfiles.length} seeker profiles`);

        // ===== CREATE SKILLS =====
        const skills = [];
        for (const profile of seekerProfiles) {
            const profileSkills = await Skill.insertMany([
                {
                    seekerProfile: profile._id,
                    name: "React",
                    level: "advanced",
                    yearsOfExp: 3,
                    source: "manual",
                },
                {
                    seekerProfile: profile._id,
                    name: "JavaScript",
                    level: "expert",
                    yearsOfExp: 5,
                    source: "manual",
                },
                {
                    seekerProfile: profile._id,
                    name: "Node.js",
                    level: "advanced",
                    yearsOfExp: 2,
                    source: "manual",
                },
            ]);
            skills.push(...profileSkills);
        }
        console.log(`✓ Created ${skills.length} skills`);

        // ===== CREATE SWIPES & MATCHES =====
        let matchCount = 0;
        let interviewCount = 0;

        // Alice swipes on jobs
        const swipes = await Swipe.insertMany([
            {
                swipeType: "seeker_on_job",
                swipedBy: seekerUsers[0]._id,
                job: jobs[0]._id,
                direction: "right",
                matchScore: 94,
            },
            {
                swipeType: "seeker_on_job",
                swipedBy: seekerUsers[1]._id,
                job: jobs[0]._id,
                direction: "right",
                matchScore: 88,
            },
            {
                swipeType: "seeker_on_job",
                swipedBy: seekerUsers[2]._id,
                job: jobs[2]._id,
                direction: "right",
                matchScore: 92,
            },
            {
                swipeType: "hirer_on_seeker",
                swipedBy: hirerUsers[0]._id,
                seekerProfile: seekerProfiles[0]._id,
                hirerProfile: hirerProfiles[0]._id,
                job: jobs[0]._id,
                direction: "right",
                matchScore: 95,
            },
            {
                swipeType: "hirer_on_seeker",
                swipedBy: hirerUsers[1]._id,
                seekerProfile: seekerProfiles[2]._id,
                hirerProfile: hirerProfiles[1]._id,
                job: jobs[2]._id,
                direction: "right",
                matchScore: 93,
            },
        ]);
        console.log(`✓ Created ${swipes.length} swipes`);

        // Hirers swipe on candidates to create matches
        const matches = [];
        const matchesToCreate = [
            { seeker: seekerUsers[0]._id, job: jobs[0]._id, seekerProfile: seekerProfiles[0]._id, hirer: hirerUsers[0]._id, hirerProfile: hirerProfiles[0]._id },
            { seeker: seekerUsers[0]._id, job: jobs[1]._id, seekerProfile: seekerProfiles[0]._id, hirer: hirerUsers[0]._id, hirerProfile: hirerProfiles[0]._id },
            { seeker: seekerUsers[1]._id, job: jobs[0]._id, seekerProfile: seekerProfiles[1]._id, hirer: hirerUsers[0]._id, hirerProfile: hirerProfiles[0]._id },
            { seeker: seekerUsers[2]._id, job: jobs[2]._id, seekerProfile: seekerProfiles[2]._id, hirer: hirerUsers[1]._id, hirerProfile: hirerProfiles[1]._id },
        ];

        for (const matchData of matchesToCreate) {
            const match = await Match.create({
                ...matchData,
                compatibilityScore: Math.floor(Math.random() * 30) + 70, // 70-100
                status: "active",
                matchedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random past date
            });
            matches.push(match);
            matchCount++;
        }
        console.log(`✓ Created ${matchCount} matches`);

        // ===== CREATE INTERVIEWS =====
        const interviews = [];

        // Interview 1: Practice interview - completed with evaluation
        const interview1 = await Interview.create({
            seeker: seekerUsers[0]._id,
            seekerProfile: seekerProfiles[0]._id,
            job: jobs[0]._id,
            match: matches[0]._id,
            type: "real",
            stage: "technical",
            role: "Senior React Developer",
            roleDescription: "Frontend development with React and modern JavaScript",
            candidateContext: {
                experience: "3 years",
                skills: ["React", "JavaScript", "TypeScript"],
                level: "senior",
            },
            questions: [
                { questionId: "q_1", text: "Tell me about your experience as a Senior React Developer.", order: 1 },
                { questionId: "q_2", text: "Explain the difference between useMemo and useCallback.", order: 2 },
                { questionId: "q_3", text: "How would you optimize a deeply nested component tree?", order: 3 },
                { questionId: "q_4", text: "Describe your approach to state management in large applications.", order: 4 },
                { questionId: "q_5", text: "What's your experience with testing React components?", order: 5 },
            ],
            responses: [
                { questionId: "q_1", question: "Tell me about your experience as a Senior React Developer.", answer: "I have 3 years of professional experience building React applications. I've led frontend teams and mentored junior developers.", recordedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), durationSeconds: 60 },
                { questionId: "q_2", question: "Explain the difference between useMemo and useCallback.", answer: "useMemo memoizes return values, while useCallback memoizes function references. Both are used to prevent unnecessary re-renders.", recordedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), durationSeconds: 45 },
                { questionId: "q_3", question: "How would you optimize a deeply nested component tree?", answer: "I would use memoization with React.memo, extract derived state, and consider splitting into smaller components.", recordedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), durationSeconds: 55 },
                { questionId: "q_4", question: "Describe your approach to state management in large applications.", answer: "I prefer Redux for large apps with complex state, and Context API for simpler cases. State should be normalized and centralized.", recordedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), durationSeconds: 70 },
                { questionId: "q_5", question: "What's your experience with testing React components?", answer: "I use Jest and React Testing Library. I focus on testing behavior rather than implementation details.", recordedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), durationSeconds: 50 },
            ],
            evaluation: {
                score: 87,
                assessedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                breakdown: { communication: 88, technical: 89, fit: 84 },
                comment: "Excellent technical knowledge with clear communication. Strong candidate for the role.",
                strengths: ["Deep React expertise", "Clear communication", "Good problem-solving approach"],
                improvements: ["Could provide more specific examples", "More detail on scalability"],
            },
            status: "completed",
            startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        });
        interviews.push(interview1);

        // Interview 2: Real interview - in progress
        const interview2 = await Interview.create({
            seeker: seekerUsers[1]._id,
            seekerProfile: seekerProfiles[1]._id,
            job: jobs[0]._id,
            match: matches[2]._id,
            type: "real",
            stage: "screening",
            role: "Senior React Developer",
            roleDescription: "Frontend development with React and modern JavaScript",
            candidateContext: {
                experience: "2 years",
                skills: ["React", "JavaScript"],
                level: "mid",
            },
            questions: [
                { questionId: "q_1", text: "Tell me about your experience as a React Developer.", order: 1 },
                { questionId: "q_2", text: "What projects have you worked on recently?", order: 2 },
                { questionId: "q_3", text: "How do you approach debugging React applications?", order: 3 },
            ],
            status: "in_progress",
            startedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // Started 1 hour ago
        });
        interviews.push(interview2);

        // Interview 3: Scheduled interview
        const interview3 = await Interview.create({
            seeker: seekerUsers[2]._id,
            seekerProfile: seekerProfiles[2]._id,
            job: jobs[2]._id,
            match: matches[3]._id,
            type: "real",
            stage: "technical",
            role: "Backend Engineer - Python",
            roleDescription: "Build scalable backend systems with Python",
            candidateContext: {
                experience: "4 years",
                skills: ["Python", "Django", "PostgreSQL"],
                level: "senior",
            },
            questions: [
                { questionId: "q_1", text: "Tell me about your backend development experience.", order: 1 },
                { questionId: "q_2", text: "How do you design scalable database schemas?", order: 2 },
            ],
            status: "scheduled",
            scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        });
        interviews.push(interview3);

        // Interview 4: Hirer-posted interview with seeker answers (TEST SCENARIO)
        const interview4 = await Interview.create({
            seeker: seekerUsers[0]._id,
            seekerProfile: seekerProfiles[0]._id,
            hirer: hirerUsers[0]._id,
            hirerProfile: hirerProfiles[0]._id,
            job: jobs[0]._id,
            match: matches[0]._id,
            type: "real",
            stage: "screening",
            role: "Senior React Developer",
            roleDescription: "Lead frontend development with React",
            candidateContext: {
                experience: "3 years",
                skills: ["React", "JavaScript", "TypeScript"],
                level: "senior",
            },
            questions: [
                { questionId: "hq_1", text: "Walk us through your React architecture approach for large-scale applications.", order: 1 },
                { questionId: "hq_2", text: "How do you handle state management and why did you choose that approach?", order: 2 },
                { questionId: "hq_3", text: "Tell us about the most challenging React performance optimization you've done.", order: 3 },
                { questionId: "hq_4", text: "How do you ensure code quality and maintainability in your React projects?", order: 4 },
            ],
            responses: [
                {
                    questionId: "hq_1",
                    question: "Walk us through your React architecture approach for large-scale applications.",
                    answer: "I typically organize React apps with clear component hierarchies, focusing on separation of concerns. I use container components for logic and presentational components for UI. For large apps, I implement code splitting with React.lazy and route-based splitting. State management is centralized using Redux, and I follow atomic design principles for component organization.",
                    recordedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                    durationSeconds: 120,
                },
                {
                    questionId: "hq_2",
                    question: "How do you handle state management and why did you choose that approach?",
                    answer: "For complex applications, Redux is my go-to because it provides predictable state management and excellent debugging with Redux DevTools. I normalize the state structure to avoid nested data, which makes updates more efficient. For smaller projects, Context API + useReducer works well. I avoid prop drilling by using selectors and memoized components to prevent unnecessary re-renders.",
                    recordedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                    durationSeconds: 95,
                },
                {
                    questionId: "hq_3",
                    question: "Tell us about the most challenging React performance optimization you've done.",
                    answer: "I optimized a dashboard that was re-rendering 50+ times per second. First, I profiled using React DevTools and found that the root component was re-rendering unnecessarily. I implemented React.memo on child components, used useMemo for expensive calculations, and split the store into feature-based slices. This reduced renders to 2-3 per second. I also lazy loaded charts and data tables, improving initial load time from 8s to 2.5s.",
                    recordedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                    durationSeconds: 130,
                },
                {
                    questionId: "hq_4",
                    question: "How do you ensure code quality and maintainability in your React projects?",
                    answer: "I use ESLint with strict rules, Prettier for formatting, and TypeScript for type safety. Every component has unit tests using Jest and React Testing Library, aiming for 80%+ coverage. I follow clear naming conventions and documentation standards. Code reviews are mandatory before merging to main. I also use Storybook for component documentation and visual regression testing.",
                    recordedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                    durationSeconds: 110,
                },
            ],
            status: "completed",
            startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        });
        interviews.push(interview4);

        interviewCount = interviews.length;
        console.log(`✓ Created ${interviewCount} interviews`);

        // ===== CREATE MESSAGES =====
        const messages = await Message.insertMany([
            // Conversation 1: Match 1
            {
                match: matches[0]._id,
                sender: hirerUsers[0]._id,
                receiver: seekerUsers[0]._id,
                text: "Hi Alice! Congratulations on the match! We're impressed with your profile. Would you be interested in a technical interview?",
                type: "text",
                isRead: true,
                readAt: new Date(),
                createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
            },
            {
                match: matches[0]._id,
                sender: seekerUsers[0]._id,
                receiver: hirerUsers[0]._id,
                text: "Thank you! I'm very interested in the Senior React Developer position. Yes, I'd love to do the technical interview!",
                type: "text",
                isRead: true,
                readAt: new Date(),
                createdAt: new Date(Date.now() - 3.8 * 24 * 60 * 60 * 1000),
            },
            {
                match: matches[0]._id,
                sender: hirerUsers[0]._id,
                receiver: seekerUsers[0]._id,
                text: "Great! We conducted the AI screening and your results are excellent - 87/100. Your technical knowledge is impressive!",
                type: "system",
                metadata: { interviewId: interview1._id, actionType: "interview_completed" },
                isRead: true,
                readAt: new Date(),
                createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            },
            {
                match: matches[0]._id,
                sender: hirerUsers[0]._id,
                receiver: seekerUsers[0]._id,
                text: "Would you be available for a final round interview next week? Let's schedule it for Monday at 2 PM PT.",
                type: "text",
                isRead: false,
                createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
            },

            // Conversation 2: Match 3
            {
                match: matches[3]._id,
                sender: hirerUsers[1]._id,
                receiver: seekerUsers[2]._id,
                text: "Hello Carol! We loved your profile. Your Python experience looks great. Let's schedule an interview for Thursday at 3 PM EST.",
                type: "text",
                isRead: true,
                readAt: new Date(),
                createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            },
            {
                match: matches[3]._id,
                sender: seekerUsers[2]._id,
                receiver: hirerUsers[1]._id,
                text: "Perfect! Thursday at 3 PM EST works for me. I'm looking forward to discussing the Backend Engineer role.",
                type: "text",
                isRead: false,
                createdAt: new Date(Date.now() - 1.9 * 24 * 60 * 60 * 1000),
            },
        ]);
        console.log(`✓ Created ${messages.length} messages`);

        // Update match statuses based on interviews
        await Match.findByIdAndUpdate(matches[0]._id, { status: "interviewing" });
        await Match.findByIdAndUpdate(matches[3]._id, { status: "interviewing" });

        await mongoose.connection.close();
        console.log("\n✅ Database seeding completed successfully!");
        console.log("\n📊 Summary:");
        console.log(`   - Users: ${createdUsers.length}`);
        console.log(`   - Hirer Profiles: ${hirerProfiles.length}`);
        console.log(`   - Jobs: ${jobs.length}`);
        console.log(`   - Seeker Profiles: ${seekerProfiles.length}`);
        console.log(`   - Matches: ${matchCount}`);
        console.log(`   - Interviews: ${interviewCount}`);
        console.log(`   - Messages: ${messages.length}`);
        console.log(`   - Skills: ${skills.length}`);

        console.log("\n🔑 Test Credentials (plain text for login):");
        console.log("   - alice@matchhire.com / password123 (seeker)");
        console.log("   - bob@matchhire.com / password123 (seeker)");
        console.log("   - carol@matchhire.com / password123 (seeker)");
        console.log("   - david@matchhire.com / password123 (seeker)");
        console.log("   - john@techcorp.com / password123 (hirer)");
        console.log("   - sarah@innovationlabs.com / password123 (hirer)");
    } catch (error) {
        console.error("✗ Seeding error:", error.message);
        process.exit(1);
    }
}

seedDatabase();
