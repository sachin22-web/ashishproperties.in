#!/usr/bin/env tsx
import { connectToDatabase, closeDatabaseConnection } from "../db/mongodb";
import { ObjectId } from "mongodb";

async function fixDuplicateEmails() {
  console.log("🔄 Fixing duplicate and empty email addresses...");
  
  try {
    const { db } = await connectToDatabase();
    console.log("✅ Connected to database");

    // 1. Find users with empty or null emails
    const usersWithEmptyEmails = await db.collection("users").find({
      $or: [
        { email: "" },
        { email: null },
        { email: { $exists: false } }
      ]
    }).toArray();
    
    console.log(`Found ${usersWithEmptyEmails.length} users with empty emails`);

    // 2. Generate unique emails for users without emails
    for (let i = 0; i < usersWithEmptyEmails.length; i++) {
      const user = usersWithEmptyEmails[i];
      const uniqueEmail = `user_${user._id}@temp.local`;
      
      await db.collection("users").updateOne(
        { _id: user._id },
        { 
          $set: { 
            email: uniqueEmail,
            emailGenerated: true,
            updatedAt: new Date()
          }
        }
      );
      
      console.log(`Fixed user ${user._id}: ${uniqueEmail}`);
    }

    // 3. Find and fix duplicate emails
    const duplicateEmails = await db.collection("users").aggregate([
      { $match: { email: { $ne: "" } } },
      { $group: { _id: "$email", count: { $sum: 1 }, users: { $push: "$$ROOT" } } },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();

    console.log(`Found ${duplicateEmails.length} duplicate email groups`);

    for (const group of duplicateEmails) {
      const users = group.users;
      console.log(`Fixing duplicate email: ${group._id} (${users.length} users)`);
      
      // Keep the first user, update others
      for (let i = 1; i < users.length; i++) {
        const user = users[i];
        const uniqueEmail = `${group._id.split('@')[0]}_${user._id}@${group._id.split('@')[1]}`;
        
        await db.collection("users").updateOne(
          { _id: user._id },
          { 
            $set: { 
              email: uniqueEmail,
              emailUpdated: true,
              originalEmail: group._id,
              updatedAt: new Date()
            }
          }
        );
        
        console.log(`  Updated user ${user._id}: ${uniqueEmail}`);
      }
    }

    console.log("✅ Email issues fixed successfully");
    
  } catch (error) {
    console.error("❌ Failed to fix emails:", error);
    throw error;
  } finally {
    await closeDatabaseConnection();
  }
}

// Run the fix
fixDuplicateEmails()
  .then(() => {
    console.log("🎉 Email fixes completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Email fix failed:", error);
    process.exit(1);
  });
