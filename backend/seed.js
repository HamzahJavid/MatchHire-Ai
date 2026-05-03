require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const HirerProfile = require("./models/HirerProfile");
const Job = require("./models/Job");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/matchhire";

const dummyUsers = [
    {
        email: "seeker1@matchhire.com",
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
        email: "seeker2@matchhire.com",
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
        email: "seeker3@matchhire.com",
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
        email: "recruiter1@matchhire.com",
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
        email: "recruiter2@matchhire.com",
        password: "password123",
        fullName: "Sarah Brown",
        phone: "555-0202",
        hasSeeker: false,
        hasHirer: true,
        activeMode: "hirer",
        isEmailVerified: true,
        isActive: true,
    },
    {
        email: "both@matchhire.com",
        password: "password123",
        fullName: "Emma Wilson",
        phone: "555-0301",
        hasSeeker: true,
        hasHirer: true,
        activeMode: "seeker",
        isEmailVerified: true,
        isActive: true,
    },
];

async function seedDatabase() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB");

        // Clear existing data
        await User.deleteMany({});
        await HirerProfile.deleteMany({});
        await Job.deleteMany({});
        console.log("Cleared existing data");

        // Insert dummy users
        const createdUsers = await User.insertMany(dummyUsers);
        console.log(`✅ Created ${createdUsers.length} dummy users:`);

        createdUsers.forEach((user) => {
            console.log(`   - ${user.fullName} (${user.email})`);
        });

        // Create hirer profiles for recruiter users
        const recruiter1 = createdUsers.find((u) => u.email === "recruiter1@matchhire.com");
        const recruiter2 = createdUsers.find((u) => u.email === "recruiter2@matchhire.com");

        const hirerProfiles = await HirerProfile.insertMany([
            {
                user: recruiter1._id,
                companyName: "Tech Corp",
                companyWebsite: "https://techcorp.com",
                industry: "Technology",
                companySize: "100-500",
                location: {
                    city: "San Francisco",
                    country: "USA",
                },
            },
            {
                user: recruiter2._id,
                companyName: "Innovation Labs",
                companyWebsite: "https://innovationlabs.com",
                industry: "Software Development",
                companySize: "50-100",
                location: {
                    city: "New York",
                    country: "USA",
                },
            },
        ]);

        console.log(`✅ Created ${hirerProfiles.length} hirer profiles`);

        // Create dummy jobs
        const dummyJobs = [
            {
                hirer: hirerProfiles[0]._id,
                postedBy: recruiter1._id,
                title: "Senior React Developer",
                company: "Tech Corp",
                description:
                    "We are looking for an experienced React developer to join our frontend team. You will work on building scalable web applications.",
                location: {
                    city: "San Francisco",
                    country: "USA",
                    isRemote: false,
                    rangeKm: 50,
                },
                jobType: "full_time",
                salary: {
                    min: 120000,
                    max: 160000,
                    currency: "USD",
                    period: "annual",
                    isVisible: true,
                },
                minExperienceYears: 3,
                educationRequirement: "Bachelors in Computer Science or equivalent",
                requiredSkills: [
                    { name: "React", isMandatory: true, minYears: 2 },
                    { name: "JavaScript", isMandatory: true, minYears: 3 },
                    { name: "TypeScript", isMandatory: false, minYears: 1 },
                    { name: "Redux", isMandatory: false, minYears: 1 },
                ],
                preferredSkills: ["Next.js", "GraphQL", "Testing"],
                status: "active",
                publishedAt: new Date(),
            },
            {
                hirer: hirerProfiles[0]._id,
                postedBy: recruiter1._id,
                title: "Full Stack JavaScript Developer",
                company: "Tech Corp",
                description:
                    "Join our team to develop both frontend and backend solutions using Node.js and React. Work with a talented team of engineers.",
                location: {
                    city: "New York",
                    country: "USA",
                    isRemote: true,
                    rangeKm: 0,
                },
                jobType: "full_time",
                salary: {
                    min: 100000,
                    max: 140000,
                    currency: "USD",
                    period: "annual",
                    isVisible: true,
                },
                minExperienceYears: 2,
                educationRequirement: "Bachelors in Computer Science or equivalent",
                requiredSkills: [
                    { name: "JavaScript", isMandatory: true, minYears: 2 },
                    { name: "Node.js", isMandatory: true, minYears: 1 },
                    { name: "React", isMandatory: true, minYears: 2 },
                    { name: "MongoDB", isMandatory: false, minYears: 1 },
                ],
                preferredSkills: ["Express.js", "Jest", "Docker", "AWS"],
                status: "active",
                publishedAt: new Date(),
            },
            {
                hirer: hirerProfiles[0]._id,
                postedBy: recruiter1._id,
                title: "Backend Engineer - Python",
                company: "Tech Corp",
                description:
                    "We need a talented backend engineer to work with Python and develop scalable APIs. Experience with microservices is a plus.",
                location: {
                    city: "Austin",
                    country: "USA",
                    isRemote: true,
                },
                jobType: "full_time",
                salary: {
                    min: 110000,
                    max: 150000,
                    currency: "USD",
                    period: "annual",
                    isVisible: true,
                },
                minExperienceYears: 3,
                educationRequirement: "Bachelors in Computer Science or equivalent",
                requiredSkills: [
                    { name: "Python", isMandatory: true, minYears: 3 },
                    { name: "FastAPI", isMandatory: false, minYears: 1 },
                    { name: "PostgreSQL", isMandatory: true, minYears: 2 },
                    { name: "REST APIs", isMandatory: true, minYears: 2 },
                ],
                preferredSkills: ["Docker", "Kubernetes", "Redis", "AWS"],
                status: "active",
                publishedAt: new Date(),
            },
            {
                hirer: hirerProfiles[1]._id,
                postedBy: recruiter2._id,
                title: "Mobile Developer - React Native",
                company: "Innovation Labs",
                description:
                    "Build beautiful cross-platform mobile applications using React Native. Work with iOS and Android platforms.",
                location: {
                    city: "Seattle",
                    country: "USA",
                    isRemote: false,
                    rangeKm: 30,
                },
                jobType: "full_time",
                salary: {
                    min: 100000,
                    max: 130000,
                    currency: "USD",
                    period: "annual",
                    isVisible: true,
                },
                minExperienceYears: 2,
                educationRequirement: "Bachelors in Computer Science or equivalent",
                requiredSkills: [
                    { name: "React Native", isMandatory: true, minYears: 2 },
                    { name: "JavaScript", isMandatory: true, minYears: 2 },
                    { name: "iOS", isMandatory: false, minYears: 1 },
                    { name: "Android", isMandatory: false, minYears: 1 },
                ],
                preferredSkills: ["TypeScript", "Redux", "Firebase"],
                status: "active",
                publishedAt: new Date(),
            },
            {
                hirer: hirerProfiles[1]._id,
                postedBy: recruiter2._id,
                title: "DevOps Engineer",
                company: "Innovation Labs",
                description:
                    "Help us scale our infrastructure. Work with cloud platforms, containerization, and CI/CD pipelines.",
                location: {
                    city: "Denver",
                    country: "USA",
                    isRemote: true,
                },
                jobType: "full_time",
                salary: {
                    min: 130000,
                    max: 170000,
                    currency: "USD",
                    period: "annual",
                    isVisible: true,
                },
                minExperienceYears: 3,
                educationRequirement: "Bachelors in Computer Science or equivalent",
                requiredSkills: [
                    { name: "Docker", isMandatory: true, minYears: 2 },
                    { name: "Kubernetes", isMandatory: true, minYears: 2 },
                    { name: "AWS", isMandatory: false, minYears: 2 },
                    { name: "Linux", isMandatory: true, minYears: 3 },
                ],
                preferredSkills: ["Terraform", "Jenkins", "Prometheus", "Grafana"],
                status: "active",
                publishedAt: new Date(),
            },
            {
                hirer: hirerProfiles[1]._id,
                postedBy: recruiter2._id,
                title: "Junior Software Developer",
                company: "Innovation Labs",
                description:
                    "Start your career with us! We are looking for motivated junior developers to join our team. We provide mentorship and training.",
                location: {
                    city: "San Francisco",
                    country: "USA",
                    isRemote: false,
                    rangeKm: 50,
                },
                jobType: "full_time",
                salary: {
                    min: 70000,
                    max: 90000,
                    currency: "USD",
                    period: "annual",
                    isVisible: true,
                },
                minExperienceYears: 0,
                educationRequirement: "Bachelors in Computer Science or equivalent",
                requiredSkills: [
                    { name: "JavaScript", isMandatory: true, minYears: 0 },
                    { name: "HTML", isMandatory: true, minYears: 0 },
                    { name: "CSS", isMandatory: true, minYears: 0 },
                ],
                preferredSkills: ["React", "Git", "REST API"],
                status: "active",
                publishedAt: new Date(),
            },
        ];

        const createdJobs = await Job.insertMany(dummyJobs);
        console.log(`✅ Created ${createdJobs.length} dummy jobs`);

        await mongoose.connection.close();
        console.log("\n✅ Database seeding complete!");
    } catch (error) {
        console.error("Error seeding database:", error);
        process.exit(1);
    }
}

seedDatabase();
