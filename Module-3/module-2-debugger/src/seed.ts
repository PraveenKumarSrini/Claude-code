import { getDb } from "./db";

const db = getDb();

// Clear existing data and reset autoincrement counters
db.exec("DELETE FROM posts");
db.exec("DELETE FROM users");
db.exec("DELETE FROM sqlite_sequence WHERE name IN ('users', 'posts')");

// Seed users — 50 users to amplify N+1 query cost
const insertUser = db.prepare(
  "INSERT INTO users (name, email) VALUES (?, ?)"
);

const firstNames = ["Alice", "Bob", "Carol", "Dan", "Eve", "Frank", "Grace", "Henry", "Iris", "Jack"];
const lastNames = ["Chen", "Smith", "Davis", "Wilson", "Martinez", "Brown", "Taylor", "Anderson", "Thomas", "Jackson"];

const users: { name: string; email: string }[] = [];
for (let i = 0; i < 50; i++) {
  const first = firstNames[i % firstNames.length];
  const last = lastNames[Math.floor(i / firstNames.length) % lastNames.length];
  const name = `${first} ${last}${i >= 10 ? ` ${Math.floor(i / 10) + 1}` : ""}`;
  users.push({ name, email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@example.com` });
}

const userIds: number[] = [];
for (const user of users) {
  const result = insertUser.run(user.name, user.email);
  userIds.push(result.lastInsertRowid as number);
}

// Seed posts — 5000 posts to make N+1 cost clearly visible
const insertPost = db.prepare(
  "INSERT INTO posts (title, body, authorId) VALUES (?, ?, ?)"
);

const topics = [
  "Getting Started with TypeScript",
  "Understanding Async/Await",
  "Building REST APIs with Express",
  "Database Design Patterns",
  "Error Handling Best Practices",
  "Testing Strategies for Node.js",
  "Performance Optimization Tips",
  "Security Considerations for APIs",
  "Deploying to Production",
  "Monitoring and Logging",
];

const POST_COUNT = 5000;

// Wrap in a transaction for fast bulk insert
const seedPosts = db.transaction(() => {
  for (let i = 0; i < POST_COUNT; i++) {
    const topic = topics[i % topics.length];
    const authorId = userIds[i % userIds.length];
    const num = Math.floor(i / topics.length) + 1;
    insertPost.run(
      `${topic} (Part ${num})`,
      `This is post ${i + 1} about ${topic.toLowerCase()}. It covers important concepts that every developer should know.`,
      authorId
    );
  }
});

seedPosts();

console.log(`Seeded ${users.length} users and ${POST_COUNT} posts.`);
console.log(`\nUsers:`);
for (const user of users) {
  console.log(`  - ${user.name} (${user.email})`);
}
console.log(`\nRun 'npm run dev' to start the server.`);
