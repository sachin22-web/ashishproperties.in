import { MongoClient, ObjectId } from "mongodb";

async function run() {
  const url =
    "mongodb+srv://Aashishpropeorty:SACHIN123@property.zn2cowc.mongodb.net/?retryWrites=true&w=majority";
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db("aashish_property");
    const sellerId = "68ce32cae218c62c317756a0";

    const property = {
      title: "Test Property from Seed",
      description: "A test property created by seed script",
      price: 5000000,
      priceType: "sale",
      propertyType: "residential",
      subCategory: "2bhk",
      location: { address: "Test Address" },
      specifications: { area: 1200 },
      images: [],
      amenities: [],
      ownerId: sellerId,
      ownerType: "seller",
      contactInfo: {
        name: "Test Seller",
        phone: "+91 9876543211",
        email: "seller@test.com",
      },
      status: "active",
      approvalStatus: "approved",
      featured: false,
      premium: false,
      contactVisible: true,
      views: 42,
      inquiries: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const res = await db.collection("properties").insertOne(property);
    console.log("Inserted property id:", res.insertedId.toString());
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

run();
