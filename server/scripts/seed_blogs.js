import { prisma } from "../config/prisma.js";
import dotenv from "dotenv";
import logger from "../utils/logger.js";

dotenv.config();

const blogs = [
  {
    title: "RISING STARS: KISHORE JENA AND NEERAJ CHOPRA",
    subtitle: "A deep dive into India's javelin dominance.",
    content: "Full analysis of the recent performance...",
    imageUrl:
      "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&q=80",
    readTime: "2 MINS READ",
    category: "Sports",
    views: 1200,
    likes: 450,
    order: 1,
  },
  {
    title: "EMPOWERING INNINGS: THE RISE OF WOMEN'S CRICKET",
    subtitle: "How the women's game is taking center stage.",
    content: "Detailed report on the evolution...",
    imageUrl:
      "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=80",
    readTime: "3 MINS READ",
    category: "Cricket",
    views: 890,
    likes: 312,
    order: 2,
  },
  {
    title: "AND THAT WAS THE FINAL: ANALYZING THE CLASH",
    subtitle: "Tactical breakdown of the championship match.",
    content: "Every move analyzed...",
    imageUrl:
      "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&q=80",
    readTime: "1 MIN READ",
    category: "Football",
    views: 2400,
    likes: 890,
    order: 3,
  },
  {
    title: "CRICKETING GLORY: INDIA'S WORLD CUP JOURNEY",
    subtitle: "A journey through the historic victory.",
    content: "The path to the trophy...",
    imageUrl:
      "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=80",
    readTime: "5 MINS READ",
    category: "Cricket",
    views: 3100,
    likes: 1200,
    order: 4,
  },
];

const seedBlogs = async () => {
  try {
    logger.info("Seeding blogs with Prisma...");

    await prisma.blog.deleteMany({});
    logger.info("Cleared existing blogs.");

    await prisma.blog.createMany({
      data: blogs,
    });
    logger.info("Successfully seeded blogs!");

    process.exit(0);
  } catch (error) {
    logger.error("Error seeding blogs:", error);
    process.exit(1);
  }
};

seedBlogs();
